export type Rank = 'lieutenant' | 'sergeant' | 'corporal' | 'heavyDriver' | 'lightDriver' | 'agent';
export type Platoon = 'A' | 'B' | 'C';
export type VehicleId = 'guard' | 'ambulance1' | 'ambulance2' | 'ambulance3' | 'ambulance4' | 'vl' | 'ps' | 'ccfm' | 'cci';

export interface Person {
  id: string;
  name: string;
  rank: Rank;
  platoon: Platoon;
  isPresent: boolean;
  priority: number;
}

export interface VehicleConfig {
  id: VehicleId;
  nameAr: string;
  icon: string;
  isActive: boolean;
  agentCount: number;
  corporalCount: number;
}

export const RANK_LABELS: Record<Rank, string> = {
  lieutenant: 'ملازم',
  sergeant: 'رقيب',
  corporal: 'عريف',
  heavyDriver: 'سائق و.ث',
  lightDriver: 'سائق و.خ',
  agent: 'عون تدخل',
};

export const RANK_BADGE_STYLES: Record<Rank, string> = {
  lieutenant: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sergeant: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  corporal: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  heavyDriver: 'bg-red-500/20 text-red-400 border-red-500/30',
  lightDriver: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  agent: 'bg-slate-400/20 text-slate-300 border-slate-400/30',
};

export const RANK_ORDER: Rank[] = ['lieutenant', 'sergeant', 'corporal', 'heavyDriver', 'lightDriver', 'agent'];

export const DEFAULT_VEHICLE_CONFIGS: VehicleConfig[] = [
  { id: 'guard', nameAr: 'مكتب الحراسة', icon: '🏢', isActive: true, agentCount: 0, corporalCount: 0 },
  { id: 'ambulance1', nameAr: 'إسعاف 01', icon: '🚑', isActive: true, agentCount: 1, corporalCount: 0 },
  { id: 'ambulance2', nameAr: 'إسعاف 02', icon: '🚑', isActive: true, agentCount: 1, corporalCount: 0 },
  { id: 'ambulance3', nameAr: 'إسعاف 03', icon: '🚑', isActive: true, agentCount: 1, corporalCount: 0 },
  { id: 'ambulance4', nameAr: 'إسعاف 04', icon: '🚑', isActive: true, agentCount: 0, corporalCount: 0 },
  { id: 'vl', nameAr: 'سيارة VL', icon: '🚗', isActive: true, agentCount: 0, corporalCount: 0 },
  { id: 'ps', nameAr: 'شاحنة PS', icon: '🚒', isActive: true, agentCount: 1, corporalCount: 1 },
  { id: 'ccfm', nameAr: 'شاحنة CCFM', icon: '🚒', isActive: true, agentCount: 1, corporalCount: 1 },
  { id: 'cci', nameAr: 'شاحنة CCI', icon: '🚒', isActive: true, agentCount: 1, corporalCount: 1 },
];
