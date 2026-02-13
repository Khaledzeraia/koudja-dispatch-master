import { cn } from '@/lib/utils';
import { Person, VehicleConfig, VehicleId, RANK_LABELS, RANK_BADGE_STYLES } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus } from 'lucide-react';

interface VehicleColumnProps {
  config: VehicleConfig;
  crew: Person[];
  onToggleActive: (id: VehicleId) => void;
  onUpdateConfig: (id: VehicleId, updates: Partial<VehicleConfig>) => void;
}

const VEHICLE_BORDER_COLORS: Record<string, string> = {
  guard: 'border-t-amber-500',
  ambulance1: 'border-t-emerald-500',
  ambulance2: 'border-t-emerald-500',
  ambulance3: 'border-t-emerald-500',
  ambulance4: 'border-t-emerald-500',
  vl: 'border-t-cyan-500',
  ps: 'border-t-red-500',
  ccfm: 'border-t-orange-500',
  cci: 'border-t-rose-500',
};

function CountControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-5 w-5 rounded bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="text-xs font-bold w-5 text-center">{value}</span>
        <button
          onClick={() => onChange(Math.min(3, value + 1))}
          className="h-5 w-5 rounded bg-secondary flex items-center justify-center text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function VehicleColumn({ config, crew, onToggleActive, onUpdateConfig }: VehicleColumnProps) {
  const borderColor = VEHICLE_BORDER_COLORS[config.id] || 'border-t-primary';
  const showAgentControl = config.id !== 'guard' && config.id !== 'vl';
  const showCorporalControl = config.id === 'ps' || config.id === 'ccfm' || config.id === 'cci';

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden border-t-2 transition-all duration-200 animate-fade-in',
        borderColor,
        !config.isActive && 'opacity-40 grayscale'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2.5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{config.icon}</span>
          <span className="font-bold text-xs">{config.nameAr}</span>
        </div>
        <Switch
          checked={config.isActive}
          onCheckedChange={() => onToggleActive(config.id)}
          className="scale-75"
        />
      </div>

      {/* Content */}
      {config.isActive ? (
        <div className="p-2.5 space-y-1.5 min-h-[80px]">
          {crew.length === 0 ? (
            <p className="text-[10px] text-muted-foreground text-center py-4">لا يوجد طاقم</p>
          ) : (
            crew.map((person, idx) => (
              <div
                key={person.id}
                className="flex items-center gap-1.5 rounded-lg bg-secondary/40 px-2 py-1.5"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <span
                  className={cn(
                    'text-[9px] rounded px-1.5 py-0.5 font-semibold border whitespace-nowrap',
                    RANK_BADGE_STYLES[person.rank]
                  )}
                >
                  {RANK_LABELS[person.rank]}
                </span>
                <span className="text-[11px] font-medium truncate">{person.name}</span>
              </div>
            ))
          )}

          {/* Controls */}
          {(showAgentControl || showCorporalControl) && (
            <div className="border-t border-border pt-2 mt-2 space-y-1">
              {showCorporalControl && (
                <CountControl
                  label="عرفاء"
                  value={config.corporalCount}
                  onChange={(v) => onUpdateConfig(config.id, { corporalCount: v })}
                />
              )}
              {showAgentControl && (
                <CountControl
                  label="أعوان"
                  value={config.agentCount}
                  onChange={(v) => onUpdateConfig(config.id, { agentCount: v })}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center">
          <span className="text-xs font-bold text-destructive">خارج الخدمة</span>
        </div>
      )}
    </div>
  );
}
