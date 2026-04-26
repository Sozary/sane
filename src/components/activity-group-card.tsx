"use client";

import { cn } from "@/lib/utils";
import { Plus, Flame, Bike, Footprints, Waves, Dumbbell, Wind, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { Activity } from "@/types";

interface ActivityGroupCardProps {
  activities: Activity[];
  goalBurn: number;
  date: string;
  className?: string;
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  course: Footprints,
  marche: Footprints,
  vélo: Bike,
  natation: Waves,
  musculation: Dumbbell,
  yoga: Wind,
};

export function ActivityGroupCard({ activities, goalBurn, date, className }: ActivityGroupCardProps) {
  const totalBurned = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const firstActivity = activities[0];

  const Wrapper: React.ElementType = firstActivity ? Link : "div";
  const wrapperProps = firstActivity
    ? { href: `/activities/${firstActivity.id}?date=${date}` }
    : {};

  return (
    <div
      className={cn(
        "rounded-3xl bg-card p-4 shadow-sm flex items-center gap-3",
        className,
      )}
    >
      <Wrapper
        {...wrapperProps}
        className="flex-1 min-w-0 flex flex-col gap-1"
      >
        <span
          className="text-xs font-semibold"
          style={{ color: "var(--sane-burn)" }}
        >
          Activités
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold tabular-nums leading-none">
            {Math.round(totalBurned)} cal
          </span>
          {goalBurn > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              / {Math.round(goalBurn)} cal
            </span>
          ) : null}
        </div>
      </Wrapper>

      <div className="flex items-center -space-x-2 shrink-0">
        {activities.slice(0, 2).map((a) => {
          const Icon = ACTIVITY_ICONS[a.activityType] ?? Flame;
          return (
            <Link
              key={a.id}
              href={`/activities/${a.id}?date=${date}`}
              className="size-9 rounded-full ring-2 ring-card flex items-center justify-center"
              style={{ backgroundColor: "var(--sane-burn-soft)" }}
              aria-label={a.activityType}
            >
              <Icon className="size-4" style={{ color: "var(--sane-burn)" }} />
            </Link>
          );
        })}
        <Link
          href={`/activities/new?date=${date}`}
          aria-label="Ajouter une activité"
          className="size-9 rounded-full ring-2 ring-card flex items-center justify-center"
          style={{ backgroundColor: "var(--sane-burn-soft)" }}
        >
          <Plus className="size-4" style={{ color: "var(--sane-burn)" }} />
        </Link>
      </div>
    </div>
  );
}
