import { differenceInCalendarDays, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Person, Platoon, Rank, VehicleConfig, VehicleId, RANK_LABELS } from './types';

const REFERENCE_DATE = new Date(2026, 1, 12); // Feb 12, 2026 = Platoon A
const PLATOONS: Platoon[] = ['A', 'B', 'C'];

export function getPlatoonForDate(date: Date): Platoon {
  const diff = differenceInCalendarDays(date, REFERENCE_DATE);
  const mod = ((diff % 3) + 3) % 3;
  return PLATOONS[mod];
}

export function distribute(
  personnel: Person[],
  configs: VehicleConfig[],
  date: Date = new Date()
): Record<VehicleId, Person[]> {
  const present = personnel
    .filter(p => p.isPresent)
    .sort((a, b) => a.priority - b.priority);

  // Calculate rotation cycle: shifts every 3 days for fair distribution
  const daysSinceRef = Math.abs(differenceInCalendarDays(date, REFERENCE_DATE));
  const rotationCycle = Math.floor(daysSinceRef / 3);

  const byRank: Record<Rank, Person[]> = {
    lieutenant: [],
    sergeant: [],
    corporal: [],
    heavyDriver: [],
    lightDriver: [],
    agent: [],
  };

  for (const p of present) {
    byRank[p.rank].push(p);
  }

  // Rotate each rank group for fair distribution across cycles
  for (const rank of Object.keys(byRank) as Rank[]) {
    byRank[rank] = rotateArray(byRank[rank], rotationCycle);
  }

  const assignments: Record<string, Person[]> = {};
  const activeConfigs = configs.filter(c => c.isActive);

  for (const config of activeConfigs) {
    assignments[config.id] = [];
  }

  const assign = (vehicleId: string, person: Person | undefined) => {
    if (person && assignments[vehicleId]) {
      assignments[vehicleId].push(person);
    }
  };

  // 1. Guard office: lieutenant + sergeant
  if (activeConfigs.find(c => c.id === 'guard')) {
    assign('guard', byRank.lieutenant.shift());
    assign('guard', byRank.sergeant.shift());
  }

  // 2. Ambulances: light driver + corporal + agents
  const ambulanceIds: VehicleId[] = ['ambulance1', 'ambulance2', 'ambulance3', 'ambulance4'];
  for (const ambId of ambulanceIds) {
    const config = activeConfigs.find(c => c.id === ambId);
    if (!config) continue;

    let driver = byRank.lightDriver.shift();
    if (!driver && (ambId === 'ambulance3' || ambId === 'ambulance4')) {
      driver = byRank.heavyDriver.shift();
    }
    assign(ambId, driver);
    assign(ambId, byRank.corporal.shift());
    for (let i = 0; i < config.agentCount; i++) {
      assign(ambId, byRank.agent.shift());
    }
  }

  // 3. VL: light driver (fallback to heavy)
  if (activeConfigs.find(c => c.id === 'vl')) {
    let driver = byRank.lightDriver.shift();
    if (!driver) driver = byRank.heavyDriver.shift();
    assign('vl', driver);
  }

  // 4. Trucks: heavy driver + sergeant + corporals + agents
  const truckIds: VehicleId[] = ['ps', 'ccfm', 'cci'];
  for (const truckId of truckIds) {
    const config = activeConfigs.find(c => c.id === truckId);
    if (!config) continue;

    assign(truckId, byRank.heavyDriver.shift());
    assign(truckId, byRank.sergeant.shift());
    for (let i = 0; i < config.corporalCount; i++) {
      assign(truckId, byRank.corporal.shift());
    }
    for (let i = 0; i < config.agentCount; i++) {
      assign(truckId, byRank.agent.shift());
    }
  }

  return assignments as Record<VehicleId, Person[]>;
}

export function getReserve(
  personnel: Person[],
  assignments: Record<VehicleId, Person[]>
): Person[] {
  const assignedIds = new Set(
    Object.values(assignments).flat().map(p => p.id)
  );
  return personnel.filter(p => p.isPresent && !assignedIds.has(p.id));
}

// ─── Guard Schedule (6 periods, 08:00–20:00) ───

export interface GuardPeriod {
  label: string;
  startHour: number;
  endHour: number;
  isCritical: boolean;
}

export interface GuardSlot {
  period: GuardPeriod;
  personnel: Person[];
}

export const GUARD_PERIODS: GuardPeriod[] = [
  { label: '08:00 - 10:00', startHour: 8, endHour: 10, isCritical: true },
  { label: '10:00 - 12:00', startHour: 10, endHour: 12, isCritical: false },
  { label: '12:00 - 14:00', startHour: 12, endHour: 14, isCritical: false },
  { label: '14:00 - 16:00', startHour: 14, endHour: 16, isCritical: false },
  { label: '16:00 - 18:00', startHour: 16, endHour: 18, isCritical: false },
  { label: '18:00 - 20:00', startHour: 18, endHour: 20, isCritical: true },
];

