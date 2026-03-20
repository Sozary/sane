"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const GENDERS = [
  { value: "male", label: "Homme" },
  { value: "female", label: "Femme" },
  { value: "other", label: "Autre" },
] as const;

export default function OnboardingInfoPage() {
  const router = useRouter();
  const [age, setAge] = useState(30);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");

  const handleSliderChange = (values: number | readonly number[]) => {
    setAge(Math.round(Array.isArray(values) ? values[0] : values));
  };

  const handleContinue = () => {
    const data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    localStorage.setItem(
      "onboarding",
      JSON.stringify({ ...data, age, gender })
    );
    router.push("/onboarding/result");
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#E8384F] text-xl font-bold">Sane</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        {/* Gender */}
        <div className="w-full space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Quel est votre genre ?</h1>
            <p className="text-sm text-muted-foreground">
              Utilisé pour le calcul de vos besoins caloriques
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGender(g.value)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  gender === g.value
                    ? "text-white border-transparent"
                    : "bg-background border-border text-muted-foreground hover:border-foreground/30"
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

        {/* Age */}
        <div className="w-full space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Quel est votre âge ?</h2>
          </div>

          <div className="flex items-baseline justify-center gap-2">
            <span className="text-7xl font-bold tabular-nums">{age}</span>
            <span className="text-2xl text-muted-foreground">ans</span>
          </div>

          <div className="w-full px-4">
            <Slider
              value={[age]}
              onValueChange={handleSliderChange}
              min={14}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleContinue}
        className="w-full h-12 rounded-xl text-white font-semibold text-base"
        style={{ backgroundColor: "#E8384F" }}
      >
        Continuer
      </button>
    </>
  );
}
