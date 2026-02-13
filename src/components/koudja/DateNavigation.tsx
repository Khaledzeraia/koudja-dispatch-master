import { format, addDays, subDays, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getPlatoonForDate } from '@/lib/rotation';

interface DateNavigationProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigation({ selectedDate, onDateChange }: DateNavigationProps) {
  const platoon = getPlatoonForDate(selectedDate);
  const today = isToday(selectedDate);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
        onClick={() => onDateChange(addDays(selectedDate, 1))}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => onDateChange(new Date())}
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
        >
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="text-base font-bold">
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: ar })}
          </span>
        </button>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/15 px-3 py-0.5 text-xs font-bold text-primary border border-primary/20">
            الفصيلة {platoon}
          </span>
          {today && (
            <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success border border-success/20">
              اليوم
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-muted-foreground hover:text-foreground"
        onClick={() => onDateChange(subDays(selectedDate, 1))}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
    </div>
  );
}
