# my-weight-mate

Weight tracking for everyone in the household — you, your baby, your cat, your
dog — in one offline-first app.

Most weight trackers assume the phone's owner is the only subject. This one is
built around multiple profiles of different **species**, and what it does with
the numbers depends on who they belong to: BMI for an adult, growth percentiles
for an infant, body-condition-based ideal weight for an animal.

## Stack

Expo SDK 57 (React Native 0.86, React 19.2) · expo-sqlite · react-navigation 7 ·
react-native-chart-kit · i18next (en / tr / es) · RevenueCat.

## Running it

```bash
npm install
cp .env.example .env      # optional; the app runs without any of it
npm start
```

Everything works with an empty `.env`: purchases report "not configured" and the
assistant is unavailable, but profiles, weights, charts and insights are fully
functional. All data is local — there is no account and no server.

RevenueCat needs native code, so use a development build rather than Expo Go for
anything purchase-related (`npx expo run:android` / `run:ios`).

## Layout

```
domain/       Pure logic: species registry, BMI, percentiles, trends. No React.
db/           SQLite connection, versioned migrations, repositories.
state/        Profiles and entitlements contexts.
services/     RevenueCat wrapper, AI assistant client.
screens/      Home, Profiles, ProfileDetail, ProfileEdit, Settings.
components/   UI, grouped by the screen that owns them.
server/       The AI proxy that keeps the model provider key off the device.
config/       Build-time configuration and free-tier limits.
```

## Adding an animal

One entry in `domain/species.js`:

```js
{
  id: "chinchilla",
  group: GROUP.PET,
  labelKey: "species.chinchilla",
  unit: UNIT.G,
  decimals: 0,
  plausible: { min: 200, max: 1200 },
  insight: INSIGHT.BCS,
  defaultAvatar: "avatar_5",
}
```

Then add `species.chinchilla` to the three files in `locales/`. The profile
form, the unit handling, the validation ranges and the charts all follow from
the registry — nothing else hardcodes a species.

## Free vs premium

The free tier is defined in one place, `config/index.js`:

| | Free | Premium |
| --- | --- | --- |
| Profiles | 2 | unlimited |
| Chart ranges | week, month | + 3 months, year |
| Percentiles / ideal weight | — | yes |
| AI assistant | — | yes |

`useEntitlements()` decides what the UI *shows*. It cannot decide what the
server *allows* — anyone can patch a client build — so the AI proxy verifies the
entitlement against RevenueCat on every call.

## Growth percentiles

`domain/insights.js` implements the WHO LMS z-score transform, but
`domain/data/whoWeightForAge.js` ships **empty on purpose**: those are medical
reference values and approximating them would put a wrong percentile in front of
a parent. Until the official WHO table is pasted in, the percentile block simply
does not render. Instructions are in that file.

## Things worth knowing

- Weights are stored in kilograms for every species. Units are a display
  concern, handled by the species registry.
- Schema changes go in the `MIGRATIONS` array in `db/database.js` as a new
  entry. Never edit one that has shipped.
- The `password` column on `profiles` is dead. It held plaintext and was never
  checked; a profile lock should be rebuilt on device authentication.
