import { useMemo } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';
import { Person, VehicleConfig, RANK_LABELS, RANK_BADGE_STYLES } from '@/lib/types';
import { getMonthlyGuardStats, GuardStat } from '@/lib/guardStats';
import { cn } from '@/lib/utils';

interface GuardStatsProps {
  date: Date;
  personnel: Person[];
  vehicleConfigs: VehicleConfig[];
}

export function GuardStats({ date, personnel, vehicleConfigs }: GuardStatsProps) {
  const stats = useMemo(
    () => getMonthlyGuardStats(date, personnel, vehicleConfigs),
    [date, personnel, vehicleConfigs]
  );

  const maxCount = stats.length > 0 ? stats[0].count : 0;
  const monthName = format(date, 'MMMM yyyy', { locale: ar });

  if (stats.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        لا توجد بيانات حراسة لهذا الشهر
      </div>
    );
  }

  // Calculate fairness indicator
  const counts = stats.map(s => s.count);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
  const fairnessScore = maxCount > 0 ? Math.max(0, 100 - (Math.sqrt(variance) / avg) * 100) : 100;

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>إحصائيات شهر <strong className="text-foreground">{monthName}</strong></span>
        </div>
        <span
          className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
            fairnessScore >= 80
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : fairnessScore >= 50
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-red-500/15 text-red-400 border-red-500/30'
          )}
        >
          عدالة: {Math.round(fairnessScore)}%
        </span>
      </div>

      {/* Stats list */}
      <div className="space-y-1.5">
        {stats.map((stat) => (
          <div
            key={stat.person.id}
            className="flex items-center gap-2 rounded-lg bg-card border border-border p-2"
          >
            <span
              className={cn(
                'text-[9px] rounded px-1.5 py-0.5 font-semibold border whitespace-nowrap',
                RANK_BADGE_STYLES[stat.person.rank]
              )}
            >
              {RANK_LABELS[stat.person.rank]}
            </span>
            <span className="text-[11px] font-medium truncate flex-1">
              {stat.person.name}
            </span>
            <div className="flex items-center gap-2 min-w-[80px]">
              <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${maxCount > 0 ? (stat.count / maxCount) * 100 : 0}%` }}
                />
              </div>
              <span className="text-[11px] font-bold tabular-nums w-5 text-end">
                {stat.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="text-[10px] text-muted-foreground text-center pt-1">
        المعدّل: {avg.toFixed(1)} مرة/فرد • الحد الأقصى: {maxCount} • الحد الأدنى: {counts[counts.length - 1]}
      </div>
    </div>
  );
}
