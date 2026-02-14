import { GuardSlot } from '@/lib/rotation';
import { RANK_LABELS, RANK_BADGE_STYLES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, Shield } from 'lucide-react';

interface GuardScheduleProps {
  slots: GuardSlot[];
}

export function GuardSchedule({ slots }: GuardScheduleProps) {
  const totalPersonnel = slots.reduce((sum, s) => sum + s.personnel.length, 0);

  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>
            الفترات: <strong className="text-foreground">6</strong>
          </span>
        </div>
        <span>•</span>
        <span>
          المكلّفون: <strong className="text-foreground">{totalPersonnel}</strong>
        </span>
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            className={cn(
              'rounded-xl border bg-card p-3 transition-all',
              slot.period.isCritical
                ? 'border-accent/40 bg-accent/5'
                : 'border-border'
            )}
          >
            {/* Period header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {slot.period.isCritical ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums',
                    slot.period.isCritical ? 'text-accent' : 'text-foreground'
                  )}
                  dir="ltr"
                >
                  {slot.period.label}
                </span>
              </div>
              {slot.period.isCritical && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/30">
                  فترة حرجة
                </span>
              )}
            </div>

            {/* Assigned personnel */}
            {slot.personnel.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {slot.personnel.map((p) => (
                  <span
                    key={p.id}
                    className={cn(
                      'text-[10px] rounded-full px-2.5 py-1 border font-medium',
                      RANK_BADGE_STYLES[p.rank]
                    )}
                  >
                    {RANK_LABELS[p.rank]} - {p.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic">
                لا يوجد أفراد لهذه الفترة
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-accent" />
          <span>فترة حرجة (عريف محتمل)</span>
        </div>
        <div className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          <span>فترة عادية</span>
        </div>
      </div>
    </div>
  );
}
