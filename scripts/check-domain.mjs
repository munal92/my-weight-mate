/**
 * Assertions over the pure domain logic.
 *
 * Run with: npm run check:domain
 *
 * There is no test runner in this project, and the domain modules cannot be
 * imported by Node directly: they use ESM syntax but live in a package without
 * "type": "module", so Node parses them as CommonJS and throws. Rather than
 * pulling in a whole toolchain for a handful of pure functions, this script
 * copies the three relevant modules to a temp directory as .mjs, rewrites their
 * relative imports to match, and imports the copies.
 *
 * Only add things here that are genuinely pure. Anything touching SQLite,
 * React or expo-* belongs in a real test setup.
 */

import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  BOYS_REFERENCE,
  GIRLS_REFERENCE,
  TOLERANCE_KG,
} from "./fixtures/whoWeightForAgeReference.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Relative specifiers have to gain the .mjs extension the copies use. */
const REWRITES = [
  [/"\.\/species"/g, '"./species.mjs"'],
  [/"\.\/data\/whoWeightForAge"/g, '"./data/whoWeightForAge.mjs"'],
];

const stage = async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "domain-check-"));
  await mkdir(path.join(dir, "data"), { recursive: true });

  const files = [
    ["domain/species.js", "species.mjs"],
    ["domain/insights.js", "insights.mjs"],
    ["domain/data/whoWeightForAge.js", "data/whoWeightForAge.mjs"],
  ];

  for (const [source, target] of files) {
    let code = await readFile(path.join(projectRoot, source), "utf8");
    for (const [pattern, replacement] of REWRITES) {
      code = code.replace(pattern, replacement);
    }
    await writeFile(path.join(dir, target), code);
  }

  return dir;
};

let passed = 0;
const failures = [];

