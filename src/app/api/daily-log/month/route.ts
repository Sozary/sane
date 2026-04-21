import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, meals, activities, dailyLogs } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid month parameter, expected YYYY-MM" },
      { status: 400 }
    );
  }

  const [yStr, mStr] = month.split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const firstDay = new Date(year, monthIndex, 1);
  const lastDay = new Date(year, monthIndex + 1, 0);
  const firstDayStr = formatDate(firstDay);
  const lastDayStr = formatDate(lastDay);

  const [user] = await db
    .select({
      calorieGoal: users.calorieGoal,
      macroCarbsPct: users.macroCarbsPct,
      macroProteinPct: users.macroProteinPct,
      macroFatPct: users.macroFatPct,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const calorieGoal = user?.calorieGoal ?? 2000;
  const carbsPct = user?.macroCarbsPct ?? 40;
  const proteinPct = user?.macroProteinPct ?? 30;
  const fatPct = user?.macroFatPct ?? 30;

  const carbsGoalG = Math.round((calorieGoal * carbsPct) / 100 / 4);
  const proteinGoalG = Math.round((calorieGoal * proteinPct) / 100 / 4);
  const fatGoalG = Math.round((calorieGoal * fatPct) / 100 / 9);

  const [monthMeals, monthActivities, monthLogs] = await Promise.all([
    db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.date, firstDayStr),
          lte(meals.date, lastDayStr)
        )
      ),
    db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, firstDayStr),
          lte(activities.date, lastDayStr)
        )
      ),
    db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, firstDayStr),
          lte(dailyLogs.date, lastDayStr)
        )
      ),
  ]);

  type DayAggregate = {
    caloriesConsumed: number;
    caloriesBurned: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
    mealsCount: number;
    steps: number;
    waterMl: number;
    carbsPct: number;
    proteinPct: number;
    fatPct: number;
  };

  const days: Record<string, DayAggregate> = {};
  const ensureDay = (date: string) => {
    if (!days[date]) {
      days[date] = {
        caloriesConsumed: 0,
        caloriesBurned: 0,
        carbsG: 0,
        proteinG: 0,
        fatG: 0,
        mealsCount: 0,
        steps: 0,
        waterMl: 0,
        carbsPct: 0,
        proteinPct: 0,
        fatPct: 0,
      };
    }
    return days[date];
  };

  for (const m of monthMeals) {
    const day = ensureDay(m.date);
    day.caloriesConsumed += m.calories ?? 0;
    day.carbsG += m.carbsG ?? 0;
    day.proteinG += m.proteinG ?? 0;
    day.fatG += m.fatG ?? 0;
    day.mealsCount += 1;
  }

  for (const a of monthActivities) {
    const day = ensureDay(a.date);
    day.caloriesBurned += a.caloriesBurned ?? 0;
  }

  for (const l of monthLogs) {
    const day = ensureDay(l.date);
    day.caloriesBurned += l.caloriesBurned ?? 0;
    day.steps += l.steps ?? 0;
    day.waterMl += l.waterMl ?? 0;
  }

  for (const date of Object.keys(days)) {
    const d = days[date];
    d.carbsPct = carbsGoalG > 0 ? (d.carbsG / carbsGoalG) * 100 : 0;
    d.proteinPct = proteinGoalG > 0 ? (d.proteinG / proteinGoalG) * 100 : 0;
    d.fatPct = fatGoalG > 0 ? (d.fatG / fatGoalG) * 100 : 0;
  }

  return NextResponse.json({
    month,
    days,
    goals: {
      calorieGoal,
      carbsG: carbsGoalG,
      proteinG: proteinGoalG,
      fatG: fatGoalG,
    },
  });
}
