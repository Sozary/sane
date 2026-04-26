"use client";

import { cn } from "@/lib/utils";

interface MacroBarProps {
  label: string;
  current: number;
  goal: number;
  color: string;
  className?: string;
  /** "stacked" (label on top, then bar, then current/goal under) — design default */
  variant?: "stacked" | "row";
}

export function MacroBar({ label, current, goal, color, className, variant = "stacked" }: MacroBarProps) {
  const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;

  if (variant === "row") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="font-medium text-foreground">{label}</span>
          </div>
          <span className="text-muted-foreground tabular-nums">
            {Math.round(current)} / {Math.round(goal)} g
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5 min-w-0", className)}>
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="h-1.5 w-full rounded-full bg-black/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-[11px] tabular-nums">
        <span className="font-semibold">{Math.round(current)}</span>
        <span className="text-muted-foreground">/{Math.round(goal)} g</span>
      </div>
    </div>
  );
}
