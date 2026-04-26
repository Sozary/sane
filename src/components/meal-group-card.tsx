"use client";

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

  const Wrapper: React.ElementType = detailHref ? Link : "div";
  const wrapperProps = detailHref ? { href: detailHref } : {};

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

      <div className="flex items-center -space-x-2 shrink-0">
        {meals.slice(0, 2).map((meal) => (
          <Link
            key={meal.id}
            href={`/meals/${meal.id}?date=${date}`}
            className="size-9 rounded-full ring-2 ring-card overflow-hidden bg-muted flex items-center justify-center"
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
        ))}
        <Link
          href={addHref}
          aria-label={`Ajouter ${label}`}
          className="size-9 rounded-full ring-2 ring-card flex items-center justify-center"
          style={{ backgroundColor: "var(--sane-accent-soft)" }}
        >
          <Plus className="size-4" style={{ color: "var(--sane-accent)" }} />
        </Link>
      </div>
    </div>
  );
}
