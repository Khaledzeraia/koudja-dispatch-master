import { startOfMonth, endOfMonth, eachDayOfInterval, differenceInCalendarDays } from 'date-fns';
import { Person, VehicleConfig, VehicleId } from './types';
import { getPlatoonForDate, distribute, generateGuardSchedule } from './rotation';

export interface GuardStat {
  person: Person;
  count: number;
}

/**
 * Calculates how many times each person in the current platoon
 * was assigned to guard duty during the month of the given date.
 */
export function getMonthlyGuardStats(
  date: Date,
  allPersonnel: Person[],
  vehicleConfigs: VehicleConfig[]
): GuardStat[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const targetPlatoon = getPlatoonForDate(date);
  const platoonPersonnel = allPersonnel.filter(p => p.platoon === targetPlatoon);

  const countMap = new Map<string, number>();
  for (const p of platoonPersonnel) {
    countMap.set(p.id, 0);
  }

  const excludedVehicles: VehicleId[] = ['guard', 'vl'];

  for (const day of days) {
    if (getPlatoonForDate(day) !== targetPlatoon) continue;

    const assignments = distribute(platoonPersonnel, vehicleConfigs, day);
    const excluded = new Set(
      excludedVehicles.flatMap(id => (assignments[id] || []).map(p => p.id))
    );
    const schedule = generateGuardSchedule(day, platoonPersonnel, excluded);

    for (const slot of schedule) {
      for (const p of slot.personnel) {
        countMap.set(p.id, (countMap.get(p.id) || 0) + 1);
      }
    }
  }

  return platoonPersonnel
    .map(p => ({ person: p, count: countMap.get(p.id) || 0 }))
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);
}