/**
 * Generates a fair guard duty schedule for the given date.
 * 
 * Fairness rules:
 * 1. ALL reserve personnel (agents, corporals, drivers) participate in guard duty
 * 2. Personnel rotate DAILY (not every 3 days) so each day within the same
 *    platoon cycle gets different period assignments
 * 3. Personnel are distributed evenly across all 6 periods using round-robin
 * 4. The starting position shifts each day so no one always gets the same period
 * 5. In shortage: corporals are prioritized for critical periods (08-10, 18-20)
 */
export function generateGuardSchedule(
  date: Date,
  reserve: Person[]
): GuardSlot[] {
  if (reserve.length === 0) {
    return GUARD_PERIODS.map(period => ({ period, personnel: [] }));
  }

  // Daily rotation offset for maximum fairness
  const daysSinceRef = Math.abs(differenceInCalendarDays(date, REFERENCE_DATE));

  // Separate by capability
  const agents = reserve.filter(p => p.rank === 'agent');
  const corporals = reserve.filter(p => p.rank === 'corporal');
  const others = reserve.filter(p => p.rank !== 'agent' && p.rank !== 'corporal');

  // Combine all available personnel, agents first, then others, then corporals last (backup)
  const allAvailable = [...agents, ...others];
  
  // Rotate the list daily for fair period assignment
  const rotated = rotateArray(allAvailable, daysSinceRef);

  const totalPeriods = GUARD_PERIODS.length;

  // Distribute evenly: round-robin across periods
  const slots: GuardSlot[] = GUARD_PERIODS.map(period => ({ period, personnel: [] }));

  rotated.forEach((person, idx) => {
    // Shift starting period each day for extra fairness
    const periodIdx = (idx + daysSinceRef) % totalPeriods;
    slots[periodIdx].personnel.push(person);
  });

  // Shortage protocol: if any period is empty, fill critical ones with corporals
  if (corporals.length > 0) {
    const rotatedCorporals = rotateArray(corporals, daysSinceRef);
    let corpIdx = 0;

    // First pass: fill empty critical periods
    for (const slot of slots) {
      if (slot.period.isCritical && slot.personnel.length === 0 && corpIdx < rotatedCorporals.length) {
        slot.personnel.push(rotatedCorporals[corpIdx++]);
      }
    }

    // Second pass: balance - if some periods have 0 and corporals remain, fill any empty
    for (const slot of slots) {
      if (slot.personnel.length === 0 && corpIdx < rotatedCorporals.length) {
        slot.personnel.push(rotatedCorporals[corpIdx++]);
      }
    }
  }

  return slots;
}

function rotateArray<T>(arr: T[], offset: number): T[] {
  if (arr.length === 0) return [];
  const n = offset % arr.length;
  return [...arr.slice(n), ...arr.slice(0, n)];
}

export function formatForWhatsApp(
  date: Date,
  platoon: Platoon,
  assignments: Record<VehicleId, Person[]>,
  configs: VehicleConfig[],
  reserve: Person[],
  guardSchedule?: GuardSlot[]
): string {
  const dateStr = format(date, 'yyyy/MM/dd');
  let text = `📋 توزيع حراسة يوم ${dateStr}\n`;
  text += `🔷 الفصيلة: ${platoon}\n`;
  text += `${'─'.repeat(20)}\n\n`;

  for (const config of configs) {
    if (!config.isActive) continue;
    const crew = assignments[config.id] || [];
    if (crew.length === 0) continue;

    text += `${config.icon} ${config.nameAr}:\n`;
    for (const p of crew) {
      text += `  • ${RANK_LABELS[p.rank]}: ${p.name}\n`;
    }
    text += '\n';
  }

  if (reserve.length > 0) {
    text += `🔄 الاحتياط:\n`;
    for (const p of reserve) {
      text += `  • ${RANK_LABELS[p.rank]}: ${p.name}\n`;
    }
    text += '\n';
  }

  if (guardSchedule && guardSchedule.length > 0) {
    text += `${'─'.repeat(20)}\n`;
    text += `🕐 جدول الحراسة الدورية:\n\n`;
    for (const slot of guardSchedule) {
      const names = slot.personnel.map(p => `${RANK_LABELS[p.rank]}: ${p.name}`).join(' / ');
      const marker = slot.period.isCritical ? '⚠️' : '🟢';
      text += `${marker} ${slot.period.label} → ${names || 'لا أحد'}\n`;
    }
    text += '\n';
  }

  text += '📌 KOUDJA';
  return text;
}
