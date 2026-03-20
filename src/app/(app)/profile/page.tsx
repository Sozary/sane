"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { ArrowLeft, Loader2, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateTDEE } from "@/lib/calories/bmr";
import type { UserProfile, Gender } from "@/types";

const MACROS = [
  { key: "carbs" as const, label: "Glucides", color: "#3B82F6" },
  { key: "protein" as const, label: "Protéines", color: "#EF4444" },
  { key: "fat" as const, label: "Lipides", color: "#F59E0B" },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [carbsPct, setCarbsPct] = useState(40);
  const [proteinPct, setProteinPct] = useState(30);
  const [fatPct, setFatPct] = useState(30);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (!res.ok) throw new Error("Failed to fetch");
        const profile: UserProfile = await res.json();
        setName(profile.name || "");
        setEmail(profile.email);
        if (profile.heightCm) setHeightCm(String(profile.heightCm));
        if (profile.weightKg) setWeightKg(String(profile.weightKg));
        if (profile.age) setAge(String(profile.age));
        setGender(profile.gender);
        setCalorieGoal(profile.calorieGoal);
        setCarbsPct(profile.macroCarbsPct);
        setProteinPct(profile.macroProteinPct);
        setFatPct(profile.macroFatPct);
      } catch {
        // error handling
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  // Recalculate TDEE when physical data changes
  const recalculateTDEE = () => {
    const w = Number(weightKg);
    const h = Number(heightCm);
    const a = Number(age);
    if (w > 0 && h > 0 && a > 0 && gender) {
      const tdee = calculateTDEE(w, h, a, gender);
      setCalorieGoal(tdee);
    }
  };

  const totalPct = carbsPct + proteinPct + fatPct;

  const pctValues = { carbs: carbsPct, protein: proteinPct, fat: fatPct };
  const setters = {
    carbs: setCarbsPct,
    protein: setProteinPct,
    fat: setFatPct,
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          heightCm: heightCm ? Number(heightCm) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          age: age ? Number(age) : null,
          gender,
          calorieGoal,
          macroCarbsPct: carbsPct,
          macroProteinPct: proteinPct,
          macroFatPct: fatPct,
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

  const handleLogout = async () => {
    await signOut({ redirectTo: "/login" });
  };

  const initials = name
    ? name.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : "?";

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
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="size-5" />
        </Button>
        <h1 className="text-xl font-bold">Profil</h1>
      </div>

      {/* Avatar & identity */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div
          className="size-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: "#E8384F" }}
        >
          {initials}
        </div>
        <div className="text-center">
          {name && <p className="font-semibold">{name}</p>}
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
      </div>

      {/* Calorie goal */}
      <Card>
        <CardHeader>
          <CardTitle>Objectif calorique</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
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
          <button
            type="button"
            onClick={recalculateTDEE}
            className="w-full text-sm font-medium py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Recalculer depuis mon profil
          </button>
        </CardContent>
      </Card>

      {/* Macro distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition macros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
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
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: macro.color }}
                  />
                  <span className="text-sm font-medium">{macro.label}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">
                  {pctValues[macro.key]}%
                </span>
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
        </CardContent>
      </Card>

      {/* Physical profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nom</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              className="h-10"
            />
          </div>

          {/* Height / Weight row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-height">Taille (cm)</Label>
              <Input
                id="profile-height"
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="170"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-weight">Poids (kg)</Label>
              <Input
                id="profile-weight"
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="70"
                className="h-10"
              />
            </div>
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <Label htmlFor="profile-age">Âge</Label>
            <Input
              id="profile-age"
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="30"
              className="h-10"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <Label>Sexe</Label>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={cn(
                    "h-10 rounded-lg text-sm font-medium transition-all border",
                    gender === g.value
                      ? "text-white border-transparent"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  )}
                  style={
                    gender === g.value
                      ? { backgroundColor: "#E8384F" }
                      : undefined
                  }
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account section */}
      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{email}</span>
          </div>
          <Button
            variant="destructive"
            size="lg"
            className="w-full h-10 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            Se déconnecter
          </Button>
        </CardContent>
      </Card>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
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
          <>
            <Save className="size-4" />
            Enregistrer
          </>
        )}
      </button>
    </div>
  );
}
