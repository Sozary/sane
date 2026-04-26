"use client";

import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { Flame, UtensilsCrossed } from "lucide-react";

interface SummaryCardProps {
  caloriesConsumed: number;
  caloriesBurned: number;
  calorieGoal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  macroGoals: { carbsG: number; proteinG: number; fatG: number };
  loading?: boolean;
}

export function SummaryCard({
  caloriesConsumed,
  caloriesBurned,
  calorieGoal,
  carbsG,
  proteinG,
  fatG,
  macroGoals,
  loading,
}: SummaryCardProps) {
  const remaining = Math.max(0, calorieGoal - caloriesConsumed + caloriesBurned);

  return (
    <div className="rounded-3xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <CalorieRing
          value={caloriesConsumed}
          max={calorieGoal}
          size={150}
          strokeWidth={4}
          color="var(--sane-accent)"
        >
          {loading ? (
            <>
              <div className="h-7 w-16 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse mt-1" />
            </>
          ) : (
            <>
              <span className="text-3xl font-bold tabular-nums leading-none tracking-tight">
                {remaining.toLocaleString("fr-FR")}
              </span>
              <span className="text-[11px] text-muted-foreground mt-1.5">
                kcal restantes
              </span>
            </>
          )}
        </CalorieRing>

        <Tile
          icon={
            <UtensilsCrossed
              className="size-5"
              style={{ color: "var(--sane-accent)" }}
            />
          }
          iconBg="var(--sane-accent-soft)"
          value={Math.round(caloriesConsumed)}
          label="Mangées"
          loading={loading}
        />
        <Tile
          icon={
            <Flame
              className="size-5"
              style={{ color: "var(--sane-burn)" }}
            />
          }
          iconBg="var(--sane-burn-soft)"
          value={Math.round(caloriesBurned)}
          label="Brûlées"
          loading={loading}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <MacroBar
          label="Glucides"
          current={carbsG}
          goal={macroGoals.carbsG}
          color="var(--sane-carbs)"
        />
        <MacroBar
          label="Protéines"
          current={proteinG}
          goal={macroGoals.proteinG}
          color="var(--sane-protein)"
        />
        <MacroBar
          label="Lipides"
          current={fatG}
          goal={macroGoals.fatG}
          color="var(--sane-fat)"
        />
      </div>
    </div>
  );
}

function Tile({
  icon,
  iconBg,
  value,
  label,
  loading,
}: {
  icon: React.ReactNode;
  iconBg: string;
  value: number;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="size-11 rounded-full flex items-center justify-center"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      {loading ? (
        <>
          <div className="h-4 w-12 rounded bg-muted animate-pulse" />
          <div className="h-3 w-10 rounded bg-muted animate-pulse mt-0.5" />
        </>
      ) : (
        <>
          <div className="leading-none">
            <span className="text-base font-bold tabular-nums">{value}</span>
            <span className="text-[11px] text-muted-foreground ml-0.5">cal</span>
          </div>
          <span className="text-[11px] text-muted-foreground leading-none">
            {label}
          </span>
        </>
      )}
    </div>
  );
}
