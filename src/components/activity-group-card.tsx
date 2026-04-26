"use client";

import { useEffect, useState } from "react";
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
  const visibleActivities = activities.slice(0, 3);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const Wrapper: React.ElementType = firstActivity ? Link : "div";
  const wrapperProps = firstActivity
    ? { href: `/activities/${firstActivity.id}?date=${date}` }
    : {};

  useEffect(() => {
    if (!mobileExpanded) return;
    const timeoutId = window.setTimeout(() => setMobileExpanded(false), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [mobileExpanded]);

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    const target = event.target as HTMLElement;
    if (target.closest("a")) return;
    setMobileExpanded((prev) => !prev);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group rounded-3xl bg-card p-4 shadow-sm flex items-center gap-3",
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

      <div
        className="relative shrink-0 h-9"
        style={{ width: 36 + visibleActivities.length * 44 }}
      >
        <Link
          href={`/activities/new?date=${date}`}
          aria-label="Ajouter une activité"
          className="absolute right-0 top-0 z-10 size-9 rounded-full ring-2 ring-card flex items-center justify-center"
          style={{ backgroundColor: "var(--sane-burn-soft)" }}
        >
          <Plus className="size-4" style={{ color: "var(--sane-burn)" }} />
        </Link>
        {visibleActivities.map((a, index) => {
          const stackIndex = visibleActivities.length - index;
          const Icon = ACTIVITY_ICONS[a.activityType] ?? Flame;
          return (
            <Link
              key={a.id}
              href={`/activities/${a.id}?date=${date}`}
              className={cn(
                "absolute top-0 size-9 rounded-full ring-2 ring-card flex items-center justify-center transition-[right] duration-200",
                mobileExpanded
                  ? "right-[var(--stack-hover-right)]"
                  : "right-[var(--stack-rest-right)] group-hover:right-[var(--stack-hover-right)]",
              )}
              style={
                {
                  backgroundColor: "var(--sane-burn-soft)",
                  zIndex: index + 1,
                  "--stack-rest-right": `${stackIndex * 27}px`,
                  "--stack-hover-right": `${stackIndex * 44}px`,
                } as React.CSSProperties
              }
              aria-label={a.activityType}
            >
              <Icon className="size-4" style={{ color: "var(--sane-burn)" }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
