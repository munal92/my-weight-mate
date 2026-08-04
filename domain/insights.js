/**
 * Turns a series of weight entries into something worth reading.
 *
 * Everything here is pure: no database, no React, no i18n. Callers pass data
 * in and get a plain object out, which keeps this testable and lets the AI
 * assistant reuse the exact same numbers the UI is showing.
 */

import { INSIGHT, formatWeight, getSpecies } from "./species";
import { hasGrowthData, lookupLms } from "./data/whoWeightForAge";

/* -------------------------------------------------------------------------- */
/* Trend                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * @param entries Weight rows sorted oldest-first, each { weight, entry_date }.
 *                `weight` is always kilograms.
 */
export const summarize = (entries) => {
  if (!entries || entries.length === 0) {
    return { count: 0, first: null, latest: null, previous: null, change: null };
  }

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const previous = entries.length > 1 ? entries[entries.length - 2] : null;

  return {
    count: entries.length,
    first,
    latest,
    previous,
    change: latest.weight - first.weight,
    changeSincePrevious: previous ? latest.weight - previous.weight : null,
  };
};

/* -------------------------------------------------------------------------- */
/* Adult BMI                                                                  */
/* -------------------------------------------------------------------------- */

/** WHO adult BMI cut-offs. Only meaningful for adults, never for children. */
const BMI_BANDS = [
  { max: 18.5, key: "bmi.underweight" },
  { max: 25, key: "bmi.normal" },
  { max: 30, key: "bmi.overweight" },
  { max: Infinity, key: "bmi.obese" },
];

export const calculateBmi = (weightKg, heightCm) => {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) return null;

  const band = BMI_BANDS.find((b) => bmi < b.max);
  return { value: Number(bmi.toFixed(1)), categoryKey: band.key };
};

/* -------------------------------------------------------------------------- */
/* Growth percentile (infants and children)                                   */
/* -------------------------------------------------------------------------- */

/**
 * Cumulative standard normal distribution.
 * Abramowitz & Stegun 26.2.17, accurate to ~7.5e-8 — far tighter than the one
 * decimal place a percentile is ever displayed at.
 */
const normalCdf = (z) => {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;

  const t = 1 / (1 + 0.3275911 * x);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-x * x);

  return 0.5 * (1 + sign * y);
};

/**
 * Parses a stored birth date as a LOCAL calendar date.
 *
 * `new Date("2026-01-01")` is midnight UTC, which in any negative-offset zone is
 * the previous day locally — so a US user's baby born on the 1st reads as born
 * on the 31st, and the month arithmetic below silently loses a month. A birth
 * date is a calendar date, not an instant, so the components are read directly.
 * Accepts a leading YYYY-MM-DD and ignores any time part.
 *
 * Exported so the profile form validates exactly what this can read. `Date.parse`
 * is deliberately not used anywhere for this: it accepts `01/15/2026` and
 * `2026-02-31`, which would save fine and then show no percentile at all.
 */
export const parseBirthDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  // Rejects impossible dates like 2026-02-31, which would otherwise roll over.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
};

export const ageInMonths = (birthDate, at = new Date()) => {
  if (!birthDate) return null;
  const born = parseBirthDate(birthDate);
  if (!born) return null;

  const months =
    (at.getFullYear() - born.getFullYear()) * 12 +
    (at.getMonth() - born.getMonth());
  // Partial month: subtract one if we have not reached the day-of-month yet.
  return at.getDate() < born.getDate() ? months - 1 : months;
};

/**
 * Weight-for-age percentile against the WHO growth standards.
 * Returns null whenever we cannot answer honestly - missing reference table,
 * missing birth date or sex, or an age outside the standards' range.
 */
export const calculateGrowthPercentile = (weightKg, birthDate, sex, at) => {
  if (!hasGrowthData() || !weightKg) return null;

  const months = ageInMonths(birthDate, at);
  if (months == null || months < 0) return null;

  const lms = lookupLms(sex, months);
  if (!lms) return null;

  const { L, M, S } = lms;
  const z =
    L === 0
      ? Math.log(weightKg / M) / S
      : (Math.pow(weightKg / M, L) - 1) / (L * S);

  if (!Number.isFinite(z)) return null;

  return {
    zScore: Number(z.toFixed(2)),
    percentile: Number((normalCdf(z) * 100).toFixed(1)),
    ageMonths: months,
  };
};

/* -------------------------------------------------------------------------- */
/* Pet body condition                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Estimates ideal weight from a Body Condition Score on the standard 9-point
 * veterinary scale, where 5 is ideal and each point above it corresponds to
 * roughly 10% over ideal weight.
 *
 * This is the rule of thumb vets use for a first estimate, and it is used here
 * instead of a built-in breed table on purpose: within a single species breed
 * variation is far too wide for any table shipped in an app to be trusted. The
 * user's own target weight always wins when they have set one.
 */
export const idealWeightFromBcs = (currentKg, bcs) => {
  if (!currentKg || !bcs) return null;
  if (bcs < 1 || bcs > 9) return null;

  const overFactor = 1 + 0.1 * (bcs - 5);
  if (overFactor <= 0) return null;

  return Number((currentKg / overFactor).toFixed(3));
};

export const BCS_IDEAL = 5;
export const BCS_SCALE_MAX = 9;

/* -------------------------------------------------------------------------- */
/* Facade                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Builds the full insight payload for a profile. The UI renders whatever comes
 * back and skips anything that is null, so a profile missing height or a birth
 * date simply shows less rather than showing something wrong.
 *
 * @param profile Profile row (species, height_cm, birth_date, sex, target_weight)
 * @param entries Weight rows sorted oldest-first, weights in kilograms
 */
export const buildInsights = (profile, entries) => {
  const species = getSpecies(profile?.species);
  const trend = summarize(entries);
  const latestKg = trend.latest?.weight ?? null;

  const result = {
    speciesId: species.id,
    trend,
    latestFormatted: formatWeight(latestKg, species.id),
    bmi: null,
    growth: null,
    idealWeight: null,
    target: null,
  };

  if (latestKg == null) return result;

  if (species.insight === INSIGHT.BMI) {
    result.bmi = calculateBmi(latestKg, profile.height_cm);
  }

  if (species.insight === INSIGHT.PERCENTILE) {
    result.growth = calculateGrowthPercentile(
      latestKg,
      profile.birth_date,
      profile.sex
    );
  }

  if (species.insight === INSIGHT.BCS) {
    const estimated = idealWeightFromBcs(latestKg, trend.latest?.bcs);
    if (estimated != null) {
      result.idealWeight = {
        kg: estimated,
        formatted: formatWeight(estimated, species.id),
        source: "bcs",
      };
    }
  }

  if (profile.target_weight) {
    result.target = {
      kg: profile.target_weight,
      formatted: formatWeight(profile.target_weight, species.id),
      remaining: Number((latestKg - profile.target_weight).toFixed(3)),
    };
  }

  return result;
};
