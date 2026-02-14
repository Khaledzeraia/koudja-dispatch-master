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
  configs: VehicleConfig[]
): Record<VehicleId, Person[]> {
  const present = personnel
    .filter(p => p.isPresent)
    .sort((a, b) => a.priority - b.priority);

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
 * Generates a guard duty schedule for the given date.
 * - Agents rotate every 3 days based on date offset from REFERENCE_DATE.
 * - If not enough agents, corporals fill ONLY critical periods (08-10, 18-20).
 * - Each period gets 2 personnel (adjustable based on available count).
 */
export function generateGuardSchedule(
  date: Date,
  reserve: Person[]
): GuardSlot[] {
  // Separate agents and corporals from reserve
  const agents = reserve.filter(p => p.rank === 'agent');
  const corporals = reserve.filter(p => p.rank === 'corporal');

  // Calculate rotation offset: shifts every 3 days
  const daysSinceRef = Math.abs(differenceInCalendarDays(date, REFERENCE_DATE));
  const rotationCycle = Math.floor(daysSinceRef / 3);

  // Rotate agents list based on cycle
  const rotatedAgents = rotateArray(agents, rotationCycle);

  const totalPeriods = GUARD_PERIODS.length;
  // Determine personnel per period (at least 1 if we have anyone)
  const personnelPerPeriod = Math.max(1, Math.min(2, Math.ceil(rotatedAgents.length / totalPeriods)));

  // Assign agents to periods round-robin style
  let agentIndex = 0;
  const slots: GuardSlot[] = GUARD_PERIODS.map(period => {
    const assigned: Person[] = [];
    for (let i = 0; i < personnelPerPeriod && agentIndex < rotatedAgents.length; i++) {
      assigned.push(rotatedAgents[agentIndex++]);
    }
    return { period, personnel: assigned };
  });

  // If shortage: fill empty/short critical periods with corporals
  if (corporals.length > 0) {
    const rotatedCorporals = rotateArray(corporals, rotationCycle);
    let corpIndex = 0;

    for (const slot of slots) {
      if (slot.period.isCritical && slot.personnel.length < personnelPerPeriod && corpIndex < rotatedCorporals.length) {
        const needed = personnelPerPeriod - slot.personnel.length;
        for (let i = 0; i < needed && corpIndex < rotatedCorporals.length; i++) {
          slot.personnel.push(rotatedCorporals[corpIndex++]);
        }
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
