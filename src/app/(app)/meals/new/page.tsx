"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreBadge } from "@/components/score-badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MealType, MealAnalysis } from "@/types";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Petit-déj" },
  { value: "lunch", label: "Déjeuner" },
  { value: "dinner", label: "Dîner" },
  { value: "snack", label: "Collation" },
];

function getDefaultMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 10) return "breakfast";
  if (hour < 15) return "lunch";
  if (hour < 18) return "snack";
  return "dinner";
}

function NewMealForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [calories, setCalories] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [fatG, setFatG] = useState("");
  const [weightG, setWeightG] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const analysisParam = searchParams.get("analysis");
    if (analysisParam) {
      try {
        const analysis: MealAnalysis = JSON.parse(analysisParam);
        setName(analysis.name || "");
        setCalories(String(analysis.calories || ""));
        setCarbsG(String(analysis.carbsG || ""));
        setProteinG(String(analysis.proteinG || ""));
        setFatG(String(analysis.fatG || ""));
        if (analysis.weightG) setWeightG(String(analysis.weightG));
        if (analysis.score) setScore(analysis.score);
      } catch {
        // ignore parse errors
      }
    }
  }, [searchParams]);

  const handleSave = async () => {
    if (!name.trim() || !calories) return;
    setSaving(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString().split("T")[0],
          mealType,
          name: name.trim(),
          calories: Number(calories),
          carbsG: Number(carbsG) || 0,
          proteinG: Number(proteinG) || 0,
          fatG: Number(fatG) || 0,
          weightG: weightG ? Number(weightG) : undefined,
          score: score ?? undefined,
        }),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nouveau repas</h1>
      </div>

      {/* Meal name */}
      <div className="space-y-2">
        <Label htmlFor="meal-name">Nom du repas</Label>
        <Input
          id="meal-name"
          placeholder="Nom du repas"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Meal type */}
      <div className="space-y-2">
        <Label>Type de repas</Label>
        <div className="grid grid-cols-4 gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setMealType(type.value)}
              className={cn(
                "h-10 rounded-lg text-xs font-medium transition-all border",
                mealType === type.value
                  ? "text-white border-transparent"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              )}
              style={
                mealType === type.value
                  ? { backgroundColor: "#E8384F" }
                  : undefined
              }
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calories */}
      <div className="space-y-2">
        <Label htmlFor="calories">Calories</Label>
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
          <Flame className="size-5" style={{ color: "#E8384F" }} />
          <input
            id="calories"
            type="number"
            placeholder="0"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="flex-1 text-2xl font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* Macros */}
      <div className="space-y-3">
        <Label>Macronutriments</Label>
        {[
          { label: "Glucides", color: "#3B82F6", value: carbsG, setter: setCarbsG },
          { label: "Protéines", color: "#EF4444", value: proteinG, setter: setProteinG },
          { label: "Lipides", color: "#F59E0B", value: fatG, setter: setFatG },
        ].map((macro) => (
          <div
            key={macro.label}
            className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
          >
            <span
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: macro.color }}
            />
            <span className="text-sm font-medium flex-1">{macro.label}</span>
            <input
              type="number"
              placeholder="0"
              value={macro.value}
              onChange={(e) => macro.setter(e.target.value)}
              className="w-16 text-right text-sm font-semibold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-muted-foreground">g</span>
          </div>
        ))}
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <Label htmlFor="weight">Poids (optionnel)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="weight"
            type="number"
            placeholder="0"
            value={weightG}
            onChange={(e) => setWeightG(e.target.value)}
            className="h-11"
          />
          <span className="text-sm text-muted-foreground shrink-0">g</span>
        </div>
      </div>

      {/* Score badge */}
      {score !== null && (
        <div className="flex justify-center py-2">
          <ScoreBadge score={score} size="lg" />
        </div>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !name.trim() || !calories}
        className={cn(
          "w-full h-12 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 transition-opacity active:translate-y-px disabled:opacity-50 disabled:pointer-events-none"
        )}
        style={{ backgroundColor: "#E8384F" }}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Terminé"
        )}
      </button>
    </div>
  );
}

export default function NewMealPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewMealForm />
    </Suspense>
  );
}
