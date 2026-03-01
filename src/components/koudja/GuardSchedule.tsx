import { GuardSlot } from '@/lib/rotation';
import { RANK_LABELS, RANK_BADGE_STYLES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Clock, Shield, User, Users } from 'lucide-react';

interface GuardScheduleProps {
  slots: GuardSlot[];
  personnelPerPeriod: number[];
  onPersonnelPerPeriodChange: (index: number, value: number) => void;
}

export function GuardSchedule({ slots, personnelPerPeriod, onPersonnelPerPeriodChange }: GuardScheduleProps) {
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
            className="rounded-xl border bg-card p-3 transition-all border-border"
          >
            {/* Period header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span
                  className="text-sm font-bold tabular-nums text-foreground"
                  dir="ltr"
                >
                  {slot.period.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {/* Toggle 1 or 2 agents */}
                <button
                  onClick={() => onPersonnelPerPeriodChange(idx, personnelPerPeriod[idx] === 1 ? 2 : 1)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors',
                    personnelPerPeriod[idx] === 2
                      ? 'bg-primary/15 text-primary border-primary/30'
                      : 'bg-secondary text-muted-foreground border-border'
                  )}
                >
                  {personnelPerPeriod[idx] === 2 ? (
                    <><Users className="h-3 w-3" /> عونين</>
                  ) : (
                    <><User className="h-3 w-3" /> عون</>
                  )}
                </button>
              </div>
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
          <Shield className="h-3 w-3" />
          <span>فترة حراسة</span>
        </div>
      </div>
    </div>
  );
}
