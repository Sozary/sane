"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalorieRing } from "@/components/calorie-ring";
import { calculateTDEE } from "@/lib/calories/bmr";

function formatNumber(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

export default function OnboardingResultPage() {
  const router = useRouter();
  const [tdee, setTdee] = useState(0);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    const weightKg = data.weightKg ?? 70;
    const heightCm = data.heightCm ?? 170;
    const age = data.age ?? 30;
    const gender = (data.gender ?? "other") as "male" | "female" | "other";

    const result = calculateTDEE(weightKg, heightCm, age, gender);
    setTdee(result);
  }, []);

  const handleContinue = () => {
    router.push("/onboarding/goals");
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-zinc-900 to-zinc-950 flex flex-col items-center justify-between px-6 py-8 z-50">
      <span className="text-white text-xl font-bold self-start">Sane</span>

      <div className="flex flex-col items-center gap-4">
        <p className="text-zinc-400 text-sm">
          Votre dépense calorique estimée
        </p>

        <CalorieRing
          value={tdee}
          max={3000}
          size={240}
          strokeWidth={14}
          color="#E8384F"
        >
          <span className="text-5xl font-bold text-white">
            {formatNumber(tdee)}
          </span>
          <span className="text-sm text-zinc-400 mt-1">kcal / jour</span>
        </CalorieRing>

        <p className="text-zinc-500 text-xs text-center max-w-[260px] mt-2">
          Basé sur votre poids, taille et un niveau d&apos;activité modéré
        </p>
      </div>

      <button
        onClick={handleContinue}
        className="w-full max-w-md h-12 rounded-xl text-white font-semibold text-base"
        style={{ backgroundColor: "#E8384F" }}
      >
        Continuer
      </button>
    </div>
  );
}
