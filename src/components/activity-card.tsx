"use client";

import { cn } from "@/lib/utils";
import { Flame, Timer } from "lucide-react";
import Link from "next/link";

interface ActivityCardProps {
  id: string;
  activityType: string;
  durationMinutes: number;
  caloriesBurned: number;
  className?: string;
}

const activityLabels: Record<string, string> = {
  course: "Course",
  vélo: "Vélo",
  natation: "Natation",
  musculation: "Musculation",
  marche: "Marche",
  yoga: "Yoga",
};

export function ActivityCard({ id, activityType, durationMinutes, caloriesBurned, className }: ActivityCardProps) {
  return (
    <Link
      href={`/activities/${id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-muted/50",
        className
      )}
    >
      <div className="size-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
        <Flame className="size-5 text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{activityLabels[activityType] ?? activityType}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Timer className="size-3" />
          <span>{durationMinutes} min</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
        <Flame className="size-3.5 text-orange-500" />
        <span>{Math.round(caloriesBurned)} kcal</span>
      </div>
    </Link>
  );
}
