"use client";

import { cn } from "@/lib/utils";

export interface DayAggregate {
  caloriesConsumed: number;
  caloriesBurned: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  mealsCount: number;
  steps: number;
  waterMl: number;
  carbsPct: number;
  proteinPct: number;
  fatPct: number;
}

interface MonthCalendarProps {
  monthCursor: Date;
  data: Record<string, DayAggregate>;
  rangeStart: string | null;
  rangeEnd: string | null;
  selectedDay: string | null;
  onDayTap: (date: string) => void;
}

const WEEKDAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function inTarget(pct: number) {
  return pct >= 90 && pct <= 110;
}

export function MonthCalendar({
  monthCursor,
  data,
  rangeStart,
  rangeEnd,
  selectedDay,
  onDayTap,
}: MonthCalendarProps) {
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  // Convert JS day (0 = Sunday) to FR (0 = Monday)
  const firstWeekdayFr = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - firstWeekdayFr);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const today = formatDate(new Date());

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS_FR.map((w) => (
          <div key={w} className="text-[11px] font-medium text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dateStr = formatDate(cell);
          const isCurrentMonth = cell.getMonth() === month;
          const day = data[dateStr];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDay;

          let inRange = false;
          let isRangeStart = false;
          let isRangeEnd = false;
          if (rangeStart && rangeEnd) {
            inRange = dateStr >= rangeStart && dateStr <= rangeEnd;
            isRangeStart = dateStr === rangeStart;
            isRangeEnd = dateStr === rangeEnd;
          } else if (rangeStart && !rangeEnd) {
            isRangeStart = dateStr === rangeStart;
            inRange = isRangeStart;
          }

          const dots: string[] = [];
          if (day) {
            if (inTarget(day.carbsPct)) dots.push("#3B82F6");
            if (inTarget(day.proteinPct)) dots.push("#EF4444");
            if (inTarget(day.fatPct)) dots.push("#F59E0B");
          }

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onDayTap(dateStr)}
              className={cn(
                "relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && !inRange && "hover:bg-muted/60",
                inRange && "bg-[#E8384F]/10",
                (isRangeStart || isRangeEnd) && "bg-[#E8384F]/20",
                isSelected && "ring-2 ring-[#E8384F]",
                isToday && !isSelected && "font-bold"
              )}
            >
              <span className={cn("tabular-nums", isToday && "text-[#E8384F]")}>
                {cell.getDate()}
              </span>
              {dots.length > 0 && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dots.map((color, i) => (
                    <span
                      key={i}
                      className="block size-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
