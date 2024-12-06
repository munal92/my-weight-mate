import * as SQLite from "expo-sqlite";

// Open database connection
const openDb = async () => {
  const db = await SQLite.openDatabaseAsync("weightTrackingApp.db");
  return db;
};

// Initialize the database (create tables)
export const initializeDb = async () => {
    try {
      const db = await openDb();
      console.log("Database opened");
  
      // Create profiles table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          dob DATE,
          password TEXT,
          avatar_name TEXT
        );
      `);
      console.log("Profiles table created (or already exists)");
  
      // Create weights table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS weights (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          profile_id INTEGER,
          weight REAL,
          entry_date DATE,
          FOREIGN KEY (profile_id) REFERENCES profiles(id)
        );
      `);
      console.log("Weights table created (or already exists)");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  };
  

// Create profile
export const createProfile = async (name, dob, password, avatarName) => {
  try {
    const db = await openDb();
    await db.runAsync(
      "INSERT INTO profiles (name, dob, password, avatar_name) VALUES (?, ?, ?, ?)",
      name,
      dob || null,
      password || null,
      avatarName || null
    );
    console.log("Profile added successfully");
  } catch (error) {
    console.error("Error adding profile:", error);
  }
};

// Get all profiles
export const getProfiles = async () => {
  try {
    const db = await openDb();
    const profiles = await db.getAllAsync("SELECT * FROM profiles");
    return profiles;
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return [];
  }
};

// Update profile
export const updateProfile = async (id, name, dob, avatarName) => {
  try {
    const db = await openDb();
    await db.runAsync(
      "UPDATE profiles SET name = ?, dob = ?, avatar_name = ? WHERE id = ?",
      name,
      dob,
      avatarName,
      id
    );
    console.log("Profile updated successfully");
  } catch (error) {
    console.error("Error updating profile:", error);
  }
};

// Delete profile
export const deleteProfile = async (id) => {
  try {
    const db = await openDb();
    await db.runAsync("DELETE FROM profiles WHERE id = ?", id);
    console.log("Profile deleted successfully");
  } catch (error) {
    console.error("Error deleting profile:", error);
  }
};

// Create weight entry for profile
export const addWeight = async (profileId, weight) => {
  try {
    const db = await openDb();
    const entryDate = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO weights (profile_id, weight, entry_date) VALUES (?, ?, ?)",
      profileId,
      parseFloat(weight),
      entryDate
    );
    console.log("Weight entry added successfully");
  } catch (error) {
    console.error("Error adding weight:", error);
  }
};

// Fetch weights for a specific profile
export const getWeights = async (profileId) => {
  try {
    const db = await openDb();
    const weights = await db.getAllAsync(
      "SELECT * FROM weights WHERE profile_id = ?",
      profileId
    );
    return weights;
  } catch (error) {
    console.error("Error fetching weights:", error);
    return [];
  }
};

// Update weight entry
export const updateWeight = async (weightId, weight) => {
  try {
    const db = await openDb();
    await db.runAsync(
      "UPDATE weights SET weight = ? WHERE id = ?",
      parseFloat(weight),
      weightId
    );
    console.log("Weight updated successfully");
  } catch (error) {
    console.error("Error updating weight:", error);
  }
};

// Delete weight entry
export const deleteWeight = async (weightId) => {
  try {
    const db = await openDb();
    await db.runAsync("DELETE FROM weights WHERE id = ?", weightId);
    console.log("Weight deleted successfully");
  } catch (error) {
    console.error("Error deleting weight:", error);
  }
};
