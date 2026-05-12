"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, MessageCircleQuestion, Quote, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AskAnswer, AskMessage } from "@/lib/validations/ask";

interface ConversationTurn {
  id: string;
  question: string;
  state: "loading" | "ready" | "error";
  answer?: AskAnswer;
  error?: string;
}

const SUGGESTIONS = [
  "Mon repas le plus calorique de la période",
  "Quels jours j'ai dépassé mon objectif ?",
  "Combien de protéines en moyenne par jour ?",
  "Compare cette période à la précédente",
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
    case "positive": return "var(--sane-accent)";
    case "warning": return "var(--sane-protein)";
    case "accent": return "var(--sane-accent)";
    default: return "var(--sane-plus)";
  }
}

function MiniBarChart({ chart }: { chart: NonNullable<AskAnswer["chart"]> }) {
  const max = Math.max(
    ...chart.data.map((d) => d.value),
    chart.goal ?? 0,
    1
  );
  const goalPct = chart.goal ? (chart.goal / max) * 100 : null;

  return (
    <div className="space-y-2.5">
      {chart.title && (
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {chart.title}
          </span>
          {chart.unit && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {chart.unit}
            </span>
          )}
        </div>
      )}
      <div className="relative h-28 flex items-end gap-1.5 px-0.5">
        {goalPct !== null && (
          <div
            className="absolute inset-x-0 border-t border-dashed pointer-events-none"
            style={{
              bottom: `${goalPct}%`,
              borderColor: "var(--sane-accent)",
              opacity: 0.55,
            }}
          >
            <span
              className="absolute -top-3 right-0 text-[9px] font-medium uppercase tracking-wider tabular-nums"
              style={{ color: "var(--sane-accent)" }}
            >
              obj. {Math.round(chart.goal!)}
            </span>
          </div>
        )}
        {chart.data.map((point, i) => {
          const h = Math.max((point.value / max) * 100, 1.5);
          const overGoal = chart.goal && point.value > chart.goal;
          return (
            <div key={i} className="flex-1 flex items-end">
              <div
                className="w-full rounded-t-md transition-all duration-300"
                style={{
                  height: `${h}%`,
                  backgroundColor: overGoal
                    ? "var(--sane-protein)"
                    : "var(--sane-plus)",
                  opacity: 0.92,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 px-0.5">
        {chart.data.map((point, i) => (
          <div
            key={i}
            className="flex-1 text-center text-[10px] text-muted-foreground tabular-nums truncate"
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
        return (
          <div
            key={i}
            className="relative rounded-2xl p-3 overflow-hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.025)" }}
          >
            <div
              className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <div className="pl-2">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground leading-tight">
                {h.label}
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span
                  className="text-2xl font-medium tabular-nums leading-none"
                  style={{ color }}
                >
                  {h.value}
                </span>
                {h.unit && (
                  <span className="text-[11px] text-muted-foreground">
                    {h.unit}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full inline-block animate-bounce"
          style={{
            backgroundColor: "var(--sane-accent)",
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
      <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5">
        {bulletBuffer.map((b, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed">
            <span
              className="mt-2 size-1 shrink-0 rounded-full"
              style={{ backgroundColor: "var(--sane-accent)" }}
            />
            <span>{b}</span>
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
        <p
          key={`p-${elements.length}`}
          className="text-[15px] leading-relaxed text-foreground"
        >
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
    <article className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-1 mb-3 flex gap-3 items-start">
        <Quote
          className="size-4 mt-2 shrink-0 -scale-x-100"
          style={{ color: "var(--sane-accent)" }}
        />
        <h3
          className="font-serif italic text-2xl leading-[1.15] text-foreground"
          style={{ fontFamily: "var(--font-serif), serif" }}
        >
          {turn.question}
        </h3>
      </div>

      <div className="relative bg-card rounded-3xl p-5 shadow-sm overflow-hidden">
        <div
          className="absolute -top-12 -right-12 size-40 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, var(--sane-accent-soft) 0%, transparent 70%)",
            opacity: 0.5,
          }}
          aria-hidden
        />

        {turn.state === "loading" && (
          <div className="relative space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
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
          <p className="text-sm text-destructive relative">
            {turn.error ?? "Impossible d'obtenir une réponse. Réessaie dans un instant."}
          </p>
        )}

        {turn.state === "ready" && turn.answer && (
          <div className="relative space-y-4">
            <AnswerBody text={turn.answer.answer} />

            {turn.answer.highlights && turn.answer.highlights.length > 0 && (
              <Highlights items={turn.answer.highlights} />
            )}

            {turn.answer.chart && turn.answer.chart.data.length > 0 && (
              <div className="rounded-2xl bg-muted/30 p-4 pt-3">
                <MiniBarChart chart={turn.answer.chart} />
              </div>
            )}

            {turn.answer.period && (
              <div className="flex items-center gap-2 pt-1">
                <span
                  className="size-1 rounded-full"
                  style={{ backgroundColor: "var(--sane-accent)" }}
                />
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {formatDayShortFr(turn.answer.period.start)}
                  {turn.answer.period.start !== turn.answer.period.end && (
                    <> → {formatDayShortFr(turn.answer.period.end)}</>
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {turn.state === "ready" &&
        turn.answer?.followUps &&
        turn.answer.followUps.length > 0 && (
          <div className="mt-3 px-1 flex flex-wrap gap-1.5">
            {turn.answer.followUps.map((f, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(f)}
                className="group text-[12px] px-3 h-8 rounded-full bg-card border border-border hover:bg-muted/40 transition-colors text-foreground/80 hover:text-foreground"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="size-1 rounded-full"
                    style={{ backgroundColor: "var(--sane-accent)" }}
                  />
                  {f}
                </span>
              </button>
            ))}
          </div>
        )}
    </article>
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
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-backwards">
      <div className="relative bg-card rounded-3xl shadow-sm overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(circle at 100% 0%, var(--sane-accent-soft) 0%, transparent 50%)",
            opacity: 0.45,
          }}
        />
        <div className="relative p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion
                className="size-3.5"
                style={{ color: "var(--sane-accent)" }}
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Demande à Sane
              </span>
            </div>
            {turns.length > 0 && (
              <button
                onClick={() => setTurns([])}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="size-3" />
                Effacer
              </button>
            )}
          </div>

          <h3
            className="font-serif text-[22px] leading-[1.15] text-foreground"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            <span className="italic">Pose une question</span> sur{" "}
            {period ? "cette période" : "ta période"}
            <span style={{ color: "var(--sane-accent)" }}>.</span>
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(draft);
            }}
            className="relative"
          >
            <div
              className={cn(
                "relative rounded-2xl bg-background/70 ring-1 ring-black/5 overflow-hidden transition-all",
                "focus-within:ring-2 focus-within:ring-[var(--sane-accent)]"
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
                className="w-full resize-none bg-transparent px-4 pt-3.5 pb-3 pr-12 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                style={{ minHeight: 52, maxHeight: 140 }}
              />
              <button
                type="submit"
                disabled={!draft.trim() || disabled}
                aria-label="Envoyer"
                className={cn(
                  "absolute right-2 bottom-2 size-9 rounded-xl flex items-center justify-center text-white transition-all",
                  "disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                )}
                style={{ backgroundColor: "var(--sane-plus)" }}
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
          </form>

          <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                disabled={disabled}
                className={cn(
                  "shrink-0 text-[12px] px-3 h-8 rounded-full bg-background/80 border border-border/60 transition-colors",
                  "hover:bg-muted/60 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed",
                  "text-foreground/80"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!empty && (
        <div className="space-y-6 pt-2">
          {turns.map((turn) => (
            <AnswerCard key={turn.id} turn={turn} onFollowUp={ask} />
          ))}
          <div ref={threadEndRef} />
        </div>
      )}

      {!empty && (
        <p className="text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground pt-1">
          Sane peut faire des erreurs. Vérifie les chiffres importants.
        </p>
      )}
    </div>
  );
}
