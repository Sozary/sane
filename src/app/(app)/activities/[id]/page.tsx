"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Flame, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ACTIVITY_TYPES } from "@/lib/calories/met";
import type { Activity } from "@/types";

function ActivityDetailForm() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const dashboardUrl = dateParam ? `/dashboard?date=${dateParam}` : "/dashboard";

  const [loading, setLoading] = useState(true);
  const [activityType, setActivityType] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [caloriesBurned, setCaloriesBurned] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch(`/api/activities/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const activity: Activity = await res.json();
        setActivityType(activity.activityType);
        setDurationMinutes(String(activity.durationMinutes));
        setCaloriesBurned(String(activity.caloriesBurned));
      } catch {
        // error handling
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchActivity();
  }, [id]);

  const handleSave = async () => {
    const duration = Number(durationMinutes);
    const calories = Number(caloriesBurned);
    if (duration <= 0 || calories <= 0) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/activities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType,
          durationMinutes: duration,
          caloriesBurned: calories,
        }),
      });
      if (res.ok) router.push(dashboardUrl);
    } catch {
      // error handling
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) router.push(dashboardUrl);
    } catch {
      // error handling
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={dashboardUrl}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Détail de l&apos;activité</h1>
      </div>

      {/* Activity type */}
      <div className="space-y-2">
        <Label>Type d&apos;activité</Label>
        <div className="grid grid-cols-3 gap-2">
          {ACTIVITY_TYPES.map((type) => (
            <button
              key={type.key}
              type="button"
              onClick={() => setActivityType(type.key)}
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
          onChange={(e) => setDurationMinutes(e.target.value)}
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
            onChange={(e) => setCaloriesBurned(e.target.value)}
            className="flex-1 text-2xl font-bold bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3 pt-2">
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
            "Enregistrer"
          )}
        </button>

        <Button
          variant="destructive"
          size="lg"
          className="w-full h-12 gap-2"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Trash2 className="size-4" />
          )}
          Supprimer
        </Button>
      </div>
    </div>
  );
}

export default function ActivityDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ActivityDetailForm />
    </Suspense>
  );
}
