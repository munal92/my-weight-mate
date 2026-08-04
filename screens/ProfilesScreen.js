import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import colors from "../styles/colors";
import ProfilesList from "../components/profilesComponents/ProfilesList";
import PaywallModal from "../components/paywall/PaywallModal";
import { listWeights } from "../db/weights";
import { useProfiles } from "../state/ProfilesContext";
import { useEntitlements } from "../state/EntitlementsContext";

const ProfilesScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { profiles, isLoading, reload } = useProfiles();
  const { canAddProfile, freeTier } = useEntitlements();

  const [entriesByProfile, setEntriesByProfile] = useState({});
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Reload on focus so a weight added on the detail screen shows up here.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const loadEntries = async () => {
        const rows = await reload();
        const results = await Promise.all(
          rows.map(async (profile) => [profile.id, await listWeights(profile.id)])
        );
        if (!cancelled) setEntriesByProfile(Object.fromEntries(results));
      };

      loadEntries().catch(() => {
        // The list still renders; cards simply show no history.
      });

      return () => {
        cancelled = true;
      };
    }, [reload])
  );

  const handleAddProfile = () => {
    if (!canAddProfile(profiles.length)) {
      setIsPaywallOpen(true);
      return;
    }
    navigation.navigate("ProfileEdit");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ProfilesList
        profiles={profiles}
        entriesByProfile={entriesByProfile}
        isLoading={isLoading}
        onSelectProfile={(profile) =>
          navigation.navigate("ProfileDetail", {
            profileId: profile.id,
            profile,
          })
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>{t("Profiles")}</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddProfile}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>{t("Add Profile")}</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          !canAddProfile(profiles.length) ? (
            <Text style={styles.limitNote}>
              {t("Free plan includes {{count}} profiles.", {
                count: freeTier.maxProfiles,
              })}
            </Text>
          ) : null
        }
      />

      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        reason="profiles"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.addProfilebtnBg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Barlow_500Medium",
  },
  limitNote: {
    textAlign: "center",
    color: colors.textSecondary,
    fontSize: 13,
    paddingBottom: 24,
  },
});

export default ProfilesScreen;
