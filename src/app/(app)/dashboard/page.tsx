"use client";

import { useState, useEffect } from "react";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { MealCard } from "@/components/meal-card";
import { DateNavigator } from "@/components/date-navigator";
import { Flame, Footprints, Droplets, Plus } from "lucide-react";
import Link from "next/link";
import type { Meal } from "@/types";

interface DashboardData {
  caloriesConsumed: number;
  caloriesBurned: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  steps: number;
  waterMl: number;
  meals: Meal[];
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default function DashboardPage() {
  const [date, setDate] = useState(() => new Date());
  const [data, setData] = useState<DashboardData>({
    caloriesConsumed: 0,
    caloriesBurned: 0,
    carbsG: 0,
    proteinG: 0,
    fatG: 0,
    steps: 0,
    waterMl: 0,
    meals: [],
  });

  const calorieGoal = 2000; // TODO: from user profile
  const macroGoals = { carbsG: 200, proteinG: 150, fatG: 67 };
  const remaining = Math.max(0, calorieGoal - data.caloriesConsumed + data.caloriesBurned);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/daily-log?date=${formatDate(date)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Keep empty state
      }
    }
    fetchData();
  }, [date]);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Date Navigator */}
      <DateNavigator date={date} onDateChange={setDate} />

      {/* Calorie Ring */}
      <div className="flex flex-col items-center gap-3">
        <CalorieRing value={data.caloriesConsumed} max={calorieGoal} size={200} strokeWidth={10}>
          <span className="text-4xl font-bold tabular-nums">{remaining.toLocaleString("fr-FR")}</span>
          <span className="text-xs text-muted-foreground">kcal restantes</span>
        </CalorieRing>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Flame className="size-4" style={{ color: "#E8384F" }} />
            <span className="tabular-nums">{Math.round(data.caloriesConsumed)}</span>
            <span className="text-muted-foreground">Mangées</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="size-4 text-orange-500" />
            <span className="tabular-nums">{Math.round(data.caloriesBurned)}</span>
            <span className="text-muted-foreground">Brûlées</span>
          </div>
        </div>
      </div>

      {/* Macro Bars */}
      <div className="space-y-3">
        <MacroBar label="Glucides" current={data.carbsG} goal={macroGoals.carbsG} color="#3B82F6" />
        <MacroBar label="Protéines" current={data.proteinG} goal={macroGoals.proteinG} color="#EF4444" />
        <MacroBar label="Lipides" current={data.fatG} goal={macroGoals.fatG} color="#F59E0B" />
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
          <Footprints className="size-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold tabular-nums">{data.steps.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-muted-foreground">Pas</p>
          </div>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 flex items-center gap-3">
          <Droplets className="size-5 text-blue-500" />
          <div>
            <p className="text-sm font-semibold tabular-nums">
              {data.waterMl >= 1000
                ? `${(data.waterMl / 1000).toFixed(1).replace(".", ",")} L`
                : `${data.waterMl} ml`}
            </p>
            <p className="text-xs text-muted-foreground">Eau</p>
          </div>
        </div>
      </div>

      {/* Journal */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Journal</h2>
        {data.meals.length > 0 ? (
          <div className="space-y-2">
            {data.meals.map((meal) => (
              <MealCard
                key={meal.id}
                id={meal.id}
                name={meal.name}
                calories={meal.calories}
                mealType={meal.mealType}
                imageUrl={meal.imageUrl}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucun repas enregistré
          </p>
        )}
        <Link
          href="/scan"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Ajouter un repas</span>
        </Link>
      </div>
    </div>
  );
}
