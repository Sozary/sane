# AI Prompts - Sane App

Claude Vision prompts and configuration for meal photo analysis.

## Overview

The Sane app uses Anthropic's Claude Vision API to analyze meal photos and estimate nutritional content. The AI agent is responsible for:
1. Identifying food items in a photo
2. Estimating portion sizes
3. Calculating calories and macros for each item
4. Computing a total nutrition summary
5. Assigning a nutritional quality score (0-100)

## API Configuration

- **Model**: `claude-sonnet-4-20250514` (or latest Claude model with vision)
- **Max tokens**: 1024
- **Temperature**: 0.2 (low for consistent, factual outputs)
- **SDK**: `@anthropic-ai/sdk`

## System Prompt

```
Tu es un nutritionniste expert specialise dans l'analyse de photos de repas. Tu estimes avec precision les calories, macronutriments et le poids des aliments visibles sur la photo.

Regles:
1. Reponds UNIQUEMENT en JSON valide, sans texte avant ou apres.
2. Identifie chaque aliment visible separement dans "meal_items".
3. Estime le poids en grammes de chaque aliment en te basant sur la taille de l'assiette, des couverts, et les proportions visuelles.
4. Calcule les calories et macros (glucides, proteines, lipides) pour chaque aliment.
5. Le champ "name" doit etre un nom court et descriptif du repas complet en francais.
6. Le "score" est une note de 0 a 100 evaluant la qualite nutritionnelle globale du repas.
7. Si la photo ne montre pas de nourriture, reponds avec: {"error": "not_food"}
8. Utilise les valeurs nutritionnelles moyennes de la base CIQUAL (table de composition nutritionnelle des aliments francais) comme reference.
9. Arrondis les valeurs a une decimale maximum.
10. Privilegia les recettes et preparations francaises quand l'identification est ambigue.

Format de reponse attendu:
{
  "name": "string - nom du repas complet",
  "calories": number,
  "carbs_g": number,
  "protein_g": number,
  "fat_g": number,
  "weight_g": number | null,
  "score": number,
  "meal_items": [
    {
      "name": "string - nom de l'aliment",
      "calories": number,
      "carbs_g": number,
      "protein_g": number,
      "fat_g": number,
      "weight_g": number | null
    }
  ]
}
```

## User Message Template

```
Analyse cette photo de repas et estime les valeurs nutritionnelles.

{meal_type_hint ? `Type de repas: ${meal_type_hint}` : ""}

Reponds uniquement en JSON valide.
```

The image is sent as an `image` content block alongside the text message.

## Expected JSON Output Format

```typescript
type MealAnalysisResult = {
  name: string;              // Short descriptive name in French
  calories: number;          // Total calories (kcal), decimal
  carbs_g: number;           // Total carbohydrates (g), decimal
  protein_g: number;         // Total protein (g), decimal
  fat_g: number;             // Total fat (g), decimal
  weight_g: number | null;   // Total estimated weight (g), or null if uncertain
  score: number;             // 0-100 nutritional quality score
  meal_items: {
    name: string;            // Individual item name in French
    calories: number;
    carbs_g: number;
    protein_g: number;
    fat_g: number;
    weight_g: number | null;
  }[];
};
```

### Error Response (non-food image)

```json
{
  "error": "not_food"
}
```

## Zod Validation Schema

Apply this Zod schema to validate Claude's response:

```typescript
import { z } from 'zod';

const mealItemSchema = z.object({
  name: z.string().min(1),
  calories: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  weight_g: z.number().nonnegative().nullable(),
});

const mealAnalysisSchema = z.object({
  name: z.string().min(1),
  calories: z.number().nonnegative(),
  carbs_g: z.number().nonnegative(),
  protein_g: z.number().nonnegative(),
  fat_g: z.number().nonnegative(),
  weight_g: z.number().nonnegative().nullable(),
  score: z.number().int().min(0).max(100),
  meal_items: z.array(mealItemSchema).min(1),
});

const mealAnalysisErrorSchema = z.object({
  error: z.literal('not_food'),
});

const mealAnalysisResponseSchema = z.union([
  mealAnalysisSchema,
  mealAnalysisErrorSchema,
]);
```

## Score Calculation

The score (0-100) evaluates the overall nutritional quality of the meal. Claude computes this based on the following criteria:

