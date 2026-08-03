import { getDb } from "./database";

/**
 * Weight repository.
 *
 * Weights are stored in kilograms for every species; the display unit lives in
 * the species registry. Dates are ISO 8601 strings, which sort correctly as
 * text in SQLite, so range queries and ORDER BY need no date functions.
 */

const SELECT_COLUMNS = "id, profile_id, weight, entry_date, note, bcs, photo_uri";

/** Oldest first — charts and trend calculations both want chronological order. */
export const listWeights = async (profileId) => {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ${SELECT_COLUMNS} FROM weights
      WHERE profile_id = ?
      ORDER BY entry_date ASC, id ASC;`,
    profileId
  );
};

export const listWeightsBetween = async (profileId, fromIso, toIso) => {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ${SELECT_COLUMNS} FROM weights
      WHERE profile_id = ? AND entry_date >= ? AND entry_date <= ?
      ORDER BY entry_date ASC, id ASC;`,
    profileId,
    fromIso,
    toIso
  );
};

export const getLatestWeight = async (profileId) => {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT ${SELECT_COLUMNS} FROM weights
      WHERE profile_id = ?
      ORDER BY entry_date DESC, id DESC
      LIMIT 1;`,
    profileId
  );
};

/**
 * One round trip that returns the headline numbers for every profile at once.
 * The profiles list renders a card per profile, and doing this per card was
 * three queries each.
 */
export const getSummaryByProfile = async () => {
  const db = await getDb();
  const rows = await db.getAllAsync(`
    SELECT
      profile_id,
      COUNT(*) AS entry_count,
      MIN(entry_date) AS first_date,
      MAX(entry_date) AS last_date
    FROM weights
    GROUP BY profile_id;
  `);

  const summaries = {};
  for (const row of rows) {
    summaries[row.profile_id] = row;
  }
  return summaries;
};

export const addWeight = async (
  profileId,
  weightKg,
  { entryDate = new Date().toISOString(), note = null, bcs = null, photoUri = null } = {}
) => {
  if (!Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("Weight must be a positive number");
  }

  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO weights (profile_id, weight, entry_date, note, bcs, photo_uri)
     VALUES (?, ?, ?, ?, ?, ?);`,
    profileId,
    weightKg,
    entryDate,
    note,
    bcs,
    photoUri
  );
  return result.lastInsertRowId;
};

const UPDATABLE_COLUMNS = {
  weightKg: "weight",
  entryDate: "entry_date",
  note: "note",
  bcs: "bcs",
  photoUri: "photo_uri",
};

export const updateWeight = async (id, patch) => {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      assignments.push(`${column} = ?`);
      values.push(patch[key]);
    }
  }

  if (assignments.length === 0) return;

  const db = await getDb();
  await db.runAsync(
    `UPDATE weights SET ${assignments.join(", ")} WHERE id = ?;`,
    ...values,
    id
  );
};

export const deleteWeight = async (id) => {
  const db = await getDb();
  await db.runAsync("DELETE FROM weights WHERE id = ?;", id);
};
