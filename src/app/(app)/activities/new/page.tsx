"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Flame, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ACTIVITY_TYPES, estimateCaloriesBurned } from "@/lib/calories/met";

function NewActivityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dashboardUrl = dateParam ? `/dashboard?date=${dateParam}` : "/dashboard";

  const [activityType, setActivityType] = useState<string>(ACTIVITY_TYPES[0].key);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [userWeightKg, setUserWeightKg] = useState(70);
  const [saving, setSaving] = useState(false);
  const [manualCalories, setManualCalories] = useState(false);

  useEffect(() => {
    async function fetchWeight() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile.weightKg) setUserWeightKg(profile.weightKg);
        }
      } catch {
        // use default weight
      }
    }
    fetchWeight();
  }, []);

  // Auto-calculate calories when activity type or duration changes
  useEffect(() => {
    if (manualCalories) return;
    const duration = Number(durationMinutes);
    if (duration > 0) {
      const activity = ACTIVITY_TYPES.find((a) => a.key === activityType);
      if (activity) {
        const cal = estimateCaloriesBurned(activity.met, userWeightKg, duration);
        setCaloriesBurned(String(cal));
      }
    }
  }, [activityType, durationMinutes, userWeightKg, manualCalories]);

  const handleSave = async () => {
    const duration = Number(durationMinutes);
    const calories = Number(caloriesBurned);
    if (duration <= 0 || calories <= 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateParam || (() => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; })(),
          activityType,
          durationMinutes: duration,
          caloriesBurned: calories,
        }),
      });
      if (res.ok) {
        router.push(dashboardUrl);
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
        <Link href={dashboardUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Nouvelle activité</h1>
      </div>

      {/* Activity type */}
      <div className="space-y-2">
        <Label>Type d&apos;activité</Label>
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITY_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => {
                setActivityType(type.key);
                setManualCalories(false);
              }}
              className={cn(
                "h-12 rounded-xl text-sm font-medium transition-all border",
                activityType === type.key
                  ? "text-white border-transparent"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              )}
              style={
                activityType === type.key
                  ? { backgroundColor: "#E8384F" }
                  : undefined
              }
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label htmlFor="duration">Durée (minutes)</Label>
        <Input
          id="duration"
          type="number"
          placeholder="30"
          value={durationMinutes}
          onChange={(e) => {
            setDurationMinutes(e.target.value);
            setManualCalories(false);
          }}
          className="h-11"
        />
      </div>

      {/* Calories burned */}
      <div className="space-y-2">
        <Label htmlFor="calories-burned">Calories brûlées</Label>
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
          <Flame className="size-5 text-orange-500" />
          <input
            id="calories-burned"
            type="number"
            placeholder="0"
            value={caloriesBurned}
            onChange={(e) => {
              setCaloriesBurned(e.target.value);
              setManualCalories(true);
            }}
            className="flex-1 text-2xl font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !durationMinutes || !caloriesBurned}
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

export default function NewActivityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewActivityForm />
    </Suspense>
  );
}
