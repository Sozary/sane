import Anthropic from "@anthropic-ai/sdk";
import { and, eq, gte, lte, desc, asc, ilike } from "drizzle-orm";
import { db } from "@/lib/db";
import { meals, activities, dailyLogs, users } from "@/lib/db/schema";
import type { AskAnswer, AskMessage } from "@/lib/validations/ask";

const anthropic = new Anthropic();

const MODEL = "claude-sonnet-4-20250514";
const MAX_ITERATIONS = 6;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function frenchDow(d: Date) {
  return d.toLocaleDateString("fr-FR", { weekday: "long" });
}

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_meals",
    description:
      "Retourne les repas de l'utilisateur sur une période. Champs renvoyés: id, date, mealType (breakfast|lunch|dinner|snack), name, calories (kcal), carbsG, proteinG, fatG, weightG, score (0-100), isFavorite. Utilise un nom partiel via name_contains pour filtrer (ex: 'salade').",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "Date ISO YYYY-MM-DD (incluse)" },
        end_date: { type: "string", description: "Date ISO YYYY-MM-DD (incluse)" },
        meal_type: {
          type: "string",
          enum: ["breakfast", "lunch", "dinner", "snack"],
          description: "Filtrer par type de repas",
        },
        name_contains: {
          type: "string",
          description: "Filtre insensible à la casse sur le nom du plat",
        },
        sort_by: {
          type: "string",
          enum: ["date_desc", "date_asc", "calories_desc", "calories_asc", "score_desc", "score_asc"],
          description: "Ordre de tri (défaut: date_desc)",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          description: "Nombre max de résultats (défaut: 50)",
        },
        favorites_only: {
          type: "boolean",
          description: "Si true, ne retourne que les repas favoris",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_activities",
    description:
      "Retourne les activités sportives sur une période. Champs: id, date, activityType, durationMinutes, caloriesBurned.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
        activity_type_contains: { type: "string" },
        sort_by: {
          type: "string",
          enum: ["date_desc", "date_asc", "calories_desc", "duration_desc"],
        },
        limit: { type: "integer", minimum: 1, maximum: 200 },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_daily_logs",
    description:
      "Retourne les logs journaliers (pas, eau, calories brûlées hors activités) sur une période. Champs: date, caloriesBurned, steps, waterMl.",
    input_schema: {
      type: "object",
      properties: {
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_user_profile",
    description:
      "Retourne le profil et les objectifs de l'utilisateur: heightCm, weightKg, age, gender, calorieGoal, macroCarbsPct, macroProteinPct, macroFatPct, et les grammes correspondants par macro (carbsG, proteinG, fatG).",
    input_schema: { type: "object", properties: {} },
  },
];

type MealType = "breakfast" | "lunch" | "dinner" | "snack";
const MEAL_TYPES: readonly MealType[] = ["breakfast", "lunch", "dinner", "snack"];

async function runGetMeals(userId: string, input: Record<string, unknown>) {
  const startDate = String(input.start_date ?? "");
  const endDate = String(input.end_date ?? "");
  const conds = [
    eq(meals.userId, userId),
    gte(meals.date, startDate),
    lte(meals.date, endDate),
  ];
  if (typeof input.meal_type === "string" && (MEAL_TYPES as readonly string[]).includes(input.meal_type)) {
    conds.push(eq(meals.mealType, input.meal_type as MealType));
  }
  if (input.name_contains) {
    conds.push(ilike(meals.name, `%${String(input.name_contains)}%`));
  }
  if (input.favorites_only === true) {
    conds.push(eq(meals.isFavorite, true));
  }

  const sortBy = String(input.sort_by ?? "date_desc");
  const orderBy = (() => {
    switch (sortBy) {
      case "date_asc": return asc(meals.date);
      case "calories_desc": return desc(meals.calories);
      case "calories_asc": return asc(meals.calories);
      case "score_desc": return desc(meals.score);
      case "score_asc": return asc(meals.score);
      default: return desc(meals.date);
    }
  })();

  const limit = Math.min(Math.max(Number(input.limit ?? 50), 1), 200);

  const rows = await db
    .select({
      id: meals.id,
      date: meals.date,
      mealType: meals.mealType,
      name: meals.name,
      calories: meals.calories,
      carbsG: meals.carbsG,
      proteinG: meals.proteinG,
      fatG: meals.fatG,
      weightG: meals.weightG,
      score: meals.score,
      isFavorite: meals.isFavorite,
    })
    .from(meals)
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(limit);

  return { count: rows.length, meals: rows };
}

async function runGetActivities(userId: string, input: Record<string, unknown>) {
  const startDate = String(input.start_date ?? "");
  const endDate = String(input.end_date ?? "");
  const conds = [
    eq(activities.userId, userId),
    gte(activities.date, startDate),
    lte(activities.date, endDate),
  ];
  if (input.activity_type_contains) {
    conds.push(ilike(activities.activityType, `%${String(input.activity_type_contains)}%`));
  }

  const sortBy = String(input.sort_by ?? "date_desc");
  const orderBy = (() => {
    switch (sortBy) {
      case "date_asc": return asc(activities.date);
      case "calories_desc": return desc(activities.caloriesBurned);
      case "duration_desc": return desc(activities.durationMinutes);
      default: return desc(activities.date);
    }
  })();

  const limit = Math.min(Math.max(Number(input.limit ?? 50), 1), 200);

  const rows = await db
    .select({
      id: activities.id,
      date: activities.date,
      activityType: activities.activityType,
      durationMinutes: activities.durationMinutes,
      caloriesBurned: activities.caloriesBurned,
    })
    .from(activities)
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(limit);

  return { count: rows.length, activities: rows };
}

async function runGetDailyLogs(userId: string, input: Record<string, unknown>) {
  const startDate = String(input.start_date ?? "");
  const endDate = String(input.end_date ?? "");
  const rows = await db
    .select({
      date: dailyLogs.date,
      caloriesBurned: dailyLogs.caloriesBurned,
      steps: dailyLogs.steps,
      waterMl: dailyLogs.waterMl,
    })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, userId),
        gte(dailyLogs.date, startDate),
        lte(dailyLogs.date, endDate)
      )
    )
    .orderBy(asc(dailyLogs.date));

  return { count: rows.length, daily_logs: rows };
}

