"use client";

import { Trophy, Lock } from "lucide-react";

export default function SuccesPage() {
  return (
    <div className="px-4 py-6 space-y-6">
      <div className="flex flex-col items-center text-center pt-8 gap-4">
        <div
          className="size-20 rounded-full flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: "#A4B465" }}
        >
          <Trophy className="size-10" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Succès</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Débloque des trophées en atteignant tes objectifs
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { name: "Premier repas", desc: "Logger ton tout premier repas" },
          { name: "Série de 7 jours", desc: "Logger tes repas 7 jours d'affilée" },
          { name: "Équilibre parfait", desc: "Atteindre tes 3 macros sur une journée" },
          { name: "Marathonien", desc: "Atteindre 10 000 pas 30 jours de suite" },
        ].map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 opacity-60"
          >
            <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Lock className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground pt-4">
        Bientôt disponible
      </p>
    </div>
  );
}
