"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { calculateTDEE, calculateMacroGrams } from "@/lib/calories/bmr";
import { cn } from "@/lib/utils";

const MACROS = [
  { key: "carbs", label: "Glucides", color: "#3B82F6" },
  { key: "protein", label: "Protéines", color: "#EF4444" },
  { key: "fat", label: "Lipides", color: "#F59E0B" },
] as const;

export default function OnboardingGoalsPage() {
  const router = useRouter();
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [carbsPct, setCarbsPct] = useState(40);
  const [proteinPct, setProteinPct] = useState(30);
  const [fatPct, setFatPct] = useState(30);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    const weightKg = data.weightKg ?? 70;
    const heightCm = data.heightCm ?? 170;
    const age = data.age ?? 30;
    const gender = data.gender ?? "other";

    const tdee = calculateTDEE(weightKg, heightCm, age, gender as "male" | "female" | "other");
    setCalorieGoal(tdee);
  }, []);

  const macroGrams = calculateMacroGrams(calorieGoal, carbsPct, proteinPct, fatPct);
  const totalPct = carbsPct + proteinPct + fatPct;

  const pctValues = { carbs: carbsPct, protein: proteinPct, fat: fatPct };
  const gramValues = {
    carbs: macroGrams.carbsG,
    protein: macroGrams.proteinG,
    fat: macroGrams.fatG,
  };
  const setters = {
    carbs: setCarbsPct,
    protein: setProteinPct,
    fat: setFatPct,
  };

  const [saving, setSaving] = useState(false);

  const handleCommencer = async () => {
    setSaving(true);
    try {
      const data = JSON.parse(localStorage.getItem("onboarding") || "{}");

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weightKg: data.weightKg,
          heightCm: data.heightCm,
          age: data.age,
          gender: data.gender,
          calorieGoal,
          macroCarbsPct: carbsPct,
          macroProteinPct: proteinPct,
          macroFatPct: fatPct,
          onboardingDone: true,
        }),
      });

      if (res.ok) {
        localStorage.removeItem("onboarding");
        router.push("/dashboard");
      } else {
        console.error("Failed to save profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#E8384F] text-xl font-bold">Sane</span>
      </div>

      <div className="flex-1 flex flex-col gap-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Calories &amp; macros</h1>
          <p className="text-sm text-muted-foreground">
            Objectif quotidien recommandé : {calorieGoal} kcal
          </p>
        </div>

        {/* Calorie goal */}
        <div className="flex items-center justify-between rounded-xl bg-muted/30 px-5 py-4">
          <span className="text-sm font-medium text-muted-foreground">
            Calories quotidiennes
          </span>
          <div className="flex items-baseline gap-1">
            <input
              type="number"
              value={calorieGoal}
              onChange={(e) => setCalorieGoal(Number(e.target.value) || 0)}
              className="w-20 text-right text-lg font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-sm text-muted-foreground">kcal</span>
          </div>
        </div>

        {/* Macro sliders */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Macros</h2>

          {totalPct !== 100 && (
            <p className="text-xs text-amber-500 font-medium">
              Le total des macros est de {totalPct}% (devrait être 100%)
            </p>
          )}

          {MACROS.map((macro) => (
            <div key={macro.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: macro.color }}
                  />
                  <span className="text-sm font-medium">{macro.label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold tabular-nums">
                    {pctValues[macro.key]}%
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({gramValues[macro.key]}g)
                  </span>
                </div>
              </div>

              <Slider
                value={[pctValues[macro.key]]}
                onValueChange={(values) => setters[macro.key](Array.isArray(values) ? values[0] : values)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleCommencer}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-base mt-6",
          totalPct === 100 ? "text-white" : "text-white opacity-80"
        )}
        style={{ backgroundColor: "#E8384F" }}
      >
        {saving ? "Enregistrement..." : "Commencer"}
      </button>
    </>
  );
}
