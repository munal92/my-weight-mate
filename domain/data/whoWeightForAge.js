/**
 * WHO Child Growth Standards - weight-for-age LMS parameters.
 *
 * ---------------------------------------------------------------------------
 * THIS TABLE IS INTENTIONALLY EMPTY.
 * ---------------------------------------------------------------------------
 *
 * The percentile maths in domain/insights.js is complete and correct, but it
 * needs the official WHO L/M/S parameters to produce a number. Those values are
 * medical reference data: approximating or eyeballing them would put a wrong
 * percentile in front of a parent, so the app shows no percentile at all until
 * the real table is dropped in here.
 *
 * Every consumer already handles an empty table by hiding the percentile
 * feature, so the app runs fine in this state.
 *
 * HOW TO POPULATE
 *
 * 1. Download the official weight-for-age tables from
 *    https://www.who.int/tools/child-growth-standards/standards/weight-for-age
 *    Take the "expanded tables" (month-based is enough for this app):
 *      - wfa_boys_0-to-5-years_zscores  (or the LMS variant)
 *      - wfa_girls_0-to-5-years_zscores
 *
 * 2. Each row gives Month, L, M, S. Copy them in as [month, L, M, S] tuples,
 *    month 0 through 60, into BOYS and GIRLS below.
 *
 * 3. Run `npm test` if a test harness exists, or sanity-check a known value:
 *    a 0-month-old boy at the median should come out at the 50th percentile.
 *
 * The z-score formula these parameters feed (WHO Technical Report, the standard
 * Box-Cox / LMS transform) is:
 *
 *      Z = ((X / M)^L - 1) / (L * S)          when L != 0
 *      Z = ln(X / M) / S                      when L == 0
 *
 * where X is the measured weight in kilograms.
 */

/** @type {Array<[number, number, number, number]>} [ageMonths, L, M, S] */
export const BOYS = [];

/** @type {Array<[number, number, number, number]>} [ageMonths, L, M, S] */
export const GIRLS = [];

export const hasGrowthData = () => BOYS.length > 0 && GIRLS.length > 0;

/**
 * Nearest-month lookup. Returns null when the table is unpopulated or the age
 * falls outside the range the table covers.
 */
export const lookupLms = (sex, ageMonths) => {
  const table = sex === "female" ? GIRLS : BOYS;
  if (table.length === 0) return null;
  if (ageMonths < table[0][0] || ageMonths > table[table.length - 1][0]) {
    return null;
  }

  let closest = table[0];
  let smallestGap = Math.abs(table[0][0] - ageMonths);
  for (const row of table) {
    const gap = Math.abs(row[0] - ageMonths);
    if (gap < smallestGap) {
      smallestGap = gap;
      closest = row;
    }
  }

  const [, L, M, S] = closest;
  return { L, M, S };
};
