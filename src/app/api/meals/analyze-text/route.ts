import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { analyzeMealDescription } from "@/lib/ai/analyze-meal";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const description = body.description;
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "No description provided" }, { status: 400 });
  }

  const analysis = await analyzeMealDescription(description.trim());

  if ("error" in analysis && (analysis as Record<string, unknown>).error === "not_food") {
    return NextResponse.json({ error: "not_food" }, { status: 422 });
  }

  const mapped = {
    name: analysis.name,
    calories: analysis.calories,
    carbsG: analysis.carbs_g,
    proteinG: analysis.protein_g,
    fatG: analysis.fat_g,
    score: analysis.score,
  };
  return NextResponse.json(mapped);
}
