"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalorieRing } from "@/components/calorie-ring";
import { MacroBar } from "@/components/macro-bar";
import { MealCard } from "@/components/meal-card";
import { ActivityCard } from "@/components/activity-card";
import { DateNavigator } from "@/components/date-navigator";
import { Flame, Plus, Loader2 } from "lucide-react";
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
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [date, setDate] = useState(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const parsed = new Date(dateParam + "T00:00:00");
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const dateStr = formatDate(date);

  const handleDateChange = useCallback((newDate: Date) => {
    setDate(newDate);
    setLoading(true);
    const newDateStr = formatDate(newDate);
    const today = formatDate(new Date());
    if (newDateStr === today) {
      router.replace("/dashboard", { scroll: false });
    } else {
      router.replace(`/dashboard?date=${newDateStr}`, { scroll: false });
    }
  }, [router]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/daily-log?date=${formatDate(date)}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Keep empty state
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [date]);

  // Use previous data while loading to keep animations visible
  const displayData = data ?? { caloriesConsumed: 0, caloriesBurned: 0, calorieGoal: 2000, carbsG: 0, proteinG: 0, fatG: 0, macroGoals: { carbsG: 0, proteinG: 0, fatG: 0 }, meals: [], activities: [] };
  const remaining = Math.max(0, displayData.calorieGoal - displayData.caloriesConsumed + displayData.caloriesBurned);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Date Navigator */}
      <DateNavigator date={date} onDateChange={handleDateChange} />

      {/* Calorie Ring */}
      <div className="flex flex-col items-center gap-3">
        <CalorieRing value={displayData.caloriesConsumed} max={displayData.calorieGoal} size={200} strokeWidth={10}>
          {loading ? (
            <>
              <div className="h-9 w-20 rounded bg-muted animate-pulse" />
              <div className="h-3 w-16 rounded bg-muted animate-pulse mt-1" />
            </>
          ) : (
            <>
              <span className="text-4xl font-bold tabular-nums">{remaining.toLocaleString("fr-FR")}</span>
              <span className="text-xs text-muted-foreground">kcal restantes</span>
            </>
          )}
        </CalorieRing>

        <div className="flex items-center gap-6 text-sm">
          {loading ? (
            <>
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Flame className="size-4" style={{ color: "#E8384F" }} />
                <span className="tabular-nums">{Math.round(displayData.caloriesConsumed)}</span>
                <span className="text-muted-foreground">Mangées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="size-4 text-orange-500" />
                <span className="tabular-nums">{Math.round(displayData.caloriesBurned)}</span>
                <span className="text-muted-foreground">Brûlées</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Macro Bars - always rendered so animations play on day change */}
      <div className="space-y-3">
        <MacroBar label="Glucides" current={displayData.carbsG} goal={displayData.macroGoals.carbsG} color="#3B82F6" />
        <MacroBar label="Protéines" current={displayData.proteinG} goal={displayData.macroGoals.proteinG} color="#EF4444" />
        <MacroBar label="Lipides" current={displayData.fatG} goal={displayData.macroGoals.fatG} color="#F59E0B" />
      </div>

      {/* Nourriture */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Nourriture</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : displayData.meals.length > 0 ? (
          <div className="space-y-2">
            {displayData.meals.map((meal) => (
              <MealCard
                key={meal.id}
                id={meal.id}
                name={meal.name}
                calories={meal.calories}
                mealType={meal.mealType}
                imageUrl={meal.imageUrl}
                date={dateStr}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun repas enregistré
          </p>
        )}
        <Link
          href={`/scan?date=${dateStr}`}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Ajouter un repas</span>
        </Link>
      </div>

      {/* Activités */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Activités</h2>
        {loading ? (
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-muted animate-pulse" />
          </div>
        ) : displayData.activities.length > 0 ? (
          <div className="space-y-2">
            {displayData.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                id={activity.id}
                activityType={activity.activityType}
                durationMinutes={activity.durationMinutes}
                caloriesBurned={activity.caloriesBurned}
                date={dateStr}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune activité enregistrée
          </p>
        )}
        <Link
          href={`/activities/new?date=${dateStr}`}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-5" />
          <span className="text-sm font-medium">Ajouter une activité</span>
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
