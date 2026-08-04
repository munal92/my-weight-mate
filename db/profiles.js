import { getDb } from "./database";
import { DEFAULT_SPECIES_ID, getSpecies } from "../domain/species";

/**
 * Profile repository.
 *
 * Errors are deliberately allowed to propagate. The previous version caught
 * everything, logged it and returned an empty array, which made a broken
 * database look exactly like "no profiles yet" — the caller could never tell
 * the difference or show the user anything useful.
 */

const SELECT_COLUMNS = `
  id, name, species, avatar_name, birth_date, sex, breed,
  height_cm, target_weight, sort_order, created_at
`;

export const listProfiles = async () => {
  const db = await getDb();
  return db.getAllAsync(
    `SELECT ${SELECT_COLUMNS} FROM profiles ORDER BY sort_order ASC, id ASC;`
  );
};

export const getProfile = async (id) => {
  const db = await getDb();
  return db.getFirstAsync(
    `SELECT ${SELECT_COLUMNS} FROM profiles WHERE id = ?;`,
    id
  );
};

export const countProfiles = async () => {
  const db = await getDb();
  const row = await db.getFirstAsync("SELECT COUNT(*) AS total FROM profiles;");
  return row?.total ?? 0;
};

export const createProfile = async ({
  name,
  species = DEFAULT_SPECIES_ID,
  avatarName,
  birthDate = null,
  sex = null,
  breed = null,
  heightCm = null,
  targetWeight = null,
}) => {
  if (!name || !name.trim()) {
    throw new Error("Profile name is required");
  }

  const db = await getDb();
  const speciesDef = getSpecies(species);
  const orderRow = await db.getFirstAsync(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 AS next FROM profiles;"
  );

  const result = await db.runAsync(
    `INSERT INTO profiles
       (name, species, avatar_name, birth_date, sex, breed,
        height_cm, target_weight, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
    name.trim(),
    speciesDef.id,
    avatarName || speciesDef.defaultAvatar,
    birthDate,
    sex,
    breed,
    heightCm,
    targetWeight,
    orderRow?.next ?? 0
  );

  return result.lastInsertRowId;
};

/**
 * Partial update. Only the keys present in `patch` are written, so callers can
 * update a single field without having to read the row first and pass every
 * other value back in — the old updateProfile() nulled out anything it was not
 * given.
 */
const UPDATABLE_COLUMNS = {
  name: "name",
  species: "species",
  avatarName: "avatar_name",
  birthDate: "birth_date",
  sex: "sex",
  breed: "breed",
  heightCm: "height_cm",
  targetWeight: "target_weight",
  sortOrder: "sort_order",
};

export const updateProfile = async (id, patch) => {
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
    `UPDATE profiles SET ${assignments.join(", ")} WHERE id = ?;`,
    ...values,
    id
  );
};

/**
 * Deletes a profile and everything measured for it.
 *
 * The weights table declares the foreign key but not ON DELETE CASCADE, so the
 * child rows are removed explicitly. Both statements run in one transaction so
 * a failure can never leave orphaned weight rows behind.
 */
export const deleteProfile = async (id) => {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM weights WHERE profile_id = ?;", id);
    await db.runAsync("DELETE FROM profiles WHERE id = ?;", id);
  });
};
