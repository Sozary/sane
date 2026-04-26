"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Upload, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { MealType } from "@/types";

function isMealType(value: string | null): value is MealType {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack";
}

function ScanForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const typeParam = searchParams.get("type");
  const mealTypeParam = isMealType(typeParam) ? typeParam : null;
  const dashboardUrl = dateParam ? `/dashboard?date=${dateParam}` : "/dashboard";
  const dateQuery = dateParam ? `&date=${dateParam}` : "";
  const typeQuery = mealTypeParam ? `&type=${mealTypeParam}` : "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setAnalyzing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        body: formData,
      });
      if (res.status === 422) {
        setError("Repas non reconnu. Veuillez reprendre une photo ou essayer un autre angle.");
        return;
      }
      if (!res.ok) throw new Error("Analysis failed");
      const analysis = await res.json();
      router.push(
        `/meals/new?analysis=${encodeURIComponent(JSON.stringify(analysis))}${dateQuery}${typeQuery}`
      );
    } catch {
      setError("L'analyse a échoué. Veuillez réessayer.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <Link href={dashboardUrl}>
          <Button variant="ghost" size="icon" className="cursor-pointer">
            <ArrowLeft className="size-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Scanner un repas</h1>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!selectedFile ? (
        <>
          {/* Upload zone */}
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-backwards">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 transition-colors hover:border-foreground/40 hover:bg-muted/20 active:bg-muted/30"
            >
              <div
                className="size-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--sane-accent-soft)" }}
              >
                <Camera className="size-7" style={{ color: "#A4B465" }} />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium">
                  Prendre une photo ou importer
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou HEIC
                </p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Upload className="size-4" />
                <span className="text-xs">Parcourir les fichiers</span>
              </div>
            </button>
          </div>

          {/* Manual entry link */}
          <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-backwards">
            <Link
              href={
                dateParam || mealTypeParam
                  ? `/meals/new?${[
                      dateParam ? `date=${dateParam}` : null,
                      mealTypeParam ? `type=${mealTypeParam}` : null,
                    ]
                      .filter(Boolean)
                      .join("&")}`
                  : "/meals/new"
              }
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "#A4B465" }}
            >
              Ou entrer manuellement
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Image preview */}
          <div className="relative animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-backwards">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Aperçu du repas"
                className="w-full rounded-xl max-h-80 object-cover"
              />
            )}

            {/* Analyzing overlay */}
            {analyzing && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                <Loader2 className="size-10 text-white animate-spin" />
                <p className="text-sm font-medium text-white">
                  Analyse en cours...
                </p>
              </div>
            )}
          </div>

          {/* Not recognized modal */}
          {error && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 animate-in fade-in duration-200">
              <div className="bg-background rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                <h3 className="text-lg font-bold text-center">Repas non reconnu</h3>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => { setError(null); handleReset(); }}
                    className={cn(
                      "w-full h-11 rounded-xl font-medium text-sm text-white flex items-center justify-center gap-2"
                    )}
                    style={{ backgroundColor: "#A4B465" }}
                  >
                    <RotateCcw className="size-4" />
                    Reprendre une photo
                  </button>
                  <Link
                    href={
                      dateParam || mealTypeParam
                        ? `/meals/new?${[
                            dateParam ? `date=${dateParam}` : null,
                            mealTypeParam ? `type=${mealTypeParam}` : null,
                          ]
                            .filter(Boolean)
                            .join("&")}`
                        : "/meals/new"
                    }
                    className="w-full h-11 rounded-xl font-medium text-sm border border-border flex items-center justify-center gap-2 hover:bg-muted transition-colors"
                  >
                    Entrer manuellement
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!analyzing && !error && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-backwards">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 gap-2"
                onClick={handleReset}
              >
                <RotateCcw className="size-4" />
                Reprendre
              </Button>
              <button
                type="button"
                onClick={handleAnalyze}
                className={cn(
                  "flex-1 h-12 rounded-lg font-medium text-sm text-white flex items-center justify-center gap-2 transition-opacity active:translate-y-px"
                )}
                style={{ backgroundColor: "#A4B465" }}
              >
                <Camera className="size-4" />
                Analyser
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ScanForm />
    </Suspense>
  );
}
