import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, meals, activities, dailyLogs } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { analysePeriodSchema } from "@/lib/validations/analyse";
import { analyzePeriod, type PeriodDayInput } from "@/lib/ai/analyze-period";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function eachDay(startDate: string, endDate: string): string[] {
  const result: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(formatDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  const parsed = analysePeriodSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { startDate, endDate } = parsed.data;

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

  const goals = {
    calorieGoal,
    carbsG: Math.round((calorieGoal * carbsPct) / 100 / 4),
    proteinG: Math.round((calorieGoal * proteinPct) / 100 / 4),
    fatG: Math.round((calorieGoal * fatPct) / 100 / 9),
  };

  const [rangeMeals, rangeActivities, rangeLogs] = await Promise.all([
    db
      .select()
      .from(meals)
      .where(
        and(
          eq(meals.userId, userId),
          gte(meals.date, startDate),
          lte(meals.date, endDate)
        )
      ),
    db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.date, startDate),
          lte(activities.date, endDate)
        )
      ),
    db
      .select()
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, startDate),
          lte(dailyLogs.date, endDate)
        )
      ),
  ]);

  const daysMap: Record<string, PeriodDayInput> = {};
  for (const date of eachDay(startDate, endDate)) {
    daysMap[date] = {
      date,
      caloriesConsumed: 0,
      caloriesBurned: 0,
      carbsG: 0,
      proteinG: 0,
      fatG: 0,
      steps: 0,
      waterMl: 0,
      mealsCount: 0,
    };
  }

  for (const m of rangeMeals) {
    const day = daysMap[m.date];
    if (!day) continue;
    day.caloriesConsumed += m.calories ?? 0;
    day.carbsG += m.carbsG ?? 0;
    day.proteinG += m.proteinG ?? 0;
    day.fatG += m.fatG ?? 0;
    day.mealsCount += 1;
  }

  for (const a of rangeActivities) {
    const day = daysMap[a.date];
    if (!day) continue;
    day.caloriesBurned += a.caloriesBurned ?? 0;
  }

  for (const l of rangeLogs) {
    const day = daysMap[l.date];
    if (!day) continue;
    day.caloriesBurned += l.caloriesBurned ?? 0;
    day.steps += l.steps ?? 0;
    day.waterMl += l.waterMl ?? 0;
  }

  const daysArray = Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date));

  try {
    const result = await analyzePeriod(daysArray, goals, startDate, endDate);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Period analysis failed:", error);
    return NextResponse.json(
      { error: "analysis_failed" },
      { status: 502 }
    );
  }
}
