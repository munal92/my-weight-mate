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

## Where the work lives

Everything is on GitHub on the branch `claude/proje-degerlendirmesi-lnriay`,
which is open as PR #6 against `main` and not yet merged. An earlier session
could not push (read-only token) and handed the commits over as a `git bundle`;
that bundle has since been applied and deleted, so GitHub is the only source of
truth now. Pushing works from the user's machine with their own credentials.

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

**Birth dates go through `parseBirthDate`, never `new Date(string)` or
`Date.parse`.** A `YYYY-MM-DD` string parses as midnight *UTC*, which is the
previous day everywhere west of UTC — the app's primary market. That cost a US
baby a whole month of age whenever a weight was logged near a month's end, and
with month-indexed WHO rows a wrong month is a wrong percentile. It was invisible
in `UTC+3`, so a Turkey-side test would never have caught it. `parseBirthDate`
in `domain/insights.js` reads the components as a local calendar date and
rejects impossible dates; the profile form validates with the same function so
nothing can be saved that the insight then silently refuses to read.

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

**`domain/data/whoWeightForAge.js` holds real WHO reference data — never edit a
row by hand.** It carries the official weight-for-age L/M/S parameters for both
sexes, months 0 to 60, so the percentile feature is live. The rows are guarded:
`scripts/fixtures/whoWeightForAgeReference.mjs` holds WHO's own published
−2SD/median/+2SD weights, and `npm run check:domain` recomputes those weights
from L/M/S and fails if any row is off by more than 0.05 kg (the rounding of the
published values). A mistyped or invented row cannot ship quietly. If the table
ever needs replacing, regenerate both files together from the official source —
approximating a value here would show a parent a confidently wrong percentile.

Past 60 months the standard stops and `calculateGrowthPercentile` returns null;
covering older children means adding BMI-for-age, which is a different standard.

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

1. **RevenueCat dashboard**: define products and the `premium` entitlement, then
   fill `.env` from `.env.example`. Free until $2,500 monthly tracked revenue.
2. **Deploy the AI proxy**: `server/ai-proxy/README.md`.
3. **Pricing**: recommendation is ~$9.99/year as the headline offer plus a
   ~$19.99 lifetime. The user asked for humble pricing; the research caveat is
   that a $1.99/month app needs 5x the subscribers of a $9.99 one, so do not go
   lower than this without a reason.
4. Then: reminders/notifications, CSV export, photo attachments on entries.

Both 1 and 2 need accounts only the user can sign into, so they cannot be done
from a session — bring them up rather than working around them.

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
