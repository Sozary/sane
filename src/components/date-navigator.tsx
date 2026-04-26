"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateNavigatorDayDots {
  carbsHit?: boolean;
  proteinHit?: boolean;
  fatHit?: boolean;
}

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
  /** Map of YYYY-MM-DD → which macro targets were hit, for showing the 3-dot indicator */
  dayDots?: Record<string, DateNavigatorDayDots | undefined>;
}

const DAY_LABELS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function diffDays(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export function DateNavigator({ date, onDateChange, className, dayDots }: DateNavigatorProps) {
  const today = startOfDay(new Date());
  const [windowEnd, setWindowEnd] = useState<Date>(today);
  const [direction, setDirection] = useState<1 | -1>(1);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);

  useEffect(() => {
    const selected = startOfDay(date);
    const daysFromToday = Math.max(0, diffDays(today, selected));

    if (daysFromToday <= 6) {
      setWindowEnd((prev) => {
        if (prev.getTime() === today.getTime()) return prev;
        setDirection(1);
        return today;
      });
      return;
    }

    const pageOffset = Math.floor(daysFromToday / 7);
    const nextWindowEnd = new Date(today);
    nextWindowEnd.setDate(today.getDate() - pageOffset * 7);

    setWindowEnd((prev) => {
      if (prev.getTime() === nextWindowEnd.getTime()) return prev;
      setDirection(nextWindowEnd.getTime() > prev.getTime() ? 1 : -1);
      return nextWindowEnd;
    });
  }, [date]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(windowEnd);
    d.setDate(windowEnd.getDate() - (6 - i));
    return d;
  });

  const shiftWindow = (delta: 1 | -1) => {
    const next = new Date(windowEnd);
    next.setDate(next.getDate() + delta * 7);
    setDirection(delta);
    setWindowEnd(next);
  };

  const canGoNext = windowEnd.getTime() < today.getTime();

  const onPointerDown = (e: React.PointerEvent) => {
    pointerStart.current = { x: e.clientX, y: e.clientY };
    dragged.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    if (Math.abs(dx) > 8) dragged.current = true;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0 && canGoNext) shiftWindow(1);
      else if (dx > 0) shiftWindow(-1);
    }
  };

  return (
    <div data-swipe-ignore="true" className={cn("space-y-2 select-none", className)}>
      <div
        className="flex items-stretch gap-1"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStart.current = null;
          dragged.current = false;
        }}
      >
        <button
          type="button"
          onClick={() => shiftWindow(-1)}
          aria-label="7 jours précédents"
          className="shrink-0 flex items-center justify-center w-7 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" />
        </button>

        <div className="flex-1 overflow-hidden">
          <div
            key={windowEnd.getTime()}
            className={cn(
              "flex items-stretch gap-1 animate-in fade-in duration-300",
              direction === 1 ? "slide-in-from-right-6" : "slide-in-from-left-6",
            )}
          >
            {days.map((d) => {
              const selected = isSameDay(d, date);
              const isToday = isSameDay(d, today);
              const isFuture = d.getTime() > today.getTime() && !isToday;
              const labelIdx = (d.getDay() + 6) % 7;
              const dayLabel = DAY_LABELS_FR[labelIdx];

              const dotInfo = dayDots?.[formatDateKey(d)];
              const dots: { color: string; on: boolean }[] = [
                { color: "var(--sane-carbs)", on: !!dotInfo?.carbsHit },
                { color: "var(--sane-protein)", on: !!dotInfo?.proteinHit },
                { color: "var(--sane-fat)", on: !!dotInfo?.fatHit },
              ];

              return (
                <button
                  key={d.toISOString()}
                  type="button"
                  onClick={() => {
                    if (dragged.current) return;
                    if (!isFuture) onDateChange(d);
                  }}
                  disabled={isFuture}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center rounded-full py-2.5 transition-colors gap-0.5",
                    selected ? "text-white" : "text-foreground hover:bg-black/5",
                    isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
                  )}
                  style={
                    selected ? { backgroundColor: "var(--sane-accent)" } : undefined
                  }
                >
                  <span
                    className={cn(
                      "text-[11px] font-medium leading-tight",
                      selected ? "text-white/90" : "text-muted-foreground",
                    )}
                  >
                    {selected && isToday ? "Auj." : dayLabel}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-tight",
                      selected ? "text-white/80" : "invisible",
                    )}
                    aria-hidden={!selected}
                  >
                    {selected ? MONTH_LABELS_FR[d.getMonth()] : "Mois"}
                  </span>
                  <span className="text-base font-semibold tabular-nums leading-tight">
                    {d.getDate()}
                  </span>
                  <div className="flex gap-0.5 mt-0.5">
                    {dots.map((dot, i) => (
                      <span
                        key={i}
                        className="block size-1 rounded-full transition-opacity"
                        style={{
                          backgroundColor: dot.on
                            ? selected
                              ? "rgba(255,255,255,0.9)"
                              : dot.color
                            : selected
                              ? "rgba(255,255,255,0.25)"
                              : "rgba(0,0,0,0.08)",
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => canGoNext && shiftWindow(1)}
          disabled={!canGoNext}
          aria-label="7 jours suivants"
          className={cn(
            "shrink-0 flex items-center justify-center w-7 text-muted-foreground transition-colors",
            canGoNext ? "hover:text-foreground cursor-pointer" : "opacity-30 cursor-not-allowed",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

    </div>
  );
}
