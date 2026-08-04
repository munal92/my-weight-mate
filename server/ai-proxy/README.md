# AI assistant proxy

A single Cloudflare Worker that sits between the app and OpenAI.

## Why this exists

The OpenAI key cannot live in the app. Everything bundled into a React Native
build — including values loaded from `.env` at build time — ends up as plain
strings inside the `.ipa`/`.aab` and can be extracted with `unzip` and `strings`.
A leaked key is charged to your account until you notice and rotate it.

The Worker also enforces the paywall. `useEntitlements().isPremium` in the app
decides what to *show*; it cannot decide what to *allow*, because a patched
build can set it to `true`. The Worker asks RevenueCat directly on every call.

## Setup

```bash
npm install -g wrangler
wrangler login
cd server/ai-proxy
wrangler deploy
```

Then set the secrets (these never appear in source or in the app):

```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put REVENUECAT_SECRET_KEY   # RevenueCat dashboard > API keys > Secret
```

Create the KV namespace used for rate limiting and bind it as `RATE_LIMIT_KV`:

```bash
wrangler kv namespace create RATE_LIMIT_KV
# copy the returned id into wrangler.toml
```

Finally point the app at the deployed URL, in `.env`:

```
EXPO_PUBLIC_AI_PROXY_URL=https://ai-proxy.<your-subdomain>.workers.dev
```

## Configuration

| Variable                  | Kind   | Default       | Purpose                              |
| ------------------------- | ------ | ------------- | ------------------------------------ |
| `OPENAI_API_KEY`          | secret | —             | Provider key. Required.              |
| `REVENUECAT_SECRET_KEY`   | secret | —             | Verifies the premium entitlement.    |
| `PREMIUM_ENTITLEMENT_ID`  | var    | `premium`     | Must match the RevenueCat dashboard. |
| `OPENAI_MODEL`            | var    | `gpt-4o-mini` | Model to call.                       |
| `RATE_LIMIT_KV`           | KV     | —             | Per-user request counter.            |

## Behaviour

`POST /chat`

```jsonc
// request
{
  "locale": "tr",
  "context": { "species": "cat", "latestWeightKg": 4.8, "...": "..." },
  "messages": [{ "role": "user", "content": "Is this a healthy weight?" }]
}
```

```jsonc
// response
{ "reply": "..." }
```

Status codes the app handles: `402`/`403` no active entitlement, `429` rate
limited, `502` provider failure.

Notes on what is sent:

- The profile **name is never sent**. The model gets species, age, sex, breed
  and the numbers — enough to be useful, nothing identifying.
- The system prompt is built here, not in the app, so the client cannot
  overwrite the safety instructions.
- Message history is capped at 20 messages and 1000 characters each, so a
  modified client cannot run up the bill.

## Swapping providers

The app talks to this Worker, not to a provider, so changing model vendor is a
change to one `fetch` call in `worker.js` — the app does not need a new build.
