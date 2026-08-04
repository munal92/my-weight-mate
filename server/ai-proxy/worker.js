/**
 * AI assistant proxy (Cloudflare Worker).
 *
 * Exists for one reason: the model provider's API key must never be in the
 * mobile bundle. Anything shipped in the app — including values the app treats
 * as private — can be extracted from the .ipa/.aab in minutes, and a leaked key
 * is billed to you until you notice.
 *
 * This Worker:
 *   1. verifies the caller actually holds the premium entitlement, by asking
 *      RevenueCat rather than trusting a flag from the client,
 *   2. rate limits per app user,
 *   3. builds the prompt server-side so the client cannot rewrite the system
 *      instructions,
 *   4. calls the provider with a key that only exists here.
 *
 * Deploy: see README.md in this directory.
 */

const RATE_LIMIT = { requests: 30, windowSeconds: 3600 };
const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 1000;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

/* -------------------------------------------------------------------------- */
/* Entitlement check                                                          */
/* -------------------------------------------------------------------------- */

async function hasActiveEntitlement(appUserId, env) {
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}` } }
  );

  if (!response.ok) return false;

  const data = await response.json();
  const entitlement =
    data?.subscriber?.entitlements?.[env.PREMIUM_ENTITLEMENT_ID || "premium"];
  if (!entitlement) return false;

  // A null expiry means a lifetime/non-expiring purchase.
  if (!entitlement.expires_date) return true;
  return new Date(entitlement.expires_date).getTime() > Date.now();
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

async function checkRateLimit(appUserId, env) {
  if (!env.RATE_LIMIT_KV) return true; // KV not bound: fail open, but log-worthy.

  const key = `rl:${appUserId}`;
  const current = Number((await env.RATE_LIMIT_KV.get(key)) ?? 0);
  if (current >= RATE_LIMIT.requests) return false;

  await env.RATE_LIMIT_KV.put(key, String(current + 1), {
    expirationTtl: RATE_LIMIT.windowSeconds,
  });
  return true;
}

/* -------------------------------------------------------------------------- */
/* Prompt                                                                     */
/* -------------------------------------------------------------------------- */

const SPECIES_GUIDANCE = {
  bmi:
    "This is an adult human. You may explain BMI and general healthy-weight " +
    "guidance, and comment on the direction and pace of the trend.",
  percentile:
    "This is an infant or child. Growth percentiles describe where the child " +
    "sits against WHO growth standards; a percentile is not a grade, and a " +
    "consistent curve matters more than any single value. Be reassuring but " +
    "direct about when a paediatrician should be consulted.",
  bcs:
    "This is an animal. Ideal weight varies enormously by breed and frame, so " +
    "prefer body condition score (1-9 scale, 5 is ideal) over any absolute " +
    "number, and recommend a vet for a real assessment.",
};

function buildSystemPrompt(context, locale) {
  return [
    "You are the in-app assistant for a weight tracking app that handles " +
      "adults, babies, children and pets.",
    SPECIES_GUIDANCE[context.insightKind] ??
      "Give general weight-tracking guidance.",
    "",
    "Rules:",
    "- Answer in the user's language. Locale: " + (locale || "en") + ".",
    "- Be concrete and brief: at most about 150 words, no headings.",
    "- Base your answer on the numbers provided. Do not invent measurements.",
    "- If the data is too thin to say anything meaningful, say so plainly.",
    "- You are not a doctor or a vet. For anything clinical — sudden weight " +
      "loss, a baby crossing percentile lines, a sick animal — say clearly " +
      "that a professional should be seen.",
    "- Never diagnose, and never suggest medication or a specific diet plan " +
      "for a baby or an animal.",
    "",
    "Data for this profile (weights in kilograms):",
    JSON.stringify(context),
  ].join("\n");
}

/* -------------------------------------------------------------------------- */
/* Handler                                                                    */
/* -------------------------------------------------------------------------- */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method !== "POST" || url.pathname !== "/chat") {
      return json({ error: "Not found" }, 404);
    }

    if (!env.OPENAI_API_KEY) {
      return json({ error: "Server is not configured" }, 500);
    }

    const appUserId = request.headers.get("X-App-User-Id");
    if (!appUserId) {
      return json({ error: "Missing app user id" }, 403);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const { context, messages, locale } = body ?? {};
    if (!context || !Array.isArray(messages) || messages.length === 0) {
      return json({ error: "Invalid request" }, 400);
    }

    // Bound the payload so a malicious client cannot run up the token bill.
    const trimmedMessages = messages
      .slice(-MAX_MESSAGES)
      .filter((m) => m && (m.role === "user" || m.role === "assistant"))
      .map((m) => ({
        role: m.role,
        content: String(m.content ?? "").slice(0, MAX_MESSAGE_CHARS),
      }));

    if (trimmedMessages.length === 0) {
      return json({ error: "Invalid request" }, 400);
    }

    if (!(await hasActiveEntitlement(appUserId, env))) {
      return json({ error: "Premium subscription required" }, 402);
    }

    if (!(await checkRateLimit(appUserId, env))) {
      return json({ error: "Rate limit exceeded" }, 429);
    }

    const providerResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          max_tokens: 400,
          temperature: 0.4,
          messages: [
            { role: "system", content: buildSystemPrompt(context, locale) },
            ...trimmedMessages,
          ],
        }),
      }
    );

    if (!providerResponse.ok) {
      // Do not forward the provider's error body; it can contain account
      // details that have no business reaching the client.
      return json({ error: "Assistant unavailable" }, 502);
    }

    const data = await providerResponse.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) return json({ error: "Empty response" }, 502);
    return json({ reply });
  },
};
