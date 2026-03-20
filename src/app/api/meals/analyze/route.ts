import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { analyzeMealPhoto } from "@/lib/ai/analyze-meal";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type;

  const analysis = await analyzeMealPhoto(base64, mimeType);
  return NextResponse.json(analysis);
}
