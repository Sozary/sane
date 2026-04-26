"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus, UtensilsCrossed } from "lucide-react";
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

export function MealGroupCard({ mealType, label, meals, goalCalories, date, className }: MealGroupCardProps) {
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const firstMealId = meals[0]?.id;
  const detailHref = firstMealId ? `/meals/${firstMealId}?date=${date}` : null;
  const addHref = `/scan?date=${date}&type=${mealType}`;
  const visibleMeals = meals.slice(0, 3);
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const Wrapper: React.ElementType = detailHref ? Link : "div";
  const wrapperProps = detailHref ? { href: detailHref } : {};

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
          style={{ color: "var(--sane-accent)" }}
        >
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold tabular-nums leading-none">
            {Math.round(totalCalories)} cal
          </span>
          {goalCalories > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              / {Math.round(goalCalories)} cal
            </span>
          ) : null}
        </div>
      </Wrapper>

      <div
        className="relative shrink-0 h-9"
        style={{ width: 36 + visibleMeals.length * 44 }}
      >
        <Link
          href={addHref}
          aria-label={`Ajouter ${label}`}
          className="absolute right-0 top-0 z-10 size-9 rounded-full ring-2 ring-card flex items-center justify-center"
          style={{ backgroundColor: "var(--sane-accent-soft)" }}
        >
          <Plus className="size-4" style={{ color: "var(--sane-accent)" }} />
        </Link>
        {visibleMeals.map((meal, index) => {
          const stackIndex = visibleMeals.length - index;
          return (
            <Link
              key={meal.id}
              href={`/meals/${meal.id}?date=${date}`}
              className={cn(
                "absolute top-0 size-9 rounded-full ring-2 ring-card overflow-hidden bg-muted flex items-center justify-center transition-[right] duration-200",
                mobileExpanded
                  ? "right-[var(--stack-hover-right)]"
                  : "right-[var(--stack-rest-right)] group-hover:right-[var(--stack-hover-right)]",
              )}
              style={
                {
                  zIndex: index + 1,
                  "--stack-rest-right": `${stackIndex * 27}px`,
                  "--stack-hover-right": `${stackIndex * 44}px`,
                } as React.CSSProperties
              }
              aria-label={meal.name}
            >
              {meal.imageUrl ? (
                <img
                  src={meal.imageUrl}
                  alt={meal.name}
                  className="size-full object-cover"
                />
              ) : (
                <UtensilsCrossed className="size-4 text-muted-foreground" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
