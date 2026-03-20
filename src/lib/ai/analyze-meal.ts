import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

function extractJSON(text: string): unknown {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Extract from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    throw new Error("Could not extract JSON from response");
  }
}

export interface MealAnalysisResult {
  name: string;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  weight_g: number | null;
  score: number;
}

const SYSTEM_PROMPT = `Tu es un nutritionniste expert. Analyse cette photo de repas et estime les valeurs nutritionnelles.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte additionnel :
{
  "name": "Nom du plat en français",
  "calories": nombre (kcal total estimé),
  "carbs_g": nombre (glucides en grammes),
  "protein_g": nombre (protéines en grammes),
  "fat_g": nombre (lipides en grammes),
  "weight_g": nombre ou null (poids total estimé en grammes),
  "score": nombre de 0 à 100 (score nutritionnel basé sur l'équilibre des macros, la densité calorique et la qualité nutritionnelle)
}

Règles pour le score :
- 90-100 : Excellent (repas équilibré, riche en nutriments, faible en calories vides)
- 70-89 : Bon (globalement sain avec quelques points à améliorer)
- 50-69 : Moyen (déséquilibre notable ou trop calorique)
- 30-49 : Faible (malbouffe ou très déséquilibré)
- 0-29 : Très faible (quasi aucun intérêt nutritionnel)

Sois précis dans tes estimations en te basant sur la taille apparente des portions.`;

export async function analyzeMealPhoto(imageBase64: string, mimeType: string): Promise<MealAnalysisResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyse ce repas.",
          },
        ],
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON(textBlock.text);
  return parsed as MealAnalysisResult;
}

const TEXT_SYSTEM_PROMPT = `Tu es un nutritionniste expert. À partir de la description textuelle d'un repas, estime les valeurs nutritionnelles.

Réponds UNIQUEMENT avec un objet JSON valide, sans texte additionnel :
{
  "name": "Nom du plat en français",
  "calories": nombre (kcal total estimé),
  "carbs_g": nombre (glucides en grammes),
  "protein_g": nombre (protéines en grammes),
  "fat_g": nombre (lipides en grammes),
  "weight_g": nombre ou null (poids total estimé en grammes),
  "score": nombre de 0 à 100 (score nutritionnel basé sur l'équilibre des macros, la densité calorique et la qualité nutritionnelle)
}

Règles pour le score :
- 90-100 : Excellent (repas équilibré, riche en nutriments, faible en calories vides)
- 70-89 : Bon (globalement sain avec quelques points à améliorer)
- 50-69 : Moyen (déséquilibre notable ou trop calorique)
- 30-49 : Faible (malbouffe ou très déséquilibré)
- 0-29 : Très faible (quasi aucun intérêt nutritionnel)

Estime des portions standard si aucune quantité n'est précisée.`;

export async function analyzeMealDescription(description: string): Promise<MealAnalysisResult> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: description,
      },
    ],
    system: TEXT_SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = extractJSON(textBlock.text);
  return parsed as MealAnalysisResult;
}
