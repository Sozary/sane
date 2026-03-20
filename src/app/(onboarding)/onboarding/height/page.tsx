"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function OnboardingHeightPage() {
  const router = useRouter();
  const [heightCm, setHeightCm] = useState(170);
  const [unit, setUnit] = useState<"cm" | "pieds">("cm");

  const feet = Math.floor(heightCm / 30.48);
  const inches = Math.round((heightCm / 2.54) % 12);

  const handleSliderChange = (values: number | readonly number[]) => {
    setHeightCm(Array.isArray(values) ? values[0] : values);
  };

  const handleContinue = () => {
    const data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    localStorage.setItem(
      "onboarding",
      JSON.stringify({ ...data, heightCm })
    );
    router.push("/onboarding/info");
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#E8384F] text-xl font-bold">Sane</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Quelle est votre taille ?</h1>
          <p className="text-sm text-muted-foreground">
            Votre taille aide à déterminer votre silhouette
          </p>
        </div>

        {/* Unit toggle */}
        <div className="flex rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => setUnit("cm")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              unit === "cm"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground"
            )}
          >
            cm
          </button>
          <button
            onClick={() => setUnit("pieds")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              unit === "pieds"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground"
            )}
          >
            pieds
          </button>
        </div>

        {/* Height display */}
        <div className="flex items-baseline gap-2">
          {unit === "cm" ? (
            <>
              <span className="text-7xl font-bold tabular-nums">
                {heightCm}
              </span>
              <span className="text-2xl text-muted-foreground">cm</span>
            </>
          ) : (
            <>
              <span className="text-7xl font-bold tabular-nums">{feet}</span>
              <span className="text-2xl text-muted-foreground mr-1">&apos;</span>
              <span className="text-7xl font-bold tabular-nums">{inches}</span>
              <span className="text-2xl text-muted-foreground">&quot;</span>
            </>
          )}
        </div>

        {/* Slider */}
        <div className="w-full px-4">
          <Slider
            value={[heightCm]}
            onValueChange={handleSliderChange}
            min={100}
            max={220}
            step={1}
            className="w-full"
          />
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
