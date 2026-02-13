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

export function formatForWhatsApp(
  date: Date,
  platoon: Platoon,
  assignments: Record<VehicleId, Person[]>,
  configs: VehicleConfig[],
  reserve: Person[]
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

  text += '📌 KOUDJA';
  return text;
}
