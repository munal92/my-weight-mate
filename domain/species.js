/**
 * Species registry.
 *
 * Every profile in the app belongs to a species, and the species decides three
 * things: which unit and precision the weight is entered in, what a plausible
 * weight looks like (input validation), and which insight we can offer on top
 * of the raw numbers.
 *
 * Adding a new animal is meant to be a single entry in SPECIES_LIST. Nothing
 * else in the app hardcodes a species.
 */

export const UNIT = {
  KG: "kg",
  G: "g",
};

/**
 * The kind of analysis a species supports.
 *
 * BMI          - adult humans, height-based, exact formula.
 * PERCENTILE   - infants and children, WHO growth standards.
 * BCS          - animals: veterinary Body Condition Score drives an ideal
 *                weight estimate. Deliberately not a per-breed lookup table,
 *                because breed variation is far too wide for a built-in table
 *                to be trustworthy.
 */
export const INSIGHT = {
  BMI: "bmi",
  PERCENTILE: "percentile",
  BCS: "bcs",
};

export const GROUP = {
  HUMAN: "human",
  PET: "pet",
};

/**
 * `note` is shown in the UI next to any built-in guidance so the user knows how
 * much weight to put on it. Ranges given here are broad orientation values, not
 * medical or veterinary advice, and every species can be overridden by the
 * user's own target weight.
 */
const SPECIES_LIST = [
  {
    id: "human_adult",
    group: GROUP.HUMAN,
    labelKey: "species.human_adult",
    unit: UNIT.KG,
    decimals: 1,
    plausible: { min: 20, max: 400 },
    insight: INSIGHT.BMI,
    needsHeight: true,
    defaultAvatar: "avatar_1",
  },
  {
    id: "human_child",
    group: GROUP.HUMAN,
    labelKey: "species.human_child",
    unit: UNIT.KG,
    decimals: 1,
    plausible: { min: 5, max: 150 },
    insight: INSIGHT.PERCENTILE,
    needsBirthDate: true,
    needsSex: true,
    defaultAvatar: "avatar_3",
  },
  {
    id: "human_baby",
    group: GROUP.HUMAN,
    labelKey: "species.human_baby",
    unit: UNIT.KG,
    decimals: 2,
    plausible: { min: 0.4, max: 25 },
    insight: INSIGHT.PERCENTILE,
    needsBirthDate: true,
    needsSex: true,
    defaultAvatar: "avatar_2",
  },
  {
    id: "cat",
    group: GROUP.PET,
    labelKey: "species.cat",
    unit: UNIT.KG,
    decimals: 2,
    plausible: { min: 0.1, max: 15 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_cat_1",
  },
  {
    id: "dog",
    group: GROUP.PET,
    labelKey: "species.dog",
    unit: UNIT.KG,
    decimals: 2,
    plausible: { min: 0.3, max: 120 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_4",
  },
  {
    id: "rabbit",
    group: GROUP.PET,
    labelKey: "species.rabbit",
    unit: UNIT.KG,
    decimals: 2,
    plausible: { min: 0.3, max: 10 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "guinea_pig",
    group: GROUP.PET,
    labelKey: "species.guinea_pig",
    unit: UNIT.G,
    decimals: 0,
    plausible: { min: 100, max: 2000 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "hamster",
    group: GROUP.PET,
    labelKey: "species.hamster",
    unit: UNIT.G,
    decimals: 0,
    plausible: { min: 15, max: 300 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "bird",
    group: GROUP.PET,
    labelKey: "species.bird",
    unit: UNIT.G,
    decimals: 0,
    plausible: { min: 5, max: 2000 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "ferret",
    group: GROUP.PET,
    labelKey: "species.ferret",
    unit: UNIT.G,
    decimals: 0,
    plausible: { min: 200, max: 3000 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "reptile",
    group: GROUP.PET,
    labelKey: "species.reptile",
    unit: UNIT.G,
    decimals: 0,
    plausible: { min: 2, max: 50000 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "horse",
    group: GROUP.PET,
    labelKey: "species.horse",
    unit: UNIT.KG,
    decimals: 0,
    plausible: { min: 30, max: 1200 },
    insight: INSIGHT.BCS,
    defaultAvatar: "avatar_5",
  },
  {
    id: "other",
    group: GROUP.PET,
    labelKey: "species.other",
    unit: UNIT.KG,
    decimals: 2,
    plausible: { min: 0.001, max: 5000 },
    insight: null,
    defaultAvatar: "avatar_5",
  },
];

const SPECIES_BY_ID = SPECIES_LIST.reduce((acc, species) => {
  acc[species.id] = species;
  return acc;
}, {});

export const DEFAULT_SPECIES_ID = "human_adult";

export const allSpecies = () => SPECIES_LIST;

export const humanSpecies = () =>
  SPECIES_LIST.filter((s) => s.group === GROUP.HUMAN);

export const petSpecies = () => SPECIES_LIST.filter((s) => s.group === GROUP.PET);

/** Always returns a species; unknown ids fall back to the default. */
export const getSpecies = (id) =>
  SPECIES_BY_ID[id] || SPECIES_BY_ID[DEFAULT_SPECIES_ID];

/**
 * Weights are stored in kilograms for every species so that queries and charts
 * never have to care about units. Only display and input conversion happens
 * here.
 */
export const toKg = (value, speciesId) =>
  getSpecies(speciesId).unit === UNIT.G ? value / 1000 : value;

export const fromKg = (kg, speciesId) =>
  getSpecies(speciesId).unit === UNIT.G ? kg * 1000 : kg;

export const formatWeight = (kg, speciesId) => {
  if (kg == null || Number.isNaN(kg)) return "-";
  const species = getSpecies(speciesId);
  const value = fromKg(kg, speciesId);
  return `${value.toFixed(species.decimals)} ${species.unit}`;
};

/**
 * Validates a value the user typed, in the species' own display unit.
 * Returns { ok: true, kg } or { ok: false, reason }.
 */
export const parseWeightInput = (raw, speciesId) => {
  const species = getSpecies(speciesId);
  const normalized = String(raw).replace(",", ".").trim();
  if (normalized === "") return { ok: false, reason: "empty" };

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, reason: "invalid" };
  }
  if (value < species.plausible.min || value > species.plausible.max) {
    return { ok: false, reason: "out_of_range", plausible: species.plausible };
  }
  return { ok: true, kg: toKg(value, speciesId) };
};
