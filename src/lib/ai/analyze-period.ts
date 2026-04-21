import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

function extractJSON(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    throw new Error("Could not extract JSON from response");
  }
}

export interface PeriodAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

export interface PeriodDayInput {
  date: string;
  caloriesConsumed: number;
  caloriesBurned: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  steps: number;
  waterMl: number;
  mealsCount: number;
}

export interface PeriodGoals {
  calorieGoal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
}

const SYSTEM_PROMPT = `Tu es un coach nutritionniste bienveillant et expert. On te fournit les données quotidiennes d'un utilisateur sur une période, ainsi que ses objectifs personnels.

Ton rôle est d'analyser la période pour produire un commentaire utile, honnête et encourageant sur son apport calorique et son activité sportive.

Règles IMPORTANTES :
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte additionnel, sans markdown.
- Tout le contenu doit être en français.
- Si la période ne contient aucun jour logué, retourne un JSON avec summary expliquant qu'il n'y a pas encore de données, et des listes vides ou des conseils génériques pour commencer.
- Sois concret et chiffré (ex: "Tu as dépassé ton objectif 4 jours sur 7").
- Reste bref et scannable : le résumé en 1-2 phrases, 2 à 4 éléments par liste.

Schéma de sortie :
{
  "summary": "Résumé général en 1-2 phrases",
  "strengths": ["Point fort 1", "Point fort 2"],
  "weaknesses": ["Point à améliorer 1", "Point à améliorer 2"],
  "advice": ["Conseil actionnable 1", "Conseil actionnable 2", "Conseil actionnable 3"]
}`;

function buildUserPrompt(
  days: PeriodDayInput[],
  goals: PeriodGoals,
  startDate: string,
  endDate: string
): string {
  const totalDays = days.length;
  const loggedDays = days.filter((d) => d.mealsCount > 0 || d.caloriesBurned > 0).length;

  const totalCaloriesConsumed = days.reduce((s, d) => s + d.caloriesConsumed, 0);
  const totalCaloriesBurned = days.reduce((s, d) => s + d.caloriesBurned, 0);
  const totalSteps = days.reduce((s, d) => s + d.steps, 0);
  const avgCaloriesConsumed = loggedDays > 0 ? totalCaloriesConsumed / loggedDays : 0;
  const avgCaloriesBurned = loggedDays > 0 ? totalCaloriesBurned / loggedDays : 0;
  const avgCarbs = loggedDays > 0 ? days.reduce((s, d) => s + d.carbsG, 0) / loggedDays : 0;
  const avgProtein = loggedDays > 0 ? days.reduce((s, d) => s + d.proteinG, 0) / loggedDays : 0;
  const avgFat = loggedDays > 0 ? days.reduce((s, d) => s + d.fatG, 0) / loggedDays : 0;

  const dayLines = days
    .map((d) => {
      return `- ${d.date} : ${Math.round(d.caloriesConsumed)} kcal consommées, ${Math.round(d.caloriesBurned)} kcal brûlées, glucides ${Math.round(d.carbsG)}g, protéines ${Math.round(d.proteinG)}g, lipides ${Math.round(d.fatG)}g, ${d.steps} pas, ${d.mealsCount} repas`;
    })
    .join("\n");

  return `Période analysée : du ${startDate} au ${endDate} (${totalDays} jours, ${loggedDays} jours avec données).

Objectifs quotidiens de l'utilisateur :
- ${goals.calorieGoal} kcal
- Glucides : ${goals.carbsG}g
- Protéines : ${goals.proteinG}g
- Lipides : ${goals.fatG}g

Totaux et moyennes (sur les jours logués) :
- Total kcal consommées : ${Math.round(totalCaloriesConsumed)} (moyenne ${Math.round(avgCaloriesConsumed)}/jour)
- Total kcal brûlées : ${Math.round(totalCaloriesBurned)} (moyenne ${Math.round(avgCaloriesBurned)}/jour)
- Total pas : ${totalSteps}
- Moyenne glucides : ${Math.round(avgCarbs)}g, protéines ${Math.round(avgProtein)}g, lipides ${Math.round(avgFat)}g

Détail jour par jour :
${dayLines || "(aucun jour logué)"}

Analyse cette période et renvoie le JSON demandé.`;
}

export async function analyzePeriod(
  days: PeriodDayInput[],
  goals: PeriodGoals,
  startDate: string,
  endDate: string
): Promise<PeriodAnalysisResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: buildUserPrompt(days, goals, startDate, endDate),
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON(textBlock.text) as PeriodAnalysisResult;

  return {
    summary: parsed.summary ?? "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    advice: Array.isArray(parsed.advice) ? parsed.advice : [],
  };
}
