import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic();

/**
 * The model the app uses by default.
 *
 * Use a rolling alias (e.g. `claude-sonnet-4-6`), NOT a dated snapshot like
 * `claude-sonnet-4-20250514` — dated snapshots get retired on a fixed date and
 * suddenly start returning 404, which breaks meal analysis until someone bumps
 * this string. Aliases roll forward automatically.
 *
 * Want to spend less? Set ANTHROPIC_MEAL_MODEL to "claude-haiku-4-5" (cheapest
 * model that still reads photos), or change the default below. Haiku trades some
 * macro-estimation accuracy for cost.
 */
const PRIMARY_MODEL = process.env.ANTHROPIC_MEAL_MODEL || "claude-sonnet-4-6";

/**
 * Cheap, vision-capable models to fall back to, in order of preference, if the
 * primary model ever becomes unavailable. Kept curated (rather than purely
 * automatic) so the photo path always lands on a model that can read images.
 */
const FALLBACK_PREFERENCE = ["claude-sonnet-4-6", "claude-haiku-4-5"];

// Once we discover the configured model is gone and pick a replacement, we
// remember it for the lifetime of the process so we don't re-list every call.
let overrideModel: string | null = null;

/** The model id the app should currently use. */
export function getModel(): string {
  return overrideModel ?? PRIMARY_MODEL;
}

function isModelUnavailable(err: unknown): boolean {
  // A retired/unknown model id returns 404 not_found_error.
  return (
    err instanceof Anthropic.NotFoundError ||
    (typeof err === "object" && err !== null && (err as { status?: number }).status === 404)
  );
}

/**
 * Ask the API which models actually exist right now and choose the cheapest
 * suitable replacement for a model that just failed.
 */
async function pickAvailableModel(broken: string, requireVision: boolean): Promise<string | null> {
  const models: { id: string; vision: boolean | undefined }[] = [];
  try {
    for await (const m of anthropic.models.list()) {
      // `capabilities` isn't in the SDK's static types on every version, so read it loosely.
      const supported = (m as { capabilities?: { image_input?: { supported?: boolean } } })
        .capabilities?.image_input?.supported;
      models.push({ id: m.id, vision: typeof supported === "boolean" ? supported : undefined });
    }
  } catch {
    // Can't even list models — give up and let the original error surface.
    return null;
  }

  // `vision === undefined` means the API didn't report the capability; allow it
  // (our curated fallbacks are all vision-capable) rather than wrongly excluding it.
  const usable = (id: string): boolean => {
    if (!requireVision) return true;
    return models.find((m) => m.id === id)?.vision !== false;
  };

  const ids = new Set(models.map((m) => m.id));
  const fromPreference = FALLBACK_PREFERENCE.find(
    (id) => id !== broken && ids.has(id) && usable(id)
  );
  if (fromPreference) return fromPreference;

  // Last resort: any available Claude model, cheapest tier first.
  const tier = (id: string): number =>
    id.includes("haiku") ? 0 : id.includes("sonnet") ? 1 : id.includes("opus") ? 2 : 3;
  return (
    models
      .map((m) => m.id)
      .filter((id) => id.startsWith("claude-") && id !== broken && usable(id))
      .sort((a, b) => tier(a) - tier(b))[0] ?? null
  );
}

/**
 * Drop-in replacement for `anthropic.messages.create` that auto-recovers when
 * the configured model is unavailable: it lists the available models, picks the
 * cheapest suitable one, remembers it, and retries once.
 *
 * Pass `{ requireVision: true }` for calls that send images (meal photos) so the
 * fallback only ever lands on a model that can actually read them.
 */
export async function createMessage(
  params: Omit<Anthropic.MessageCreateParams, "model" | "stream">,
  opts: { requireVision?: boolean } = {}
): Promise<Anthropic.Message> {
  const model = getModel();
  try {
    return (await anthropic.messages.create({ ...params, model })) as Anthropic.Message;
  } catch (err) {
    if (isModelUnavailable(err)) {
      const fallback = await pickAvailableModel(model, opts.requireVision ?? false);
      if (fallback && fallback !== model) {
        overrideModel = fallback;
        return (await anthropic.messages.create({ ...params, model: fallback })) as Anthropic.Message;
      }
    }
    throw err;
  }
}