async function runGetUserProfile(userId: string) {
  const [user] = await db
    .select({
      heightCm: users.heightCm,
      weightKg: users.weightKg,
      age: users.age,
      gender: users.gender,
      calorieGoal: users.calorieGoal,
      macroCarbsPct: users.macroCarbsPct,
      macroProteinPct: users.macroProteinPct,
      macroFatPct: users.macroFatPct,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "user_not_found" };

  const calorieGoal = user.calorieGoal ?? 2000;
  const carbsPct = user.macroCarbsPct ?? 40;
  const proteinPct = user.macroProteinPct ?? 30;
  const fatPct = user.macroFatPct ?? 30;

  return {
    heightCm: user.heightCm,
    weightKg: user.weightKg,
    age: user.age,
    gender: user.gender,
    calorieGoal,
    macroCarbsPct: carbsPct,
    macroProteinPct: proteinPct,
    macroFatPct: fatPct,
    carbsG: Math.round((calorieGoal * carbsPct) / 100 / 4),
    proteinG: Math.round((calorieGoal * proteinPct) / 100 / 4),
    fatG: Math.round((calorieGoal * fatPct) / 100 / 9),
  };
}

async function executeTool(
  userId: string,
  name: string,
  input: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "get_meals": return runGetMeals(userId, input);
    case "get_activities": return runGetActivities(userId, input);
    case "get_daily_logs": return runGetDailyLogs(userId, input);
    case "get_user_profile": return runGetUserProfile(userId);
    default: return { error: `unknown_tool:${name}` };
  }
}

function buildSystemPrompt(today: Date, period?: { start: string; end: string }): string {
  const todayStr = formatDateLocal(today);
  const dow = frenchDow(today);

  const periodBlock = period
    ? `
PÉRIODE ACTIVE (ne change que si l'utilisateur en demande explicitement une autre)
- Du ${period.start} au ${period.end} inclus
- Toutes les questions s'appliquent par défaut à cette période
- N'élargis cette période que si l'utilisateur le demande clairement (ex: "et le mois dernier ?", "compare à la semaine d'avant")
`
    : "";

  const defaultPeriodRule = period
    ? `- Quand l'utilisateur ne précise pas de période, utilise la PÉRIODE ACTIVE indiquée ci-dessus.`
    : `- Si l'utilisateur ne précise pas de période, utilise par défaut les 7 derniers jours.`;

  return `Tu es Sane, un assistant nutritionnel intelligent qui aide l'utilisateur à comprendre ses propres données de suivi.

CONTEXTE TEMPOREL
- Aujourd'hui : ${dow} ${todayStr}
- "cette semaine" = du lundi au dimanche de la semaine courante
- "la semaine dernière" = la semaine ISO précédente
- "ce mois" = du 1er du mois courant à aujourd'hui
- "hier", "avant-hier", "il y a X jours" : calcule par rapport à aujourd'hui
${periodBlock}
RÈGLES
- Réponds toujours en français, ton chaleureux mais factuel.
- Utilise les outils pour récupérer les données AVANT de répondre. Ne devine jamais des chiffres.
- Si la question concerne une comparaison entre deux périodes, fais deux appels d'outils.
${defaultPeriodRule}
- Si aucune donnée n'existe pour la période demandée, dis-le clairement et propose une alternative.
- Sois bref et scannable. Pas de paragraphe long. Tu peux utiliser des listes courtes.
- Mentionne les chiffres clés directement dans le texte.

FORMAT DE RÉPONSE FINALE
Quand tu as toutes les données nécessaires, ta dernière réponse DOIT être un objet JSON valide unique, sans texte autour, sans markdown, suivant ce schéma :

{
  "answer": "Texte de réponse en français, 1 à 4 phrases max. Tu peux utiliser de courtes listes avec - en début de ligne. Pas de markdown gras/italique.",
  "highlights": [
    { "label": "Étiquette courte", "value": "valeur formatée (ex: '2 134' ou '85%')", "unit": "kcal", "tone": "neutral|positive|warning|accent" }
  ],
  "chart": {
    "title": "Titre du graphique (optionnel)",
    "unit": "kcal",
    "goal": 2000,
    "data": [ { "label": "Lun", "value": 1850 }, { "label": "Mar", "value": 2100 } ]
  },
  "period": { "start": "2026-05-05", "end": "2026-05-12" },
  "followUps": ["Question de suivi 1", "Question de suivi 2", "Question de suivi 3"]
}

Règles pour le JSON :
- "highlights" : 0 à 4 éléments. Inclus-en quand un chiffre est central à la réponse.
- "chart" : optionnel. N'inclus que si la donnée se prête à une visualisation par barres (ex: par jour, par repas, par catégorie). 2 à 14 points max.
- "period" : la période effectivement consultée (sert de contexte sous la réponse).
- "followUps" : 2 à 3 suggestions de questions naturelles de relance, courtes, qui creusent le sujet ou ouvrent une question voisine.
- "tone" choisis : "positive" (vert) pour bons résultats, "warning" (ambre) pour alertes, "accent" (sage) pour les valeurs marquantes neutres, "neutral" pour le reste.

Si aucune donnée disponible, retourne un JSON minimal avec un answer explicatif et des followUps suggérant des questions plus larges.`;
}

