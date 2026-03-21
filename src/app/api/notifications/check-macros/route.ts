import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, meals, pushSubscriptions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import webpush from "web-push";

function getWebPush() {
  webpush.setVapidDetails(
    "mailto:contact@sane.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return webpush;
}

export async function GET(request: NextRequest) {
  const wp = getWebPush();
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Get all users who have push subscriptions
  const usersWithSubs = await db
    .select({
      userId: users.id,
      calorieGoal: users.calorieGoal,
      macroCarbsPct: users.macroCarbsPct,
      macroProteinPct: users.macroProteinPct,
      macroFatPct: users.macroFatPct,
    })
    .from(users)
    .innerJoin(pushSubscriptions, eq(pushSubscriptions.userId, users.id))
    .groupBy(users.id);

  let sent = 0;
  let skipped = 0;

  for (const user of usersWithSubs) {
    const calorieGoal = user.calorieGoal ?? 2000;
    const carbsPct = user.macroCarbsPct ?? 40;
    const proteinPct = user.macroProteinPct ?? 30;
    const fatPct = user.macroFatPct ?? 30;

    const carbsGoalG = Math.round((calorieGoal * carbsPct / 100) / 4);
    const proteinGoalG = Math.round((calorieGoal * proteinPct / 100) / 4);
    const fatGoalG = Math.round((calorieGoal * fatPct / 100) / 9);

    // Get today's meal totals
    const dayMeals = await db
      .select()
      .from(meals)
      .where(
        sql`${meals.userId} = ${user.userId} AND ${meals.date} = ${today}`
      );

    const totals = dayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories ?? 0),
        carbsG: acc.carbsG + (meal.carbsG ?? 0),
        proteinG: acc.proteinG + (meal.proteinG ?? 0),
        fatG: acc.fatG + (meal.fatG ?? 0),
      }),
      { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 }
    );

    // Check if macros are incomplete (< 80% of any goal)
    const threshold = 0.8;
    const caloriesLow = totals.calories < calorieGoal * threshold;
    const carbsLow = totals.carbsG < carbsGoalG * threshold;
    const proteinLow = totals.proteinG < proteinGoalG * threshold;
    const fatLow = totals.fatG < fatGoalG * threshold;

    if (!caloriesLow && !carbsLow && !proteinLow && !fatLow) {
      skipped++;
      continue;
    }

    // Build notification message
    const missing: string[] = [];
    if (caloriesLow) missing.push(`${Math.round(calorieGoal - totals.calories)} kcal`);
    if (proteinLow) missing.push(`${Math.round(proteinGoalG - totals.proteinG)}g protéines`);
    if (carbsLow) missing.push(`${Math.round(carbsGoalG - totals.carbsG)}g glucides`);
    if (fatLow) missing.push(`${Math.round(fatGoalG - totals.fatG)}g lipides`);

    const body = `Il te manque ${missing.join(", ")} pour atteindre tes objectifs aujourd'hui.`;

    // Get all subscriptions for this user
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, user.userId));

    for (const sub of subs) {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keyP256dh,
          auth: sub.keyAuth,
        },
      };

      try {
        await wp.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: "Tu n'as pas fini tes macros !",
            body,
            url: "/dashboard",
          })
        );
        sent++;
      } catch (err: unknown) {
        // If subscription is expired/invalid, remove it
        if (err && typeof err === "object" && "statusCode" in err) {
          const statusCode = (err as { statusCode: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, sub.id));
          }
        }
      }
    }
  }

  return NextResponse.json({ sent, skipped, total: usersWithSubs.length });
}
