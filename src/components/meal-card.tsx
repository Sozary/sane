"use client";

import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import Link from "next/link";

interface MealCardProps {
  id: string;
  name: string;
  calories: number;
  mealType: string;
  imageUrl?: string | null;
  className?: string;
}

const mealTypeLabels: Record<string, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  snack: "Collation",
};

export function MealCard({ id, name, calories, mealType, imageUrl, className }: MealCardProps) {
  return (
    <Link
      href={`/meals/${id}`}
      className={cn(
        "flex items-center gap-3 rounded-xl bg-card p-3 transition-colors hover:bg-muted/50",
        className
      )}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="size-12 rounded-lg object-cover"
        />
      ) : (
        <div className="size-12 rounded-lg bg-muted/50 flex items-center justify-center">
          <Flame className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{mealTypeLabels[mealType] ?? mealType}</p>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold shrink-0">
        <Flame className="size-3.5" style={{ color: "#E8384F" }} />
        <span>{Math.round(calories)} kcal</span>
      </div>
    </Link>
  );
}
