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
    assert.equal(ageInMonths("2026-01-15", new Date("2026-08-14")), 6);
    assert.equal(ageInMonths("2026-01-15", new Date("2026-08-15")), 7);
  });

  console.log("\ngrowth percentile");
  check("returns null while the WHO table is unpopulated", () => {
    // Guards the deliberate choice not to ship approximated reference data.
    assert.equal(calculateGrowthPercentile(7.5, "2026-01-01", "male"), null);
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
