import { AI_PROXY_URL, isAiConfigured } from "../config";
import { getAppUserId } from "./purchases";
import { getSpecies } from "../domain/species";
import { ageInMonths } from "../domain/insights";

/**
 * Client for the AI assistant.
 *
 * It talks to our own proxy, never to a model provider directly. The provider
 * key stays on the server, which also re-checks the caller's premium
 * entitlement — a client-side `isPremium` flag is a UI convenience, not a
 * security boundary, since anyone can patch the bundle.
 *
 * See server/ai-proxy/ for the endpoint this expects.
 */

export class AiCoachError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AiCoachError";
    this.code = code;
  }
}

/**
 * Builds the context the model gets.
 *
 * Deliberately excludes the profile name and any free-text notes: the model
 * needs the species, the age and the numbers to say something useful, and
 * nothing is gained by sending an identifiable name to a third party.
 */
export const buildCoachContext = (profile, insights) => {
  const species = getSpecies(profile?.species);
  const trend = insights?.trend;

  return {
    species: species.id,
    unit: species.unit,
    insightKind: species.insight,
    breed: profile?.breed || null,
    sex: profile?.sex || null,
    ageMonths: profile?.birth_date ? ageInMonths(profile.birth_date) : null,
    heightCm: profile?.height_cm ?? null,
    entryCount: trend?.count ?? 0,
    firstWeightKg: trend?.first?.weight ?? null,
    latestWeightKg: trend?.latest?.weight ?? null,
    changeKg: trend?.change ?? null,
    firstDate: trend?.first?.entry_date ?? null,
    latestDate: trend?.latest?.entry_date ?? null,
    bmi: insights?.bmi?.value ?? null,
    growthPercentile: insights?.growth?.percentile ?? null,
    idealWeightKg: insights?.idealWeight?.kg ?? null,
    targetWeightKg: insights?.target?.kg ?? null,
  };
};

/**
 * @param messages Chat history as [{ role: 'user'|'assistant', content }]
 * @returns {Promise<string>} the assistant's reply
 */
export const askCoach = async ({ profile, insights, messages, locale }) => {
  if (!isAiConfigured()) {
    throw new AiCoachError(
      "not_configured",
      "AI proxy URL is not set. See server/ai-proxy/README.md."
    );
  }

  const appUserId = await getAppUserId();

  let response;
  try {
    response = await fetch(`${AI_PROXY_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(appUserId ? { "X-App-User-Id": appUserId } : {}),
      },
      body: JSON.stringify({
        locale,
        context: buildCoachContext(profile, insights),
        messages,
      }),
    });
  } catch (error) {
    throw new AiCoachError("network", error.message);
  }

  if (response.status === 402 || response.status === 403) {
    throw new AiCoachError("not_entitled", "Premium subscription required.");
  }
  if (response.status === 429) {
    throw new AiCoachError("rate_limited", "Too many requests. Try again soon.");
  }
  if (!response.ok) {
    throw new AiCoachError("server", `Assistant unavailable (${response.status}).`);
  }

  const payload = await response.json();
  if (!payload?.reply) {
    throw new AiCoachError("server", "Empty response from the assistant.");
  }
  return payload.reply;
};
