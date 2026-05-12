"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircleQuestion, Quote, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AskAnswer, AskMessage } from "@/lib/validations/ask";

interface ConversationTurn {
  id: string;
  question: string;
  state: "loading" | "ready" | "error";
  answer?: AskAnswer;
  error?: string;
}

const SUGGESTIONS = [
  "Mon repas le plus calorique",
  "Quels jours j'ai dépassé mon objectif",
  "Moyenne de protéines par jour",
  "Compare à la période d'avant",
  "Mes 3 plus grosses sources de glucides",
  "Mon meilleur jour côté équilibre",
] as const;

interface AskDataPanelProps {
  period: { start: string; end: string } | null;
}

function formatDayShortFr(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function toneToColor(tone: string | undefined) {
  switch (tone) {
    case "positive": return "#A4B465";
    case "warning": return "#F5B547";
    case "accent": return "#A4B465";
    default: return "#1F1F1F";
  }
}

function formatCompactValue(raw: string): string {
  const trimmed = raw.trim();
  // Match a pure numeric value, optionally with thousands separators (space / nbsp / thin space)
  // and optional decimal part (comma or dot). Returns the original string if it's not a clean number.
  const cleaned = trimmed.replace(/[\s   ]/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return raw;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return raw;
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const v = n / 1_000_000;
    return `${formatNumberFr(v, abs >= 10_000_000 ? 0 : 1)}M`;
  }
  if (abs >= 10_000) {
    return `${formatNumberFr(n / 1_000, 0)}k`;
  }
  if (abs >= 1_000) {
    return `${formatNumberFr(n / 1_000, 1)}k`;
  }
  return formatNumberFr(n, n % 1 === 0 ? 0 : 1);
}

function formatNumberFr(n: number, decimals: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function MiniBarChart({ chart }: { chart: NonNullable<AskAnswer["chart"]> }) {
  const max = Math.max(...chart.data.map((d) => d.value), chart.goal ?? 0, 1);
  const goalPct = chart.goal ? (chart.goal / max) * 100 : null;

  return (
    <div className="space-y-2">
      {chart.title && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs text-muted-foreground truncate">
            {chart.title}
          </span>
          {chart.unit && (
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {chart.unit}
            </span>
          )}
        </div>
      )}
      <div className="relative h-24 flex items-end gap-1.5">
        {goalPct !== null && (
          <div
            className="absolute inset-x-0 border-t border-dashed pointer-events-none"
            style={{ bottom: `${goalPct}%`, borderColor: "#A4B465", opacity: 0.6 }}
          >
            <span
              className="absolute -top-3.5 right-0 text-[10px] tabular-nums"
              style={{ color: "#A4B465" }}
            >
              obj. {Math.round(chart.goal!)}
            </span>
          </div>
        )}
        {chart.data.map((point, i) => {
          const h = Math.max((point.value / max) * 100, 2);
          const overGoal = chart.goal && point.value > chart.goal;
          return (
            <div
              key={i}
              className="flex-1 min-w-0 rounded-t-sm transition-all duration-300"
              style={{
                height: `${h}%`,
                backgroundColor: overGoal ? "#F5B547" : "#1F1F1F",
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {chart.data.map((point, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 text-center text-[10px] text-muted-foreground tabular-nums truncate"
          >
            {point.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function Highlights({ items }: { items: NonNullable<AskAnswer["highlights"]> }) {
  return (
    <div
      className={cn(
        "grid gap-2",
        items.length === 1 && "grid-cols-1",
        items.length === 2 && "grid-cols-2",
        items.length === 3 && "grid-cols-3",
        items.length >= 4 && "grid-cols-2"
      )}
    >
      {items.map((h, i) => {
        const color = toneToColor(h.tone);
        const formatted = formatCompactValue(h.value);
        return (
          <div
            key={i}
            className="rounded-xl bg-muted/40 p-2.5 min-w-0"
          >
            <div
              className="text-[11px] text-muted-foreground leading-tight line-clamp-2 break-words"
              title={h.label}
            >
              {h.label}
            </div>
            <div className="mt-1 flex items-baseline gap-1 min-w-0">
              <span
                className="text-xl font-bold tabular-nums leading-none"
                style={{ color }}
              >
                {formatted}
              </span>
              {h.unit && (
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {h.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full inline-block animate-bounce"
          style={{
            backgroundColor: "#A4B465",
            animationDelay: `${i * 140}ms`,
            animationDuration: "900ms",
          }}
        />
      ))}
    </div>
  );
}

function AnswerBody({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    elements.push(
      <ul key={`ul-${elements.length}`} className="space-y-1.5 my-1">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span
              className="mt-2 size-1 shrink-0 rounded-full"
              style={{ backgroundColor: "#A4B465" }}
            />
            <span className="min-w-0">{b}</span>
          </li>
        ))}
      </ul>
    );
    bulletBuffer = [];
  };

  for (const line of lines) {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      bulletBuffer.push(line.replace(/^[-•]\s+/, ""));
    } else {
      flushBullets();
      elements.push(
        <p key={`p-${elements.length}`} className="text-sm leading-relaxed">
          {line}
        </p>
      );
    }
  }
  flushBullets();
  return <div className="space-y-2">{elements}</div>;
}

interface AnswerCardProps {
  turn: ConversationTurn;
  onFollowUp: (q: string) => void;
}

function AnswerCard({ turn, onFollowUp }: AnswerCardProps) {
  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-start gap-2 text-sm font-semibold">
            <Quote
              className="size-3.5 mt-1 shrink-0 -scale-x-100"
              style={{ color: "#A4B465" }}
            />
            <span className="leading-snug min-w-0 break-words">{turn.question}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {turn.state === "loading" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Sane consulte tes données
                </span>
                <ThinkingDots />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-4/5 rounded-full bg-muted/60 animate-pulse" />
                <div className="h-3 w-3/5 rounded-full bg-muted/60 animate-pulse [animation-delay:120ms]" />
                <div className="h-3 w-2/3 rounded-full bg-muted/60 animate-pulse [animation-delay:240ms]" />
              </div>
            </div>
          )}

          {turn.state === "error" && (
            <p className="text-sm text-destructive">
              {turn.error ?? "Impossible d'obtenir une réponse. Réessaie dans un instant."}
            </p>
          )}

          {turn.state === "ready" && turn.answer && (
            <>
              <AnswerBody text={turn.answer.answer} />

              {turn.answer.highlights && turn.answer.highlights.length > 0 && (
                <Highlights items={turn.answer.highlights} />
              )}

              {turn.answer.chart && turn.answer.chart.data.length > 0 && (
                <div className="rounded-xl bg-muted/30 p-3">
                  <MiniBarChart chart={turn.answer.chart} />
                </div>
              )}

              {turn.answer.period && (
                <div className="text-[11px] text-muted-foreground">
                  {formatDayShortFr(turn.answer.period.start)}
                  {turn.answer.period.start !== turn.answer.period.end && (
                    <> → {formatDayShortFr(turn.answer.period.end)}</>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {turn.state === "ready" &&
        turn.answer?.followUps &&
        turn.answer.followUps.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {turn.answer.followUps.map((f, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(f)}
                className="px-3.5 h-9 rounded-full text-xs font-medium border bg-background text-foreground border-border hover:bg-muted/60 transition-colors cursor-pointer text-left"
              >
                {f}
              </button>
            ))}
          </div>
        )}
    </div>
  );
}

export function AskDataPanel({ period }: AskDataPanelProps) {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || submitting || !period) return;

      const id = crypto.randomUUID();
      const history: AskMessage[] = turns
        .filter((t) => t.state === "ready" && t.answer)
        .flatMap((t) => [
          { role: "user" as const, content: t.question },
          { role: "assistant" as const, content: t.answer!.answer },
        ]);

      setTurns((prev) => [
        ...prev,
        { id, question: trimmed, state: "loading" },
      ]);
      setDraft("");
      setSubmitting(true);

      try {
        const res = await fetch("/api/analyse/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history, period }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setTurns((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    state: "error",
                    error:
                      err.error === "ask_failed"
                        ? "L'analyse a échoué. Réessaie dans un instant."
                        : err.error ?? "Erreur",
                  }
                : t
            )
          );
          return;
        }
        const json = (await res.json()) as AskAnswer;
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, state: "ready", answer: json } : t
          )
        );
      } catch {
        setTurns((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, state: "error", error: "Erreur réseau" } : t
          )
        );
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, turns, period]
  );

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(draft);
    }
  };

  const empty = turns.length === 0;
  const disabled = !period || submitting;
  const placeholder = !period
    ? "Sélectionne une période d'abord…"
    : empty
    ? "Pose ta question sur cette période…"
    : "Continue la conversation…";

  return (
    <div className="space-y-4">
      <Card className="animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150 fill-mode-backwards">
        <CardContent className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircleQuestion
                className="size-4 shrink-0"
                style={{ color: "#A4B465" }}
              />
              <span className="text-sm font-semibold truncate">
                Pose une question
              </span>
            </div>
            {turns.length > 0 && (
              <button
                type="button"
                onClick={() => setTurns([])}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <RotateCcw className="size-3" />
                Effacer
              </button>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
          >
            <div
              className={cn(
                "relative rounded-xl bg-background border border-border transition-colors",
                "focus-within:border-[#A4B465]"
              )}
            >
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                placeholder={placeholder}
                rows={1}
                maxLength={500}
                disabled={disabled}
                className="block w-full resize-none bg-transparent px-3.5 py-3 pr-12 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                style={{ minHeight: 48, maxHeight: 140 }}
              />
              <button
                type="submit"
                disabled={!draft.trim() || disabled}
                aria-label="Envoyer"
                className={cn(
                  "absolute right-1.5 bottom-1.5 size-9 rounded-lg flex items-center justify-center text-white transition-all",
                  "disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                )}
                style={{ backgroundColor: "#A4B465" }}
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                disabled={disabled}
                className={cn(
                  "shrink-0 px-3.5 h-9 rounded-full text-xs font-medium border transition-colors",
                  "bg-background text-foreground border-border hover:bg-muted/60",
                  "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {!empty && (
        <div className="space-y-4">
          {turns.map((turn) => (
            <AnswerCard key={turn.id} turn={turn} onFollowUp={ask} />
          ))}
          <div ref={threadEndRef} />
          <p className="text-center text-[11px] text-muted-foreground">
            Sane peut faire des erreurs. Vérifie les chiffres importants.
          </p>
        </div>
      )}
    </div>
  );
}
