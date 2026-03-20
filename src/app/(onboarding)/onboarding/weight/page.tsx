"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export default function OnboardingWeightPage() {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState(70);
  const [unit, setUnit] = useState<"kg" | "lb">("kg");

  const displayValue =
    unit === "kg" ? weightKg : Math.round(weightKg * 2.205 * 10) / 10;
  const min = unit === "kg" ? 30 : 66;
  const max = unit === "kg" ? 200 : 440;
  const step = 0.1;

  const handleSliderChange = (values: number | readonly number[]) => {
    const val = Array.isArray(values) ? values[0] : values;
    setWeightKg(unit === "kg" ? val : val / 2.205);
  };

  const handleContinue = () => {
    const data = JSON.parse(localStorage.getItem("onboarding") || "{}");
    localStorage.setItem("onboarding", JSON.stringify({ ...data, weightKg }));
    router.push("/onboarding/height");
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#E8384F] text-xl font-bold">Sane</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Quel est votre poids ?</h1>
          <p className="text-sm text-muted-foreground">
            C&apos;est ici que votre parcours commence
          </p>
        </div>

        {/* Unit toggle */}
        <div className="flex rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => setUnit("kg")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              unit === "kg"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground"
            )}
          >
            kg
          </button>
          <button
            onClick={() => setUnit("lb")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
              unit === "lb"
                ? "bg-white shadow-sm text-foreground"
                : "text-muted-foreground"
            )}
          >
            lb
          </button>
        </div>

        {/* Weight display */}
        <div className="flex items-baseline gap-2">
          <span className="text-7xl font-bold tabular-nums">
            {displayValue.toFixed(1).replace(".", ",")}
          </span>
          <span className="text-2xl text-muted-foreground">{unit}</span>
        </div>

        {/* Slider */}
        <div className="w-full px-4">
          <Slider
            value={[displayValue]}
            onValueChange={handleSliderChange}
            min={min}
            max={max}
            step={step}
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
