"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SummaryCard } from "@/components/summary-card";
import { MealGroupCard } from "@/components/meal-group-card";
import { ActivityGroupCard } from "@/components/activity-group-card";
import { DateNavigator, type DateNavigatorDayDots } from "@/components/date-navigator";
import { Loader2 } from "lucide-react";
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

interface MonthDayAggregate {
  carbsPct: number;
  proteinPct: number;
  fatPct: number;
}

function inTarget(pct: number) {
  return pct >= 90 && pct <= 110;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MEAL_TYPES: Array<{
  type: "breakfast" | "lunch" | "dinner" | "snack";
  label: string;
  ratio: number;
}> = [
  { type: "breakfast", label: "Petit-déjeuner", ratio: 0.25 },
  { type: "lunch", label: "Déjeuner", ratio: 0.35 },
  { type: "dinner", label: "Dîner", ratio: 0.3 },
  { type: "snack", label: "Collation", ratio: 0.1 },
];

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
  const [monthDays, setMonthDays] = useState<Record<string, MonthDayAggregate>>({});
  const [fetchedMonths, setFetchedMonths] = useState<Set<string>>(new Set());

  const dateStr = formatDate(date);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      setDate(newDate);
      setLoading(true);
      const newDateStr = formatDate(newDate);
      const today = formatDate(new Date());
      if (newDateStr === today) {
        router.replace("/dashboard", { scroll: false });
      } else {
        router.replace(`/dashboard?date=${newDateStr}`, { scroll: false });
      }
    },
    [router],
  );

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

  // Fetch monthly aggregates for the current selected date's month + adjacent months,
  // so the week strip can show macro-target dots even when a week spans a month boundary.
  useEffect(() => {
    const months = new Set<string>();
    const m0 = new Date(date.getFullYear(), date.getMonth(), 1);
    const mPrev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const mNext = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    months.add(monthKey(m0));
    months.add(monthKey(mPrev));
    months.add(monthKey(mNext));

    const toFetch = [...months].filter((m) => !fetchedMonths.has(m));
    if (toFetch.length === 0) return;

    let cancelled = false;
    Promise.all(
      toFetch.map(async (m) => {
        try {
          const res = await fetch(`/api/daily-log/month?month=${m}`);
          if (!res.ok) return null;
          return (await res.json()) as { days: Record<string, MonthDayAggregate> };
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      setMonthDays((prev) => {
        const next = { ...prev };
        for (const r of results) {
          if (r?.days) Object.assign(next, r.days);
        }
        return next;
      });
      setFetchedMonths((prev) => {
        const next = new Set(prev);
        for (const m of toFetch) next.add(m);
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [date, fetchedMonths]);

  // Re-fetch the current month's aggregate after the user changes today's data
  // so the dots stay in sync.
  useEffect(() => {
    if (!data) return;
    const m = monthKey(date);
    fetch(`/api/daily-log/month?month=${m}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { days: Record<string, MonthDayAggregate> } | null) => {
        if (!json?.days) return;
        setMonthDays((prev) => ({ ...prev, ...json.days }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.caloriesConsumed, data?.carbsG, data?.proteinG, data?.fatG]);

  const dayDots = useMemo<Record<string, DateNavigatorDayDots>>(() => {
    const result: Record<string, DateNavigatorDayDots> = {};
    for (const [key, day] of Object.entries(monthDays)) {
      result[key] = {
        carbsHit: inTarget(day.carbsPct),
        proteinHit: inTarget(day.proteinPct),
        fatHit: inTarget(day.fatPct),
      };
    }
    return result;
  }, [monthDays]);

  const displayData = data ?? {
    caloriesConsumed: 0,
    caloriesBurned: 0,
    calorieGoal: 2000,
    carbsG: 0,
    proteinG: 0,
    fatG: 0,
    macroGoals: { carbsG: 0, proteinG: 0, fatG: 0 },
    meals: [],
    activities: [],
  };

  const mealsByType = useMemo(() => {
    const grouped: Record<string, Meal[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };
    for (const meal of displayData.meals) {
      const key = meal.mealType in grouped ? meal.mealType : "snack";
      grouped[key].push(meal);
    }
    return grouped;
  }, [displayData.meals]);

  return (
    <div className="px-4 pt-6 pb-40 space-y-5">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <DateNavigator date={date} onDateChange={handleDateChange} dayDots={dayDots} />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-backwards">
        <SummaryCard
          caloriesConsumed={displayData.caloriesConsumed}
          caloriesBurned={displayData.caloriesBurned}
          calorieGoal={displayData.calorieGoal}
          carbsG={displayData.carbsG}
          proteinG={displayData.proteinG}
          fatG={displayData.fatG}
          macroGoals={displayData.macroGoals}
          loading={loading}
        />
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200 fill-mode-backwards">
        <h2 className="font-bold text-lg">Repas</h2>
        <div className="-mx-4 px-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
          <div className="flex gap-3 pb-1">
            {MEAL_TYPES.map((m) => (
              <div key={m.type} className="snap-start shrink-0 w-[88%]">
                <MealGroupCard
                  mealType={m.type}
                  label={m.label}
                  meals={mealsByType[m.type] ?? []}
                  goalCalories={Math.round(displayData.calorieGoal * m.ratio)}
                  date={dateStr}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-300 fill-mode-backwards">
        <h2 className="font-bold text-lg">Activités</h2>
        <ActivityGroupCard
          activities={displayData.activities}
          goalBurn={0}
          date={dateStr}
        />
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
