import { Person, VehicleConfig, VehicleId, RANK_BADGE_STYLES, RANK_LABELS } from '@/lib/types';
import { VehicleColumn } from './VehicleColumn';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface DistributionBoardProps {
  assignments: Record<VehicleId, Person[]>;
  vehicleConfigs: VehicleConfig[];
  reserve: Person[];
  onToggleActive: (id: VehicleId) => void;
  onUpdateConfig: (id: VehicleId, updates: Partial<VehicleConfig>) => void;
}

export function DistributionBoard({
  assignments,
  vehicleConfigs,
  reserve,
  onToggleActive,
  onUpdateConfig,
}: DistributionBoardProps) {
  const totalAssigned = Object.values(assignments).flat().length;

  return (
    <div className="p-3 space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>في المهمة: <strong className="text-foreground">{totalAssigned}</strong></span>
        </div>
        <span>•</span>
        <span>احتياط: <strong className="text-foreground">{reserve.length}</strong></span>
      </div>

      {/* Vehicle grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {vehicleConfigs.map((config) => (
          <VehicleColumn
            key={config.id}
            config={config}
            crew={assignments[config.id] || []}
            onToggleActive={onToggleActive}
            onUpdateConfig={onUpdateConfig}
          />
        ))}
      </div>

      {/* Reserve */}
      {reserve.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 animate-fade-in">
          <h3 className="text-xs font-bold mb-2 text-muted-foreground flex items-center gap-1.5">
            🔄 الاحتياط
            <span className="bg-secondary rounded-full px-1.5 py-0.5 text-[10px]">{reserve.length}</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {reserve.map((p) => (
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
        </div>
      )}
    </div>
  );
}
