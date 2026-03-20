import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createActivitySchema } from "@/lib/validations/activities";
import { z } from "zod/v4";

const dateQuerySchema = z.object({
  date: z.string().date(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = createActivitySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [activity] = await db
    .insert(activities)
    .values({ ...parsed.data, userId })
    .returning();

  return NextResponse.json(activity, { status: 201 });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const parsed = dateQuerySchema.safeParse({ date: searchParams.get("date") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid date parameter" },
      { status: 400 }
    );
  }
  const { date } = parsed.data;

  const dayActivities = await db
    .select()
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.date, date)))
    .orderBy(desc(activities.createdAt));

  return NextResponse.json(dayActivities);
}
