"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, Flame, Bike, Footprints, Waves, Dumbbell, Wind, X, type LucideIcon } from "lucide-react";
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

const MAX_VISIBLE = 2;
const REST_GAP = 18;
const HOVER_GAP = 44;

export function ActivityGroupCard({ activities, goalBurn, date, className }: ActivityGroupCardProps) {
  const totalBurned = activities.reduce((sum, a) => sum + a.caloriesBurned, 0);
  const visibleActivities = activities.slice(0, MAX_VISIBLE);
  const overflowCount = activities.length - MAX_VISIBLE;
  const hasOverflow = overflowCount > 0;
  const stackSlots = visibleActivities.length + (hasOverflow ? 1 : 0);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!mobileExpanded) return;
    const id = window.setTimeout(() => setMobileExpanded(false), 2200);
    return () => window.clearTimeout(id);
  }, [mobileExpanded]);

  const handlePreviewClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    if (mobileExpanded) return;
    event.preventDefault();
    setMobileExpanded(true);
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia("(hover: none)").matches) return;
    const target = event.target as HTMLElement;
    if (target.closest("a, button")) return;
    setMobileExpanded((prev) => !prev);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "group rounded-3xl bg-card p-4 shadow-sm flex items-center gap-3",
          className,
        )}
      >
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="text-xs font-semibold" style={{ color: "var(--sane-burn)" }}>
            Activités
          </span>
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-bold tabular-nums leading-none">
              {Math.round(totalBurned)} cal
            </span>
            {goalBurn > 0 ? (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                / {Math.round(goalBurn)} cal
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative shrink-0 h-9"
          style={{ width: 36 + stackSlots * HOVER_GAP }}
        >
          <Link
            href={`/activities/new?date=${date}`}
            aria-label="Ajouter une activité"
            className="absolute right-0 top-0 z-10 size-9 rounded-full ring-2 ring-card flex items-center justify-center"
            style={{ backgroundColor: "var(--sane-burn-soft)" }}
          >
            <Plus className="size-4" style={{ color: "var(--sane-burn)" }} />
          </Link>

          {hasOverflow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPopup(true);
              }}
              className={cn(
                "absolute top-0 size-9 rounded-full ring-2 ring-card flex items-center justify-center text-[11px] font-bold transition-[right] duration-200",
                mobileExpanded
                  ? "right-[var(--hover-r)]"
                  : "right-[var(--rest-r)] group-hover:right-[var(--hover-r)]",
              )}
              style={
                {
                  backgroundColor: "var(--sane-burn-soft)",
                  color: "var(--sane-burn)",
                  zIndex: 0,
                  "--rest-r": `${(visibleActivities.length + 1) * REST_GAP}px`,
                  "--hover-r": `${(visibleActivities.length + 1) * HOVER_GAP}px`,
                } as React.CSSProperties
              }
            >
              +{overflowCount}
            </button>
          )}

          {visibleActivities.map((a, index) => {
            const stackIndex = visibleActivities.length - index;
            const Icon = ACTIVITY_ICONS[a.activityType] ?? Flame;
            return (
              <Link
                key={a.id}
                href={`/activities/${a.id}?date=${date}`}
                onClick={handlePreviewClick}
                className={cn(
                  "absolute top-0 size-9 rounded-full ring-2 ring-card flex items-center justify-center transition-[right] duration-200",
                  mobileExpanded
                    ? "right-[var(--hover-r)]"
                    : "right-[var(--rest-r)] group-hover:right-[var(--hover-r)]",
                )}
                style={
                  {
                    backgroundColor: "var(--sane-burn-soft)",
                    zIndex: index + 1,
                    "--rest-r": `${stackIndex * REST_GAP}px`,
                    "--hover-r": `${stackIndex * HOVER_GAP}px`,
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

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center px-4"
          onPointerDown={() => setShowPopup(false)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" aria-hidden />
          <div
            className="relative w-full max-w-sm mb-28 bg-card rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-200"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-sm font-semibold" style={{ color: "var(--sane-burn)" }}>
                Activités
              </span>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="size-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            </div>
            <div className="px-2 pb-3 space-y-0.5">
              {activities.map((a) => {
                const Icon = ACTIVITY_ICONS[a.activityType] ?? Flame;
                return (
                  <Link
                    key={a.id}
                    href={`/activities/${a.id}?date=${date}`}
                    onClick={() => setShowPopup(false)}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors"
                  >
                    <div
                      className="size-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--sane-burn-soft)" }}
                    >
                      <Icon className="size-4" style={{ color: "var(--sane-burn)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize truncate">{a.activityType}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.durationMinutes} min · {Math.round(a.caloriesBurned)} cal
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
