"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthCalendar, type DayAggregate } from "@/components/month-calendar";
import { MacroBar } from "@/components/macro-bar";
import {
  PeriodAnalysisResult,
  type PeriodAnalysisData,
} from "@/components/period-analysis-result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Preset = "7d" | "30d" | "month" | "custom";

interface MonthPayload {
  month: string;
  days: Record<string, DayAggregate>;
  goals: {
    calorieGoal: number;
    carbsG: number;
    proteinG: number;
    fatG: number;
  };
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatMonthFr(d: Date) {
  return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatDayShortFr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetweenInclusive(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function AnalysePage() {
  const today = useMemo(() => new Date(), []);

  const [monthCursor, setMonthCursor] = useState<Date>(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [monthData, setMonthData] = useState<MonthPayload | null>(null);
  const [loadingMonth, setLoadingMonth] = useState(true);

  const [preset, setPreset] = useState<Preset>("7d");
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PeriodAnalysisData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const currentMonthKey = `${monthCursor.getFullYear()}-${pad2(monthCursor.getMonth() + 1)}`;

  // Apply preset-based range
  useEffect(() => {
    if (preset === "custom") return;
    const now = new Date();
    if (preset === "7d") {
      setRangeStart(formatDate(addDays(now, -6)));
      setRangeEnd(formatDate(now));
    } else if (preset === "30d") {
      setRangeStart(formatDate(addDays(now, -29)));
      setRangeEnd(formatDate(now));
    } else if (preset === "month") {
      const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
      const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
      setRangeStart(formatDate(first));
      setRangeEnd(formatDate(last));
    }
  }, [preset, monthCursor]);

  // Fetch month data
  useEffect(() => {
    let cancelled = false;
    async function fetchMonth() {
      setLoadingMonth(true);
      setMonthData(null);
      try {
        const res = await fetch(`/api/daily-log/month?month=${currentMonthKey}`);
        if (res.ok) {
          const json = (await res.json()) as MonthPayload;
          if (!cancelled) setMonthData(json);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingMonth(false);
      }
    }
    fetchMonth();
    return () => {
      cancelled = true;
    };
  }, [currentMonthKey]);

  const prevMonth = useCallback(() => {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }, []);
  const nextMonth = useCallback(() => {
    setMonthCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }, []);

  const handleDayTap = useCallback(
    (date: string) => {
      if (preset === "custom") {
        if (!rangeStart || (rangeStart && rangeEnd)) {
          setRangeStart(date);
          setRangeEnd(null);
        } else {
          if (date >= rangeStart) {
            setRangeEnd(date);
          } else {
            setRangeEnd(rangeStart);
            setRangeStart(date);
          }
        }
      }
      setSelectedDay(date);
    },
    [preset, rangeStart, rangeEnd]
  );

  const handleAnalyze = useCallback(async () => {
    if (!rangeStart || !rangeEnd) return;
    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyse/period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate: rangeStart, endDate: rangeEnd }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setAnalysisError(err.error ?? "Erreur lors de l'analyse");
        return;
      }
      const json = (await res.json()) as PeriodAnalysisData;
      setAnalysis(json);
    } catch {
      setAnalysisError("Erreur réseau");
    } finally {
      setAnalyzing(false);
    }
  }, [rangeStart, rangeEnd]);

  const selectedDayData =
    selectedDay && monthData?.days[selectedDay]
      ? monthData.days[selectedDay]
      : null;
  const selectedDayHasData =
    selectedDayData &&
    (selectedDayData.mealsCount > 0 ||
      selectedDayData.caloriesBurned > 0 ||
      selectedDayData.steps > 0);

  const rangeDays =
    rangeStart && rangeEnd ? daysBetweenInclusive(rangeStart, rangeEnd) : 0;
  const monthReady = !loadingMonth && monthData?.month === currentMonthKey;

  return (
    <div className="px-4 py-6 pb-28 space-y-6">
      <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500">
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={prevMonth}
              className="cursor-pointer p-2 rounded-full bg-muted/30 hover:bg-muted/60 transition-colors"
              style={{ cursor: "pointer" }}
              aria-label="Mois précédent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <span className="text-base font-semibold capitalize">
              {formatMonthFr(monthCursor)}
            </span>
            <button
              onClick={nextMonth}
              className="cursor-pointer p-2 rounded-full bg-muted/30 hover:bg-muted/60 transition-colors"
              style={{ cursor: "pointer" }}
              aria-label="Mois suivant"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {(
              [
                { id: "7d" as Preset, label: "7 derniers jours" },
                { id: "30d" as Preset, label: "30 derniers jours" },
                { id: "month" as Preset, label: "Ce mois" },
                { id: "custom" as Preset, label: "Personnalisée" },
              ]
            ).map((p) => {
              const active = preset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPreset(p.id);
                    if (p.id === "custom") {
                      setRangeStart(null);
                      setRangeEnd(null);
                    }
                  }}
                  className={cn(
                    "shrink-0 px-3.5 h-9 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    active
                      ? "text-white border-transparent"
                      : "bg-background text-foreground border-border hover:bg-muted/60"
                  )}
                  style={active ? { backgroundColor: "#A4B465" } : undefined}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {!monthReady ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <MonthCalendar
              monthCursor={monthCursor}
              data={monthData?.days ?? {}}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              selectedDay={selectedDay}
              onDayTap={handleDayTap}
            />
          )}

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>Macros dans la cible&nbsp;:</span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: "#A4B465" }} />
              Glucides
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: "#F5B547" }} />
              Protéines
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: "#1F1F1F" }} />
              Lipides
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      {selectedDay && (
        <Card>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Détail</div>
                <div className="font-semibold capitalize">
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
              </div>
              <Link
                href={`/dashboard?date=${selectedDay}`}
                className="text-xs font-medium underline underline-offset-4"
                style={{ color: "#A4B465" }}
              >
                Voir la journée
              </Link>
            </div>

            {selectedDayHasData && selectedDayData ? (
              <>
                <div className="flex items-baseline gap-4">
                  <div>
                    <div className="text-2xl font-bold tabular-nums">
                      {Math.round(selectedDayData.caloriesConsumed)}
                    </div>
                    <div className="text-xs text-muted-foreground">kcal mangées</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-orange-500">
                      {Math.round(selectedDayData.caloriesBurned)}
                    </div>
                    <div className="text-xs text-muted-foreground">kcal brûlées</div>
                  </div>
                  {monthData && (
                    <div className="ml-auto text-right">
                      <div className="text-sm font-semibold tabular-nums">
                        {Math.round(
                          (selectedDayData.caloriesConsumed /
                            monthData.goals.calorieGoal) *
                          100
                        )}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">
                        de {monthData.goals.calorieGoal} kcal
                      </div>
                    </div>
                  )}
                </div>

                {monthData && (
                  <div className="space-y-3">
                    <MacroBar
                      label="Glucides"
                      current={selectedDayData.carbsG}
                      goal={monthData.goals.carbsG}
                      color="#A4B465"
                    />
                    <MacroBar
                      label="Protéines"
                      current={selectedDayData.proteinG}
                      goal={monthData.goals.proteinG}
                      color="#F5B547"
                    />
                    <MacroBar
                      label="Lipides"
                      current={selectedDayData.fatG}
                      goal={monthData.goals.fatG}
                      color="#1F1F1F"
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune donnée pour ce jour.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Range summary + Analyze button */}
      <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100 fill-mode-backwards">
        <CardContent className="space-y-3 pt-1">
          <div className="text-sm text-muted-foreground text-center">
            {rangeStart && rangeEnd ? (
              <>
                Période&nbsp;:{" "}
                <span className="font-medium text-foreground">
                  {formatDayShortFr(rangeStart)} → {formatDayShortFr(rangeEnd)}
                </span>{" "}
                ({rangeDays} {rangeDays > 1 ? "jours" : "jour"})
              </>
            ) : preset === "custom" ? (
              "Sélectionne un jour de début puis un jour de fin sur le calendrier."
            ) : (
              "Choisis une période."
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!rangeStart || !rangeEnd || analyzing}
            className={cn(
              "w-full h-12 rounded-xl font-medium text-white transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed",
              (!rangeStart || !rangeEnd || analyzing) && "opacity-50"
            )}
            style={{ backgroundColor: "#A4B465" }}
          >
            {analyzing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyse en cours…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analyser cette période
              </>
            )}
          </button>

          {analysisError && (
            <p className="text-sm text-destructive text-center">
              {analysisError === "analysis_failed"
                ? "L'analyse a échoué. Réessaie dans un instant."
                : analysisError}
            </p>
          )}
        </CardContent>
      </Card>

      {analysis && <PeriodAnalysisResult data={analysis} />}
    </div>
  );
}
