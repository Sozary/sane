import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { askSchema } from "@/lib/validations/ask";
import { askData } from "@/lib/ai/ask-data";

export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = askSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const result = await askData(
      session.user.id,
      parsed.data.message,
      parsed.data.history,
      parsed.data.period
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ask data failed:", error);
    return NextResponse.json({ error: "ask_failed" }, { status: 502 });
  }
}