### Scoring Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Macro balance | 30% | How well-distributed are carbs/protein/fat? Balanced meals score higher. |
| Protein content | 25% | Adequate protein relative to total calories. Target: 20-35% of calories. |
| Calorie density | 20% | Lower calorie density (cal per gram) is generally better. <1.5 cal/g is ideal. |
| Fiber & micronutrient indicators | 15% | Presence of vegetables, fruits, whole grains scores higher. |
| Processing level | 10% | Whole/unprocessed foods score higher than ultra-processed. |

### Score Ranges and Labels

| Score | Label (French) | Color |
|-------|----------------|-------|
| 80-100 | "Excellent !" | Green |
| 60-79 | "Tres bien" | Light green |
| 40-59 | "Bon" | Yellow |
| 20-39 | "Moyen" | Orange |
| 0-19 | "A ameliorer" | Red |

### Score Examples

- **Poulet grille + legumes vapeur + quinoa**: 85-95 (excellent balance, high protein, low processing)
- **Salade cesar avec poulet**: 65-75 (good protein, moderate fat from sauce)
- **Pizza margherita**: 40-50 (moderate balance, processed carbs)
- **Croissant au beurre**: 20-30 (high fat, low protein, refined carbs)
- **Frites avec ketchup**: 10-20 (high fat, high calorie density, low nutrients)

## Error Handling

### Non-food Images

If Claude determines the image does not contain food:
1. Claude returns `{"error": "not_food"}`
2. Server validates with `mealAnalysisErrorSchema`
3. API returns 422 with `{"error": "Impossible d'analyser cette image"}`

### Unclear or Ambiguous Photos

If the image is blurry or food is partially hidden:
- Claude should still attempt analysis with available information
- `weight_g` may be `null` if portion size is uncertain
- Score should be slightly lower to reflect uncertainty
- The `name` should include "environ" or approximate terms

### Claude API Failures

| Error | Handling |
|-------|----------|
| Rate limit (429) | Retry with exponential backoff (max 3 retries) |
| Timeout | Return 500 with "Erreur lors de l'analyse, veuillez reessayer" |
| Invalid response (not JSON) | Log the response, return 500 |
| Zod validation failure | Log the response, attempt to extract partial data, or return 500 |

## Portion Size Estimation Tips

These guidelines are embedded in the system prompt context to help Claude estimate portions:

1. **Standard plate**: Dinner plate is ~26cm diameter. Use as reference for food proportions.
2. **Hand reference**: A palm-sized portion of protein is ~100g. A fist-sized portion of carbs is ~150g cooked.
3. **Common French portions**:
   - Baguette slice: ~30g
   - Croissant: ~60g
   - Steak haché: ~125g
   - Portion de fromage: ~30g
   - Yaourt: ~125g
   - Verre de vin: ~150ml
4. **Rice/pasta**: A serving portion is typically 150-200g cooked.
5. **Salad**: Salad greens are light (~50-80g), but toppings add significant weight.

## Full API Call Example

### Implementation

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

async function analyzeMealPhoto(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
  mealType?: string
): Promise<MealAnalysisResult> {
  const userMessage = mealType
    ? `Analyse cette photo de repas et estime les valeurs nutritionnelles.\n\nType de repas: ${mealType}\n\nReponds uniquement en JSON valide.`
    : `Analyse cette photo de repas et estime les valeurs nutritionnelles.\n\nReponds uniquement en JSON valide.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    temperature: 0.2,
    system: SYSTEM_PROMPT, // The system prompt defined above
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const parsed = JSON.parse(text);
  const validated = mealAnalysisResponseSchema.parse(parsed);

  if ('error' in validated) {
    throw new NotFoodError();
  }

  return validated;
}
```

### Example Response

**Input**: Photo of a plate with grilled chicken, rice, and green salad

**Claude's raw output**:
```json
{
  "name": "Poulet grille avec riz basmati et salade verte",
  "calories": 520.5,
  "carbs_g": 45.2,
  "protein_g": 38.0,
  "fat_g": 15.3,
  "weight_g": 350,
  "score": 78,
  "meal_items": [
    {
      "name": "Poulet grille",
      "calories": 250.0,
      "carbs_g": 0.0,
      "protein_g": 35.0,
      "fat_g": 11.0,
      "weight_g": 150
    },
    {
      "name": "Riz basmati cuit",
      "calories": 210.0,
      "carbs_g": 43.0,
      "protein_g": 2.0,
      "fat_g": 1.5,
      "weight_g": 150
    },
    {
      "name": "Salade verte assaisonnee",
      "calories": 60.5,
      "carbs_g": 2.2,
      "protein_g": 1.0,
      "fat_g": 2.8,
      "weight_g": 50
    }
  ]
}
```
