"use client";

import { useState, useEffect } from "react";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { MealCard } from "@/components/meal-card";
import { ActivityCard } from "@/components/activity-card";
import { DateNavigator } from "@/components/date-navigator";
import { Flame, Plus } from "lucide-react";
import Link from "next/link";
import type { Meal, Activity } from "@/types";

interface DashboardData {
  caloriesConsumed: number;
  caloriesBurned: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  calorieGoal: number;
  macroGoals: { carbsG: number; proteinG: number; fatG: number };
  meals: Meal[];
  activities: Activity[];
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
    calorieGoal: 2000,
    macroGoals: { carbsG: 200, proteinG: 150, fatG: 67 },
    meals: [],
    activities: [],
  });

  const remaining = Math.max(0, data.calorieGoal - data.caloriesConsumed + data.caloriesBurned);

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
        <CalorieRing value={data.caloriesConsumed} max={data.calorieGoal} size={200} strokeWidth={10}>
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
        <MacroBar label="Glucides" current={data.carbsG} goal={data.macroGoals.carbsG} color="#3B82F6" />
        <MacroBar label="Protéines" current={data.proteinG} goal={data.macroGoals.proteinG} color="#EF4444" />
        <MacroBar label="Lipides" current={data.fatG} goal={data.macroGoals.fatG} color="#F59E0B" />
      </div>

      {/* Nourriture */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Nourriture</h2>
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
          <p className="text-sm text-muted-foreground text-center py-4">
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

      {/* Activités */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Activités</h2>
        {data.activities.length > 0 ? (
          <div className="space-y-2">
            {data.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                id={activity.id}
                activityType={activity.activityType}
                durationMinutes={activity.durationMinutes}
                caloriesBurned={activity.caloriesBurned}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune activité enregistrée
          </p>
        )}
        <Link
          href="/activities/new"
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Ajouter une activité</span>
        </Link>
      </div>
    </div>
  );
}
