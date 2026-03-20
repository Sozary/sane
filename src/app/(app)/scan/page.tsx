"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, Loader2, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ScanPage() {
  const router = useRouter();
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
      if (!res.ok) throw new Error("Analysis failed");
      const analysis = await res.json();
      router.push(
        `/meals/new?analysis=${encodeURIComponent(JSON.stringify(analysis))}`
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
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
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
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 transition-colors hover:border-foreground/40 hover:bg-muted/20 active:bg-muted/30"
          >
            <div
              className="size-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(232, 56, 79, 0.1)" }}
            >
              <Camera className="size-7" style={{ color: "#E8384F" }} />
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

          {/* Manual entry link */}
          <div className="text-center">
            <Link
              href="/meals/new"
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "#E8384F" }}
            >
              Ou entrer manuellement
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* Image preview */}
          <div className="relative">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Aperçu du repas"
                className="w-full rounded-xl max-h-80 object-cover"
              />
            )}

            {/* Analyzing overlay */}
            {analyzing && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex flex-col items-center justify-center gap-3">
                <Loader2 className="size-10 text-white animate-spin" />
                <p className="text-sm font-medium text-white">
                  Analyse en cours...
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center font-medium">
              {error}
            </p>
          )}

          {/* Action buttons */}
          {!analyzing && (
            <div className="flex items-center gap-3">
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
                style={{ backgroundColor: "#E8384F" }}
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
