import { useState, useMemo, useEffect, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Share2, LayoutGrid, Users, Clock } from 'lucide-react';
import { DateNavigation } from '@/components/koudja/DateNavigation';
import { DistributionBoard } from '@/components/koudja/DistributionBoard';
import { PersonnelSection } from '@/components/koudja/PersonnelSection';
import { PersonnelDialog } from '@/components/koudja/PersonnelDialog';
import { DeleteConfirmDialog } from '@/components/koudja/DeleteConfirmDialog';
import { GuardSchedule } from '@/components/koudja/GuardSchedule';
import { GuardStats } from '@/components/koudja/GuardStats';
import { Person, Rank, VehicleConfig, VehicleId, DEFAULT_VEHICLE_CONFIGS } from '@/lib/types';
import { getDefaultPersonnel } from '@/lib/data';
import { getPlatoonForDate, distribute, getReserve, formatForWhatsApp, generateGuardSchedule } from '@/lib/rotation';

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
  const [personnelPerPeriod, setPersonnelPerPeriod] = useState<number[]>(() =>
    loadFromStorage('koudja-guard-counts', () => [1, 1, 1, 1, 1, 1])
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('koudja-personnel', JSON.stringify(personnel));
  }, [personnel]);

  useEffect(() => {
    localStorage.setItem('koudja-vehicles', JSON.stringify(vehicleConfigs));
  }, [vehicleConfigs]);

  useEffect(() => {
    localStorage.setItem('koudja-guard-counts', JSON.stringify(personnelPerPeriod));
  }, [personnelPerPeriod]);

  // Computed values
  const currentPlatoon = useMemo(() => getPlatoonForDate(selectedDate), [selectedDate]);
  const platoonPersonnel = useMemo(
    () => personnel.filter(p => p.platoon === currentPlatoon),
    [personnel, currentPlatoon]
  );
  const assignments = useMemo(
    () => distribute(platoonPersonnel, vehicleConfigs, selectedDate),
    [platoonPersonnel, vehicleConfigs, selectedDate]
  );
  const assignedToVehicles = useMemo(
    () => {
      // Only guard office and VL personnel are excluded from guard duty
      const excludedVehicles: VehicleId[] = ['guard', 'vl'];
      const excluded = excludedVehicles.flatMap(id => assignments[id] || []);
      return new Set(excluded.map(p => p.id));
    },
    [assignments]
  );
  const reserve = useMemo(
    () => getReserve(platoonPersonnel, assignments),
    [platoonPersonnel, assignments]
  );
  const guardSchedule = useMemo(
    () => generateGuardSchedule(selectedDate, platoonPersonnel, assignedToVehicles, personnelPerPeriod),
    [selectedDate, platoonPersonnel, assignedToVehicles, personnelPerPeriod]
  );

  const handlePersonnelPerPeriodChange = useCallback((index: number, value: number) => {
    setPersonnelPerPeriod(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

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
    const text = formatForWhatsApp(selectedDate, currentPlatoon, assignments, vehicleConfigs, reserve, guardSchedule);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [selectedDate, currentPlatoon, assignments, vehicleConfigs, reserve, guardSchedule]);

  // CRUD handlers
  const handleAddClick = useCallback(() => {
    setEditingPerson(null);
    setDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((person: Person) => {
    setEditingPerson(person);
    setDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((person: Person) => {
    setDeletingPerson(person);
    setDeleteDialogOpen(true);
  }, []);

  const handleSavePerson = useCallback(
    (data: Omit<Person, 'id' | 'priority'> & { id?: string }) => {
      setPersonnel(prev => {
        if (data.id) {
          // Edit existing
          return prev.map(p =>
            p.id === data.id
              ? { ...p, name: data.name, rank: data.rank, isPresent: data.isPresent }
              : p
          );
        } else {
          // Add new
          const samePlatoon = prev.filter(p => p.platoon === data.platoon);
          const maxPriority = samePlatoon.reduce((max, p) => Math.max(max, p.priority), -1);
          const newPerson: Person = {
            id: `${data.platoon}-${data.rank}-${Date.now()}`,
            name: data.name,
            rank: data.rank,
            platoon: data.platoon,
            isPresent: data.isPresent,
            priority: maxPriority + 1,
          };
          return [...prev, newPerson];
        }
      });
    },
    []
  );

  const handleDeleteConfirm = useCallback(() => {
    if (deletingPerson) {
      setPersonnel(prev => prev.filter(p => p.id !== deletingPerson.id));
      setDeletingPerson(null);
      setDeleteDialogOpen(false);
    }
  }, [deletingPerson]);

  const handleReorder = useCallback(
    (rank: Rank, oldIndex: number, newIndex: number) => {
      setPersonnel(prev => {
        const platoon = currentPlatoon;
        // Get the sorted rank group for this platoon
        const rankGroup = prev
          .filter(p => p.platoon === platoon && p.rank === rank)
          .sort((a, b) => a.priority - b.priority);

        // Reorder within the group
        const reordered = [...rankGroup];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        // Reassign priorities
        const priorityMap = new Map<string, number>();
        reordered.forEach((p, i) => priorityMap.set(p.id, i));

        return prev.map(p =>
          priorityMap.has(p.id) ? { ...p, priority: priorityMap.get(p.id)! } : p
        );
      });
    },
    [currentPlatoon]
  );

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
      <Tabs defaultValue="personnel" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 mx-3 mt-3 bg-secondary/50 border border-border">
          <TabsTrigger
            value="personnel"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Users className="h-3.5 w-3.5" />
            الأفراد
          </TabsTrigger>
          <TabsTrigger
            value="distribution"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            التوزيع
          </TabsTrigger>
          <TabsTrigger
            value="guard-schedule"
            className="text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Clock className="h-3.5 w-3.5" />
            الحراسة
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

        <TabsContent value="guard-schedule" className="flex-1 mt-0">
          <GuardSchedule slots={guardSchedule} personnelPerPeriod={personnelPerPeriod} onPersonnelPerPeriodChange={handlePersonnelPerPeriodChange} />
          <GuardStats date={selectedDate} personnel={personnel} vehicleConfigs={vehicleConfigs} />
        </TabsContent>

        <TabsContent value="personnel" className="flex-1 mt-0">
          <PersonnelSection
            personnel={platoonPersonnel}
            onTogglePresence={handleTogglePresence}
            onReorder={handleReorder}
            onAdd={handleAddClick}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PersonnelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        person={editingPerson}
        currentPlatoon={currentPlatoon}
        onSave={handleSavePerson}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        person={deletingPerson}
        onConfirm={handleDeleteConfirm}
      />

      {/* Watermark */}
      <div className="watermark">KOUDJA</div>
    </div>
  );
};

export default Index;
