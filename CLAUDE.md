# CLAUDE.md

Notes for whoever picks this up next. Read this before touching anything.

## What this app is

Weight tracking for a whole household — adults, babies, cats, dogs — in one
offline-first Expo app. The bet is a positioning one: human family trackers
exist and pet trackers exist, but almost nothing does both in one app. That
overlap is the product.

The value is not the CRUD. It is what the app does with the numbers **per
species**: BMI for an adult, WHO growth percentile for an infant, body
condition score for an animal. If you find yourself building generic weight
features, you are building the commodity part.

## FIRST: check whether the work is actually on GitHub

As of the last session the branch `claude/proje-degerlendirmesi-lnriay` had two
commits that **could not be pushed** — that session's token was read-only
(`403` on the git proxy, `403 Resource not accessible by integration` on the
GitHub API) and the repo owner's plan does not expose the setting to change it.

The commits were handed to the user as a `git bundle`. So:

```bash
git log --oneline main..claude/proje-degerlendirmesi-lnriay
```

- **Two commits show up** → the bundle was applied. Good, carry on.
- **Nothing shows up** → the work is only in the user's downloaded bundle file.
  Do not redo it. Ask the user to run:
  ```bash
  git fetch <path-to>/my-weight-mate-sdk57*.bundle \
      claude/proje-degerlendirmesi-lnriay:claude/proje-degerlendirmesi-lnriay
  ```

If you also cannot push, do not fight it and do not retry a policy `403` — hand
the user a fresh bundle instead (`git bundle create out.bundle main..HEAD`).

## Layout

```
domain/       Pure logic. No React, no DB. Species registry, BMI, percentiles.
db/           SQLite connection, versioned migrations, repositories.
state/        ProfilesContext (who exists / who is selected), EntitlementsContext.
services/     RevenueCat wrapper, AI assistant client.
screens/      Home, Profiles, ProfileDetail, ProfileEdit, Settings.
components/   Grouped by owning screen; plus ai/ and paywall/.
server/       Cloudflare Worker proxying the AI provider. Not part of the app build.
config/       Build-time config and the free-tier limits.
```

## Rules that matter

**Weights are always stored in kilograms**, for every species. Units are a
display concern handled by `domain/species.js` (`toKg` / `fromKg` /
`formatWeight`). A gram-based species like a hamster still writes kg to SQLite.
Do not "fix" this by storing display units.

**Migrations are append-only.** `MIGRATIONS` in `db/database.js` is indexed by
`PRAGMA user_version`. Add an entry; never edit one that has shipped. Migration
1 is written with `IF NOT EXISTS` because installs predating versioning sit at
version 0 with the tables already present.

**Adding an animal is one entry** in `domain/species.js` plus the label in the
three `locales/*.json`. The profile form, unit handling, validation ranges and
charts all derive from the registry. If you are hardcoding a species name
anywhere else, that is a bug.

**i18n keys are English sentences.** `keySeparator` and `nsSeparator` are
disabled in `i18n.js` because those sentences contain `.` and `:`. If you
re-enable them, every key with punctuation silently stops resolving.

**Client-side `isPremium` is UI only.** Anyone can patch a bundle. The AI proxy
re-verifies the entitlement against RevenueCat on every call. Never make the
server trust a flag from the client.

**No provider secrets in the app.** `EXPO_PUBLIC_*` values are inlined into the
JS bundle and extractable from the `.ipa`/`.aab`. RevenueCat SDK keys are public
by design and fine. The OpenAI key lives only in the Worker.

## Deliberately incomplete — do not "fix" by guessing

**`domain/data/whoWeightForAge.js` is empty on purpose.** The LMS z-score maths
in `domain/insights.js` is finished and tested, but the WHO L/M/S reference
values are medical data. They were not fetched because this environment's egress
policy blocks `who.int` and its CDN, and they were not approximated because a
wrong percentile shown to a parent is worse than no percentile. Consumers already
handle the empty table by hiding the feature. Instructions for populating it are
in that file. **This is the highest-value next task** — market research shows 57%
of baby tracking apps already have percentile charts, so it is table stakes for
that segment, not a differentiator.

**There is no per-breed ideal weight table for pets, on purpose.** Within one
species breed variation is far too wide (a 1 kg dwarf rabbit vs a 6 kg Flemish
giant) for a table shipped in an app to be trustworthy. The app uses the method
vets actually use: the 9-point Body Condition Score, where 5 is ideal and each
point above is roughly 10% over ideal weight (`idealWeightFromBcs`). The user's
own target weight always wins.

**The `password` column on `profiles` is dead.** It held plaintext and was never
checked. Nothing reads or writes it; the column is kept only so existing rows
are not destroyed. A profile lock should be rebuilt on `expo-local-authentication`.

## Next steps, in priority order

1. **Populate the WHO table.** See above.
2. **RevenueCat dashboard**: define products and the `premium` entitlement, then
   fill `.env` from `.env.example`. Free until $2,500 monthly tracked revenue.
3. **Deploy the AI proxy**: `server/ai-proxy/README.md`.
4. **Pricing**: recommendation is ~$9.99/year as the headline offer plus a
   ~$19.99 lifetime. The user asked for humble pricing; the research caveat is
   that a $1.99/month app needs 5x the subscribers of a $9.99 one, so do not go
   lower than this without a reason.
5. Then: reminders/notifications, CSV export, photo attachments on entries.

## Verifying changes

There is no test runner wired up. Two checks that do work:

```bash
npm run check:domain     # runs the pure-logic assertions in scripts/
npx expo export --platform android --output-dir /tmp/export-check
```

The export is the real smoke test — it type-free-compiles every module through
Metro and catches missing imports, bad paths and syntax errors that nothing else
will. Run it before claiming anything works.

## Environment gotchas

- **Node 20+** required for SDK 57.
- **Expo Go cannot run RevenueCat.** The SDK falls back to a mocked Preview API
  mode so the app still loads, but purchases do nothing. Use
  `npx expo run:android` / `run:ios` for a development build.
- **`npx expo install --fix` may fail here.** It calls `api.expo.dev`, which some
  sandboxes block. The version map ships inside the package — read
  `node_modules/expo/bundledNativeModules.json` and align `package.json` by hand.
- After changing SDK or native deps, `rm -rf node_modules` before reinstalling.

## History worth knowing

The app used to boot into a bare debug CRUD screen: `App.js` returned
`<Profile />` before reaching the navigator, so every designed screen was
unreachable dead code. Under that, the UI and data layers had never been
connected — screens ran on hardcoded mock arrays while working SQLite helpers
sat unused, and `Home` was entirely inert (picker held three string literals,
"Add Weight" had no handler at all). All of that is fixed. If something looks
oddly disconnected, it is probably a leftover from that era rather than a design
decision.
