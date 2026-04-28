"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import type { Meal } from "@/types";

interface MealGroupCardProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  label: string;
  meals: Meal[];
  goalCalories: number;
  date: string;
  className?: string;
}

const MAX_VISIBLE = 2;
const REST_GAP = 18;
const HOVER_GAP = 44;

export function MealGroupCard({ mealType, label, meals, goalCalories, date, className }: MealGroupCardProps) {
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const addHref = `/scan?date=${date}&type=${mealType}`;
  const visibleMeals = meals.slice(0, MAX_VISIBLE);
  const overflowCount = meals.length - MAX_VISIBLE;
  const hasOverflow = overflowCount > 0;
  const stackSlots = visibleMeals.length + (hasOverflow ? 1 : 0);
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
          <span className="text-xs font-semibold" style={{ color: "var(--sane-accent)" }}>
            {label}
          </span>
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-sm font-bold tabular-nums leading-none">
              {Math.round(totalCalories)} cal
            </span>
            {goalCalories > 0 ? (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                / {Math.round(goalCalories)} cal
              </span>
            ) : null}
          </div>
        </div>

        <div
          className="relative shrink-0 h-9"
          style={{ width: 36 + stackSlots * HOVER_GAP }}
        >
          <Link
            href={addHref}
            aria-label={`Ajouter ${label}`}
            className="absolute right-0 top-0 z-10 size-9 rounded-full ring-2 ring-card flex items-center justify-center"
            style={{ backgroundColor: "var(--sane-accent-soft)" }}
          >
            <Plus className="size-4" style={{ color: "var(--sane-accent)" }} />
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
                  backgroundColor: "var(--sane-accent-soft)",
                  color: "var(--sane-accent)",
                  zIndex: 0,
                  "--rest-r": `${(visibleMeals.length + 1) * REST_GAP}px`,
                  "--hover-r": `${(visibleMeals.length + 1) * HOVER_GAP}px`,
                } as React.CSSProperties
              }
            >
              +{overflowCount}
            </button>
          )}

          {visibleMeals.map((meal, index) => {
            const stackIndex = visibleMeals.length - index;
            return (
              <Link
                key={meal.id}
                href={`/meals/${meal.id}?date=${date}`}
                onClick={handlePreviewClick}
                className={cn(
                  "absolute top-0 size-9 rounded-full ring-2 ring-card overflow-hidden bg-muted flex items-center justify-center transition-[right] duration-200",
                  mobileExpanded
                    ? "right-[var(--hover-r)]"
                    : "right-[var(--rest-r)] group-hover:right-[var(--hover-r)]",
                )}
                style={
                  {
                    zIndex: index + 1,
                    "--rest-r": `${stackIndex * REST_GAP}px`,
                    "--hover-r": `${stackIndex * HOVER_GAP}px`,
                  } as React.CSSProperties
                }
                aria-label={meal.name}
              >
                {meal.imageUrl ? (
                  <img src={meal.imageUrl} alt={meal.name} className="size-full object-cover" />
                ) : (
                  <UtensilsCrossed className="size-4 text-muted-foreground" />
                )}
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
              <span className="text-sm font-semibold" style={{ color: "var(--sane-accent)" }}>
                {label}
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
              {meals.map((meal) => (
                <Link
                  key={meal.id}
                  href={`/meals/${meal.id}?date=${date}`}
                  onClick={() => setShowPopup(false)}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-2xl hover:bg-muted/60 active:bg-muted transition-colors"
                >
                  <div className="size-9 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.name} className="size-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{meal.name}</p>
                    <p className="text-xs text-muted-foreground">{Math.round(meal.calories)} cal</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
