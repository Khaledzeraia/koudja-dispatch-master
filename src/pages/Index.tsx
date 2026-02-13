import { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Share2, LayoutGrid, Users } from 'lucide-react';
import { DateNavigation } from '@/components/koudja/DateNavigation';
import { DistributionBoard } from '@/components/koudja/DistributionBoard';
import { PersonnelSection } from '@/components/koudja/PersonnelSection';
import { Person, VehicleConfig, VehicleId, DEFAULT_VEHICLE_CONFIGS } from '@/lib/types';
import { getDefaultPersonnel } from '@/lib/data';
import { getPlatoonForDate, distribute, getReserve, formatForWhatsApp } from '@/lib/rotation';

function loadFromStorage<T>(key: string, fallback: () => T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback();
  } catch {
    return fallback();
  }
}

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [personnel, setPersonnel] = useState<Person[]>(() =>
    loadFromStorage('koudja-personnel', getDefaultPersonnel)
  );
  const [vehicleConfigs, setVehicleConfigs] = useState<VehicleConfig[]>(() =>
    loadFromStorage('koudja-vehicles', () => DEFAULT_VEHICLE_CONFIGS)
  );

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('koudja-personnel', JSON.stringify(personnel));
  }, [personnel]);

  useEffect(() => {
    localStorage.setItem('koudja-vehicles', JSON.stringify(vehicleConfigs));
  }, [vehicleConfigs]);

  // Computed values
  const currentPlatoon = useMemo(() => getPlatoonForDate(selectedDate), [selectedDate]);
  const platoonPersonnel = useMemo(
    () => personnel.filter(p => p.platoon === currentPlatoon),
    [personnel, currentPlatoon]
  );
  const assignments = useMemo(
    () => distribute(platoonPersonnel, vehicleConfigs),
    [platoonPersonnel, vehicleConfigs]
  );
  const reserve = useMemo(
    () => getReserve(platoonPersonnel, assignments),
    [platoonPersonnel, assignments]
  );

  // Handlers
  const handleTogglePresence = useCallback((id: string) => {
    setPersonnel(prev =>
      prev.map(p => (p.id === id ? { ...p, isPresent: !p.isPresent } : p))
    );
  }, []);

  const handleToggleVehicleActive = useCallback((id: VehicleId) => {
    setVehicleConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, isActive: !c.isActive } : c))
    );
  }, []);

  const handleUpdateVehicleConfig = useCallback((id: VehicleId, updates: Partial<VehicleConfig>) => {
    setVehicleConfigs(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  const handleWhatsAppShare = useCallback(() => {
    const text = formatForWhatsApp(selectedDate, currentPlatoon, assignments, vehicleConfigs, reserve);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [selectedDate, currentPlatoon, assignments, vehicleConfigs, reserve]);

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-black tracking-wider text-primary">
          KOUDJA
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary"
          onClick={handleWhatsAppShare}
        >
          <Share2 className="h-4.5 w-4.5" />
        </Button>
      </header>

      {/* Date Navigation */}
      <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {/* Main Content */}
      <Tabs defaultValue="distribution" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-2 mx-3 mt-3 bg-secondary/50 border border-border">
          <TabsTrigger
            value="distribution"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            التوزيع
          </TabsTrigger>
          <TabsTrigger
            value="personnel"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            الأفراد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="flex-1 mt-0">
          <DistributionBoard
            assignments={assignments}
            vehicleConfigs={vehicleConfigs}
            reserve={reserve}
            onToggleActive={handleToggleVehicleActive}
            onUpdateConfig={handleUpdateVehicleConfig}
          />
        </TabsContent>

        <TabsContent value="personnel" className="flex-1 mt-0">
          <PersonnelSection
            personnel={platoonPersonnel}
            onTogglePresence={handleTogglePresence}
          />
        </TabsContent>
      </Tabs>

      {/* Watermark */}
      <div className="watermark">KOUDJA</div>
    </div>
  );
};

export default Index;
