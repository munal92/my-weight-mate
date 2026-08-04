import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { listProfiles } from "../db/profiles";

/**
 * Single source of truth for "which profiles exist" and "which one is active".
 *
 * Home and Profiles both need this, and both need to see a new profile the
 * moment it is created, so it lives above them rather than being fetched twice.
 */

const REMEMBERED_PROFILE_KEY = "rememberedProfileId";

const ProfilesContext = createContext(null);

export const ProfilesProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [rememberSelection, setRememberSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const rows = await listProfiles();
      setProfiles(rows);
      setError(null);

      // Keep the selection pointing at a profile that still exists.
      setSelectedProfileId((current) => {
        if (current != null && rows.some((p) => p.id === current)) {
          return current;
        }
        return rows.length > 0 ? rows[0].id : null;
      });

      return rows;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // Restore the remembered profile before the first render settles, so the
      // user does not see the list flash to a different profile.
      let remembered = null;
      try {
        const stored = await AsyncStorage.getItem(REMEMBERED_PROFILE_KEY);
        if (stored != null) {
          remembered = Number(stored);
        }
      } catch {
        // A missing preference is not worth failing the app over.
      }

      let rows = [];
      try {
        rows = await listProfiles();
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setIsLoading(false);
        }
        return;
      }

      if (cancelled) return;

      setProfiles(rows);
      setRememberSelection(remembered != null);
      setSelectedProfileId(
        remembered != null && rows.some((p) => p.id === remembered)
          ? remembered
          : rows.length > 0
          ? rows[0].id
          : null
      );
      setIsLoading(false);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectProfile = useCallback(
    async (id) => {
      setSelectedProfileId(id);
      if (rememberSelection) {
        try {
          await AsyncStorage.setItem(REMEMBERED_PROFILE_KEY, String(id));
        } catch {
          // Best effort; the selection still applies for this session.
        }
      }
    },
    [rememberSelection]
  );

  const toggleRememberSelection = useCallback(
    async (shouldRemember) => {
      setRememberSelection(shouldRemember);
      try {
        if (shouldRemember && selectedProfileId != null) {
          await AsyncStorage.setItem(
            REMEMBERED_PROFILE_KEY,
            String(selectedProfileId)
          );
        } else {
          await AsyncStorage.removeItem(REMEMBERED_PROFILE_KEY);
        }
      } catch {
        // Best effort.
      }
    },
    [selectedProfileId]
  );

  const value = useMemo(
    () => ({
      profiles,
      isLoading,
      error,
      reload,
      selectedProfileId,
      selectedProfile:
        profiles.find((p) => p.id === selectedProfileId) ?? null,
      selectProfile,
      rememberSelection,
      toggleRememberSelection,
    }),
    [
      profiles,
      isLoading,
      error,
      reload,
      selectedProfileId,
      selectProfile,
      rememberSelection,
      toggleRememberSelection,
    ]
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
    </ProfilesContext.Provider>
  );
};

export const useProfiles = () => {
  const context = useContext(ProfilesContext);
  if (!context) {
    throw new Error("useProfiles must be used inside a ProfilesProvider");
  }
  return context;
};
