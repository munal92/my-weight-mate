import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "weightTrackingApp.db";

/**
 * One connection for the whole app.
 *
 * The previous implementation called openDatabaseAsync() inside every CRUD
 * helper, so a screen doing a handful of reads opened a handful of connections.
 * The promise is cached rather than the resolved handle so that concurrent
 * callers during startup share a single open, instead of racing.
 */
let connectionPromise = null;

const connect = async () => {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync("PRAGMA journal_mode = WAL;");
  await db.execAsync("PRAGMA foreign_keys = ON;");
  await migrate(db);
  return db;
};

export const getDb = () => {
  if (!connectionPromise) {
    connectionPromise = connect().catch((error) => {
      // Do not cache a failed connection, otherwise the app is stuck for the
      // rest of the session.
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
};

/**
 * Ordered, append-only list of schema migrations.
 *
 * Index 0 runs when user_version is 0, index 1 when it is 1, and so on. Never
 * edit a migration that has shipped - add a new one. The first migration is
 * written with IF NOT EXISTS so that installs created before versioning existed
 * (which sit at user_version 0 but already have the tables) pass through it
 * harmlessly and pick up migration 2.
 */
const MIGRATIONS = [
  // 0 -> 1: the original schema.
  async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        dob DATE,
        password TEXT,
        avatar_name TEXT
      );

      CREATE TABLE IF NOT EXISTS weights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER,
        weight REAL,
        entry_date DATE,
        FOREIGN KEY (profile_id) REFERENCES profiles(id)
      );
    `);
  },

  // 1 -> 2: species-aware profiles and richer weight entries.
  async (db) => {
    const columns = await db.getAllAsync("PRAGMA table_info(profiles);");
    const has = (name) => columns.some((c) => c.name === name);

    // `dob` becomes `birth_date` so the whole codebase uses one name for it.
    if (has("dob") && !has("birth_date")) {
      await db.execAsync(
        "ALTER TABLE profiles RENAME COLUMN dob TO birth_date;"
      );
    }

    const addProfileColumn = async (name, definition) => {
      if (!has(name) && name !== "birth_date") {
        await db.execAsync(
          `ALTER TABLE profiles ADD COLUMN ${name} ${definition};`
        );
      }
    };

    await addProfileColumn("species", "TEXT NOT NULL DEFAULT 'human_adult'");
    await addProfileColumn("sex", "TEXT");
    await addProfileColumn("breed", "TEXT");
    await addProfileColumn("height_cm", "REAL");
    await addProfileColumn("target_weight", "REAL");
    await addProfileColumn("sort_order", "INTEGER NOT NULL DEFAULT 0");
    await addProfileColumn("created_at", "TEXT");

    // The `password` column stays for now so no existing data is destroyed, but
    // nothing reads or writes it any more: it held plaintext and the check was
    // never wired up. A profile lock should be rebuilt on device
    // authentication (expo-local-authentication) instead.

    const weightColumns = await db.getAllAsync("PRAGMA table_info(weights);");
    const hasWeightColumn = (name) =>
      weightColumns.some((c) => c.name === name);

    if (!hasWeightColumn("note")) {
      await db.execAsync("ALTER TABLE weights ADD COLUMN note TEXT;");
    }
    if (!hasWeightColumn("bcs")) {
      // Body Condition Score, 1-9, pets only.
      await db.execAsync("ALTER TABLE weights ADD COLUMN bcs INTEGER;");
    }
    if (!hasWeightColumn("photo_uri")) {
      await db.execAsync("ALTER TABLE weights ADD COLUMN photo_uri TEXT;");
    }

    // Every chart query filters by profile and sorts by date.
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_weights_profile_date
        ON weights (profile_id, entry_date);
    `);

    await db.execAsync(
      "UPDATE profiles SET created_at = COALESCE(created_at, datetime('now'));"
    );
  },
];

const migrate = async (db) => {
  const row = await db.getFirstAsync("PRAGMA user_version;");
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    await db.withTransactionAsync(async () => {
      await MIGRATIONS[version](db);
    });
    version += 1;
    // PRAGMA does not accept bound parameters, and `version` is a loop counter
    // over a hardcoded array, never user input.
    await db.execAsync(`PRAGMA user_version = ${version};`);
  }
};

/** Test/debug helper: forces the next getDb() to reopen. */
export const resetConnectionForTests = () => {
  connectionPromise = null;
};
