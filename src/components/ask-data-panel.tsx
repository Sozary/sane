"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Quote } from "lucide-react";
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
  {
    icon: "01",
    title: "Mon repas le plus calorique cette semaine",
    accent: "var(--sane-accent)",
  },
  {
    icon: "02",
    title: "Combien de protéines je mange en moyenne ?",
    accent: "var(--sane-protein)",
  },
  {
    icon: "03",
    title: "Comparer cette semaine à la semaine dernière",
    accent: "var(--sane-fat)",
  },
  {
    icon: "04",
    title: "Quels jours j'ai dépassé mon objectif ?",
    accent: "var(--sane-burn)",
  },
] as const;

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
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1.5 group"
            >
              <div className="relative flex-1 w-full flex items-end">
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
            style={{
              backgroundColor: "rgba(0,0,0,0.025)",
            }}
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
      {/* Question as serif italic headline */}
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

      {/* Answer body */}
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

      {/* Follow-ups */}
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

export function AskDataPanel() {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || submitting) return;

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
          body: JSON.stringify({ message: trimmed, history }),
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
    [submitting, turns]
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {empty && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Hero */}
          <div className="relative rounded-3xl bg-card p-6 overflow-hidden shadow-sm">
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              aria-hidden
              style={{
                background:
                  "radial-gradient(circle at 110% -20%, var(--sane-accent-soft) 0%, transparent 55%), radial-gradient(circle at -10% 120%, #FFE9C4 0%, transparent 50%)",
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Sparkles
                  className="size-3.5"
                  style={{ color: "var(--sane-accent)" }}
                />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Demande à Sane
                </span>
              </div>
              <h2
                className="mt-3 font-serif text-[28px] leading-[1.05] text-foreground"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                <span className="italic">Interroge</span> tes données{" "}
                <span className="italic">comme</span> tu en parlerais
                <span style={{ color: "var(--sane-accent)" }}>.</span>
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-[34ch]">
                Pose une question en langage naturel sur tes repas, ton activité
                ou tes objectifs. Sane parcourt ton historique et te répond avec
                les chiffres.
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div className="px-1 mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Pour commencer
            </div>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.title}
                  onClick={() => ask(s.title)}
                  className="group relative text-left rounded-2xl bg-card p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
                    style={{ backgroundColor: s.accent }}
                    aria-hidden
                  />
                  <div className="flex items-baseline gap-3">
                    <span
                      className="font-serif text-base tabular-nums shrink-0"
                      style={{
                        fontFamily: "var(--font-serif), serif",
                        color: s.accent,
                        fontStyle: "italic",
                      }}
                    >
                      {s.icon}
                    </span>
                    <span
                      className="font-serif italic text-[17px] leading-tight text-foreground"
                      style={{ fontFamily: "var(--font-serif), serif" }}
                    >
                      {s.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Conversation */}
      {!empty && (
        <div className="space-y-6">
          {turns.map((turn) => (
            <AnswerCard key={turn.id} turn={turn} onFollowUp={ask} />
          ))}
          <div ref={threadEndRef} />
        </div>
      )}

      {/* Composer */}
      <div className={cn("sticky bottom-20 z-10", empty ? "" : "pt-2")}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(draft);
          }}
          className="relative"
        >
          <div className="relative rounded-3xl bg-card shadow-lg ring-1 ring-black/5 overflow-hidden focus-within:ring-2 focus-within:ring-[var(--sane-accent)] transition-all">
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              placeholder={empty ? "Pose ta question…" : "Continue la conversation…"}
              rows={1}
              maxLength={500}
              disabled={submitting}
              className="w-full resize-none bg-transparent px-5 pt-4 pb-3 pr-14 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
              style={{ minHeight: 56, maxHeight: 140 }}
            />
            <button
              type="submit"
              disabled={!draft.trim() || submitting}
              aria-label="Envoyer"
              className={cn(
                "absolute right-2.5 bottom-2.5 size-10 rounded-2xl flex items-center justify-center text-white transition-all",
                "disabled:opacity-30 disabled:cursor-not-allowed",
                "active:scale-95"
              )}
              style={{ backgroundColor: "var(--sane-plus)" }}
            >
              <ArrowUp className="size-5" />
            </button>
          </div>
          {turns.length > 0 && (
            <p className="mt-2 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Sane peut faire des erreurs. Vérifie les chiffres importants.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
