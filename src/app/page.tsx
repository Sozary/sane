import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Check onboarding status
  const [user] = await db
    .select({ onboardingDone: users.onboardingDone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.onboardingDone) {
    redirect("/onboarding/weight");
  }

  redirect("/dashboard");
}
