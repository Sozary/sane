"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateNavigatorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

function formatDateFr(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

export function DateNavigator({ date, onDateChange, className }: DateNavigatorProps) {
  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <button
        onClick={prevDay}
        className="p-2 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Jour précédent"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-sm font-semibold capitalize">
        {isToday ? "Aujourd'hui" : formatDateFr(date)}
      </span>
      <button
        onClick={nextDay}
        className="p-2 rounded-full hover:bg-muted/50 transition-colors"
        aria-label="Jour suivant"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