function extractJSON(text: string): unknown {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Could not extract JSON from model response");
  }
}

function normalizeAnswer(raw: unknown, fallback: string): AskAnswer {
  if (!raw || typeof raw !== "object") {
    return { answer: fallback };
  }
  const o = raw as Record<string, unknown>;
  const answer = typeof o.answer === "string" && o.answer.trim().length > 0 ? o.answer : fallback;

  const highlights: AskAnswer["highlights"] = Array.isArray(o.highlights)
    ? o.highlights
        .filter((h): h is Record<string, unknown> => !!h && typeof h === "object")
        .map((h): NonNullable<AskAnswer["highlights"]>[number] => {
          const tone: NonNullable<AskAnswer["highlights"]>[number]["tone"] =
            h.tone === "positive" || h.tone === "warning" || h.tone === "accent"
              ? h.tone
              : "neutral";
          return {
            label: String(h.label ?? ""),
            value: String(h.value ?? ""),
            unit: typeof h.unit === "string" ? h.unit : undefined,
            tone,
          };
        })
        .filter((h) => h.label && h.value)
        .slice(0, 4)
    : undefined;

  const chartRaw = o.chart;
  let chart: AskAnswer["chart"];
  if (chartRaw && typeof chartRaw === "object") {
    const c = chartRaw as Record<string, unknown>;
    const data = Array.isArray(c.data)
      ? c.data
          .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
          .map((p) => ({ label: String(p.label ?? ""), value: Number(p.value ?? 0) }))
          .filter((p) => p.label && Number.isFinite(p.value))
          .slice(0, 14)
      : [];
    if (data.length >= 2) {
      chart = {
        title: typeof c.title === "string" ? c.title : undefined,
        unit: typeof c.unit === "string" ? c.unit : undefined,
        goal: typeof c.goal === "number" ? c.goal : undefined,
        data,
      };
    }
  }

  const period =
    o.period &&
    typeof o.period === "object" &&
    typeof (o.period as Record<string, unknown>).start === "string" &&
    typeof (o.period as Record<string, unknown>).end === "string"
      ? {
          start: String((o.period as Record<string, unknown>).start),
          end: String((o.period as Record<string, unknown>).end),
        }
      : undefined;

  const followUps = Array.isArray(o.followUps)
    ? o.followUps
        .filter((f): f is string => typeof f === "string" && f.trim().length > 0)
        .slice(0, 3)
    : undefined;

  return { answer, highlights, chart, period, followUps };
}

export async function askData(
  userId: string,
  message: string,
  history: AskMessage[],
  period?: { start: string; end: string }
): Promise<AskAnswer> {
  const today = new Date();
  const system = buildSystemPrompt(today, period);

  const messages: Anthropic.Messages.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: message },
  ];

  let lastTextBlock = "";

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system,
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const results: Anthropic.Messages.ToolResultBlockParam[] = await Promise.all(
        toolUseBlocks.map(async (tu) => {
          try {
            const out = await executeTool(userId, tu.name, tu.input as Record<string, unknown>);
            return {
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(out),
            };
          } catch (err) {
            return {
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify({ error: (err as Error).message }),
              is_error: true,
            };
          }
        })
      );

      messages.push({ role: "user", content: results });
      continue;
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.Messages.TextBlock => b.type === "text"
    );
    lastTextBlock = textBlock?.text ?? "";
    break;
  }

  if (!lastTextBlock) {
    return {
      answer: "Je n'ai pas pu générer de réponse. Réessaie dans un instant.",
    };
  }

  try {
    const parsed = extractJSON(lastTextBlock);
    return normalizeAnswer(parsed, lastTextBlock);
  } catch {
    return { answer: lastTextBlock };
  }
}
