import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, meals, activities, dailyLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  dailyLogQuerySchema,
  updateDailyLogSchema,
} from "@/lib/validations/daily-log";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const parsed = dailyLogQuerySchema.safeParse({
    date: searchParams.get("date"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid date parameter" },
      { status: 400 }
    );
  }
  const { date } = parsed.data;

  // Get user goals
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

  // Get meals for the day
  const dayMeals = await db
    .select()
    .from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.date, date)));

  // Aggregate macros from meals
  const totals = dayMeals.reduce(
    (acc, meal) => ({
      caloriesConsumed: acc.caloriesConsumed + (meal.calories ?? 0),
      carbsG: acc.carbsG + (meal.carbsG ?? 0),
      proteinG: acc.proteinG + (meal.proteinG ?? 0),
      fatG: acc.fatG + (meal.fatG ?? 0),
    }),
    { caloriesConsumed: 0, carbsG: 0, proteinG: 0, fatG: 0 }
  );

  // Get activities for the day
  const dayActivities = await db
    .select()
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.date, date)));

  const caloriesBurned = dayActivities.reduce(
    (sum, a) => sum + (a.caloriesBurned ?? 0),
    0
  );

  return NextResponse.json({
    date,
    ...totals,
    caloriesBurned,
    calorieGoal,
    macroGoals: {
      carbsG: Math.round((calorieGoal * carbsPct / 100) / 4),
      proteinG: Math.round((calorieGoal * proteinPct / 100) / 4),
      fatG: Math.round((calorieGoal * fatPct / 100) / 9),
    },
    meals: dayMeals,
    activities: dayActivities,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = updateDailyLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { date, ...data } = parsed.data;

  // Upsert: insert or update
  const [log] = await db
    .insert(dailyLogs)
    .values({ userId, date, ...data })
    .onConflictDoUpdate({
      target: [dailyLogs.userId, dailyLogs.date],
      set: data,
    })
    .returning();

  return NextResponse.json(log);
}
