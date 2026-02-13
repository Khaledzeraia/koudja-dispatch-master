import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Person, Rank, RANK_LABELS, RANK_BADGE_STYLES, RANK_ORDER } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserCheck, UserX, Plus, GripVertical, Pencil, Trash2 } from 'lucide-react';

interface PersonnelSectionProps {
  personnel: Person[];
  onTogglePresence: (id: string) => void;
  onReorder: (rankGroup: Rank, oldIndex: number, newIndex: number) => void;
  onAdd: () => void;
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}

function SortablePersonCard({
  person,
  onToggle,
  onEdit,
  onDelete,
}: {
  person: Person;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: person.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center justify-between rounded-lg border bg-card px-2 py-2 transition-all duration-200 group',
        person.isPresent ? 'border-border' : 'border-destructive/20 opacity-50',
        isDragging && 'z-50 shadow-lg shadow-primary/10 border-primary/30 opacity-90'
      )}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        <span
          className={cn(
            'text-[9px] rounded px-1.5 py-0.5 font-semibold border whitespace-nowrap',
            RANK_BADGE_STYLES[person.rank]
          )}
        >
          {RANK_LABELS[person.rank]}
        </span>
        <span className="text-xs font-medium truncate">{person.name}</span>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 text-muted-foreground hover:text-primary transition-colors"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      <Switch
        checked={person.isPresent}
        onCheckedChange={onToggle}
        className="scale-[0.7] mr-1"
      />
    </div>
  );
}

export function PersonnelSection({
  personnel,
  onTogglePresence,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
}: PersonnelSectionProps) {
  const presentCount = personnel.filter(p => p.isPresent).length;
  const absentCount = personnel.length - presentCount;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (rank: Rank) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const rankPeople = personnel
      .filter(p => p.rank === rank)
      .sort((a, b) => a.priority - b.priority);
    const oldIndex = rankPeople.findIndex(p => p.id === active.id);
    const newIndex = rankPeople.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(rank, oldIndex, newIndex);
    }
  };

  return (
    <div className="p-3 space-y-3">
      {/* Stats + Add button */}
      <div className="flex items-center justify-between">
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
        <Button size="sm" onClick={onAdd} className="h-7 text-[10px] font-bold gap-1">
          <Plus className="h-3 w-3" />
          إضافة
        </Button>
      </div>

      {/* Grouped by rank with drag-and-drop */}
      {RANK_ORDER.map((rank) => {
        const people = personnel
          .filter(p => p.rank === rank)
          .sort((a, b) => a.priority - b.priority);
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd(rank)}
            >
              <SortableContext items={people.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {people.map((person) => (
                    <SortablePersonCard
                      key={person.id}
                      person={person}
                      onToggle={() => onTogglePresence(person.id)}
                      onEdit={() => onEdit(person)}
                      onDelete={() => onDelete(person)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );
      })}
    </div>
  );
}
