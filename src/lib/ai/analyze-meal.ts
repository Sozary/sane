import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

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

  const parsed = JSON.parse(textBlock.text);
  return parsed as MealAnalysisResult;
}