const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message.split("\n")[0]}`);
  }
};

const dir = await stage();

try {
  const species = await import(pathToFileURL(path.join(dir, "species.mjs")).href);
  const insights = await import(pathToFileURL(path.join(dir, "insights.mjs")).href);
  const who = await import(
    pathToFileURL(path.join(dir, "data/whoWeightForAge.mjs")).href
  );

  const { BOYS, GIRLS, hasGrowthData, lookupLms } = who;
  const { parseWeightInput, formatWeight, toKg, fromKg } = species;
  const {
    calculateBmi,
    idealWeightFromBcs,
    summarize,
    ageInMonths,
    calculateGrowthPercentile,
    buildInsights,
  } = insights;

  console.log("\nunits");
  check("gram species is stored in kilograms", () => {
    const parsed = parseWeightInput("850", "guinea_pig");
    assert.equal(parsed.ok, true);
    assert.equal(parsed.kg, 0.85);
    assert.equal(formatWeight(0.85, "guinea_pig"), "850 g");
  });
  check("kilogram species round-trips", () => {
    assert.equal(toKg(4.2, "cat"), 4.2);
    assert.equal(fromKg(4.2, "cat"), 4.2);
    assert.equal(formatWeight(4.2, "cat"), "4.20 kg");
  });
  check("comma decimal separator is accepted", () => {
    assert.equal(parseWeightInput("70,5", "human_adult").kg, 70.5);
  });
  check("implausible values are rejected per species", () => {
    assert.equal(parseWeightInput("300", "cat").ok, false);
    assert.equal(parseWeightInput("300", "human_adult").ok, true);
    assert.equal(parseWeightInput("0", "cat").reason, "invalid");
    assert.equal(parseWeightInput("", "cat").reason, "empty");
  });

  console.log("\nbmi");
  check("BMI matches kg/m^2 and bands", () => {
    const result = calculateBmi(70, 175);
    assert.equal(result.value, 22.9);
    assert.equal(result.categoryKey, "bmi.normal");
    assert.equal(calculateBmi(45, 175).categoryKey, "bmi.underweight");
    assert.equal(calculateBmi(85, 175).categoryKey, "bmi.overweight");
    assert.equal(calculateBmi(100, 175).categoryKey, "bmi.obese");
    assert.equal(calculateBmi(70, 0), null);
  });

  console.log("\nbody condition score");
  check("score of 5 means already at ideal weight", () => {
    assert.equal(idealWeightFromBcs(4.5, 5), 4.5);
  });
  check("score of 7 means roughly 20% over ideal", () => {
    assert.equal(idealWeightFromBcs(6, 7), 5);
  });
  check("scores outside 1-9 return null", () => {
    assert.equal(idealWeightFromBcs(6, 0), null);
    assert.equal(idealWeightFromBcs(6, 10), null);
  });

  console.log("\ntrend");
  check("empty and single-entry series are handled", () => {
    assert.equal(summarize([]).count, 0);
    const single = summarize([{ weight: 5, entry_date: "2026-01-01" }]);
    assert.equal(single.change, 0);
    assert.equal(single.previous, null);
  });
  check("change is measured oldest to newest", () => {
    const result = summarize([
      { weight: 70, entry_date: "2026-01-01" },
      { weight: 71, entry_date: "2026-02-01" },
      { weight: 68.5, entry_date: "2026-03-01" },
    ]);
    assert.equal(result.count, 3);
    assert.equal(result.change, -1.5);
    assert.equal(result.changeSincePrevious, -2.5);
  });

  console.log("\nage");
  check("age in months respects the day of month", () => {
    assert.equal(ageInMonths("2026-01-15", new Date(2026, 7, 14)), 6);
    assert.equal(ageInMonths("2026-01-15", new Date(2026, 7, 15)), 7);
  });
  check("birth date is read as a local calendar date, not a UTC instant", () => {
    // Regression, and a US-market one specifically: new Date("2025-01-01") is
    // the 31st of December anywhere west of UTC, which made the day-of-month
    // comparison below reach for the wrong month. Measuring on the last day of
    // a month then reported a baby a whole month older than it is — and with
    // month-based WHO rows, an extra month means the wrong percentile.
    // Every birth date was affected on some measurement days; zero east of UTC.
    assert.equal(ageInMonths("2025-01-01", new Date(2026, 0, 31)), 12);
    assert.equal(ageInMonths("2025-01-01", new Date(2026, 2, 31)), 14);
    assert.equal(ageInMonths("2025-06-01", new Date(2026, 6, 31)), 13);
    // And the ordinary cases still hold.
    assert.equal(ageInMonths("2026-03-01", new Date(2026, 8, 1)), 6);
    assert.equal(ageInMonths("2026-03-01", new Date(2026, 2, 1)), 0);
  });
  check("an unparseable or impossible birth date returns null", () => {
    assert.equal(ageInMonths("not-a-date"), null);
    assert.equal(ageInMonths("2026-02-31"), null);
    assert.equal(ageInMonths(""), null);
  });

  console.log("\ngrowth percentile");
  check("L/M/S reproduce the published WHO weights for every month", () => {
    // The strongest guard available without a network call: WHO publishes the
    // -2SD/median/+2SD weights alongside the L/M/S parameters, and the weights
    // are derived from the parameters. A mistyped, shifted or invented row
    // cannot survive this. See scripts/fixtures/whoWeightForAgeReference.mjs.
    const weightAtZ = (L, M, S, z) =>
      L === 0 ? M * Math.exp(S * z) : M * Math.pow(1 + L * S * z, 1 / L);

    const pairs = [
      ["boys", BOYS, BOYS_REFERENCE],
      ["girls", GIRLS, GIRLS_REFERENCE],
    ];

    for (const [label, table, reference] of pairs) {
      assert.equal(table.length, reference.length, `${label}: row count`);

      for (const [index, [month, at2neg, median, at2pos]] of reference.entries()) {
        const [tableMonth, L, M, S] = table[index];
        assert.equal(tableMonth, month, `${label}: month ${month} is out of order`);

        for (const [z, published] of [[-2, at2neg], [0, median], [2, at2pos]]) {
          const computed = weightAtZ(L, M, S, z);
          assert.ok(
            Math.abs(computed - published) <= TOLERANCE_KG,
            `${label} month ${month} at z=${z}: published ${published} kg but ` +
              `L/M/S give ${computed.toFixed(3)} kg`
          );
        }
      }
    }
  });
  check("the table covers birth to five years for both sexes", () => {
    assert.equal(hasGrowthData(), true);
    for (const table of [BOYS, GIRLS]) {
      assert.equal(table.length, 61);
      assert.equal(table[0][0], 0);
      assert.equal(table[60][0], 60);
    }
  });
  check("a baby at the median sits on the 50th percentile", () => {
    // Boys, 0 months: WHO median is 3.3464 kg.
    const result = calculateGrowthPercentile(3.3464, "2026-01-01", "male", new Date(2026, 0, 1));
    assert.equal(result.ageMonths, 0);
    assert.equal(result.zScore, 0);
    assert.equal(result.percentile, 50);
  });
  check("two standard deviations land on the WHO 2nd and 98th percentiles", () => {
    const born = "2026-01-01";
    const at = new Date(2027, 0, 1); // 12 months
    const { L, M, S } = lookupLms("female", 12);
    const light = M * Math.pow(1 + L * S * -2, 1 / L);
    const heavy = M * Math.pow(1 + L * S * 2, 1 / L);

    const low = calculateGrowthPercentile(light, born, "female", at);
    const high = calculateGrowthPercentile(heavy, born, "female", at);
    assert.equal(low.ageMonths, 12);
    assert.equal(low.zScore, -2);
    assert.equal(high.zScore, 2);
    // The normal CDF at ±2SD, which is what WHO's 2nd/98th columns represent.
    assert.ok(Math.abs(low.percentile - 2.3) < 0.1, `got ${low.percentile}`);
    assert.ok(Math.abs(high.percentile - 97.7) < 0.1, `got ${high.percentile}`);
  });
  check("sex selects a different reference curve", () => {
    const at = new Date(2026, 6, 1); // 6 months
    const boy = calculateGrowthPercentile(7.9, "2026-01-01", "male", at);
    const girl = calculateGrowthPercentile(7.9, "2026-01-01", "female", at);
    assert.equal(boy.ageMonths, 6);
    // Girls are lighter at the median, so the same weight reads higher for them.
    assert.ok(girl.percentile > boy.percentile, `${girl.percentile} vs ${boy.percentile}`);
  });
  check("we decline to answer outside the standards' range", () => {
    // Past five years the weight-for-age standard stops; BMI-for-age takes over.
    assert.equal(
      calculateGrowthPercentile(20, "2020-01-01", "male", new Date(2026, 0, 1)),
      null
    );
    // Unborn, and missing inputs.
    assert.equal(
      calculateGrowthPercentile(3.3, "2027-01-01", "male", new Date(2026, 0, 1)),
      null
    );
    assert.equal(calculateGrowthPercentile(3.3, null, "male"), null);
    assert.equal(calculateGrowthPercentile(0, "2026-01-01", "male"), null);
  });

  console.log("\nfacade");
  check("insight kind follows the species", () => {
    const entries = [
      { weight: 80, entry_date: "2026-01-01" },
      { weight: 76, entry_date: "2026-06-01" },
    ];
    const adult = buildInsights(
      { species: "human_adult", height_cm: 180, target_weight: 74 },
      entries
    );
    assert.equal(adult.bmi.value, 23.5);
    assert.equal(adult.growth, null);
    assert.equal(adult.idealWeight, null);
    assert.equal(adult.target.remaining, 2);
    assert.equal(adult.latestFormatted, "76.0 kg");

    const cat = buildInsights({ species: "cat" }, [
      { weight: 6, entry_date: "2026-06-01", bcs: 7 },
    ]);
    assert.equal(cat.bmi, null);
    assert.equal(cat.idealWeight.kg, 5);
    assert.equal(cat.idealWeight.formatted, "5.00 kg");
  });
  check("a profile with no entries does not throw", () => {
    const result = buildInsights({ species: "dog" }, []);
    assert.equal(result.trend.count, 0);
    assert.equal(result.latestFormatted, "-");
  });
} finally {
  await rm(dir, { recursive: true, force: true });
}

console.log(
  `\n${passed} passed` + (failures.length ? `, ${failures.length} failed` : "")
);

if (failures.length > 0) {
  process.exitCode = 1;
}
