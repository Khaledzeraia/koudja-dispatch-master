import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Person, Rank, Platoon, RANK_LABELS, RANK_ORDER } from '@/lib/types';

interface PersonnelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  currentPlatoon: Platoon;
  onSave: (person: Omit<Person, 'id' | 'priority'> & { id?: string }) => void;
}

export function PersonnelDialog({
  open,
  onOpenChange,
  person,
  currentPlatoon,
  onSave,
}: PersonnelDialogProps) {
  const [name, setName] = useState(person?.name || '');
  const [rank, setRank] = useState<Rank>(person?.rank || 'agent');

  const isEditing = !!person;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...(person ? { id: person.id } : {}),
      name: name.trim(),
      rank,
      platoon: currentPlatoon,
      isPresent: person?.isPresent ?? true,
    });
    onOpenChange(false);
    setName('');
    setRank('agent');
  };

  // Reset form when dialog opens with person data
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && person) {
      setName(person.name);
      setRank(person.rank);
    } else if (newOpen) {
      setName('');
      setRank('agent');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[340px] bg-card border-border rounded-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {isEditing ? 'تعديل فرد' : 'إضافة فرد جديد'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">الاسم الكامل</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل الاسم..."
              className="bg-secondary border-border text-sm"
              dir="rtl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">الرتبة</Label>
            <Select value={rank} onValueChange={(v) => setRank(v as Rank)}>
              <SelectTrigger className="bg-secondary border-border text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {RANK_ORDER.map((r) => (
                  <SelectItem key={r} value={r} className="text-sm">
                    {RANK_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim()}
            className="text-xs font-bold"
          >
            {isEditing ? 'حفظ التعديل' : 'إضافة'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
