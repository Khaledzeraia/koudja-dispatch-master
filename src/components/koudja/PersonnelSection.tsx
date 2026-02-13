import { Person, Rank, RANK_LABELS, RANK_BADGE_STYLES, RANK_ORDER } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { UserCheck, UserX } from 'lucide-react';

interface PersonnelSectionProps {
  personnel: Person[];
  onTogglePresence: (id: string) => void;
}

export function PersonnelSection({ personnel, onTogglePresence }: PersonnelSectionProps) {
  const presentCount = personnel.filter(p => p.isPresent).length;
  const absentCount = personnel.length - presentCount;

  return (
    <div className="p-3 space-y-3">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 text-success">
          <UserCheck className="h-3.5 w-3.5" />
          <span>حاضر: <strong>{presentCount}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-destructive">
          <UserX className="h-3.5 w-3.5" />
          <span>غائب: <strong>{absentCount}</strong></span>
        </div>
      </div>

      {/* Grouped by rank */}
      {RANK_ORDER.map((rank) => {
        const people = personnel.filter(p => p.rank === rank);
        if (people.length === 0) return null;
        const presentInRank = people.filter(p => p.isPresent).length;

        return (
          <div key={rank} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground">{RANK_LABELS[rank]}</h3>
              <span className="text-[10px] text-muted-foreground">
                {presentInRank}/{people.length}
              </span>
            </div>
            <div className="space-y-1">
              {people.map((person) => (
                <div
                  key={person.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border bg-card px-3 py-2 transition-all duration-200',
                    person.isPresent
                      ? 'border-border'
                      : 'border-destructive/20 opacity-50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[9px] rounded px-1.5 py-0.5 font-semibold border whitespace-nowrap',
                        RANK_BADGE_STYLES[person.rank]
                      )}
                    >
                      {RANK_LABELS[person.rank]}
                    </span>
                    <span className="text-sm font-medium">{person.name}</span>
                  </div>
                  <Switch
                    checked={person.isPresent}
                    onCheckedChange={() => onTogglePresence(person.id)}
                    className="scale-[0.8]"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
