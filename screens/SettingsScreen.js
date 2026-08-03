import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import colors from "../styles/colors";
import CustomButton from "../components/settingsUI/CustomButton";
import PaywallModal from "../components/paywall/PaywallModal";
import { useEntitlements } from "../state/EntitlementsContext";
import { useProfiles } from "../state/ProfilesContext";
import { deleteProfile } from "../db/profiles";

const LANGUAGES = ["en", "tr", "es"];

const SettingsScreen = ({ route }) => {
  const { t, i18n } = useTranslation();
  const { isPremium } = useEntitlements();
  const { profiles, reload } = useProfiles();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // ProfileDetail sends the user here when they tap a premium feature.
  useEffect(() => {
    if (route?.params?.showPaywall) setIsPaywallOpen(true);
  }, [route?.params?.showPaywall]);

  const cycleLanguage = async () => {
    const currentIndex = LANGUAGES.indexOf(i18n.language);
    const next = LANGUAGES[(currentIndex + 1) % LANGUAGES.length];
    try {
      await AsyncStorage.setItem("selectedLanguage", next);
      await i18n.changeLanguage(next);
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    }
  };

  const confirmDeleteEverything = () => {
    Alert.alert(t("Delete my info"), t("This cannot be undone."), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            // Deleting each profile also removes its weight entries.
            await Promise.all(profiles.map((profile) => deleteProfile(profile.id)));
            await reload();
            Alert.alert(t("Success"), t("All local data has been deleted."));
          } catch (error) {
            Alert.alert(t("Error"), String(error.message));
          }
        },
      },
    ]);
  };

  const sections = [
    {
      title: t("Settings"),
      buttons: [
        {
          key: "language",
          title: `${t("Select a Language")} (${i18n.language.toUpperCase()})`,
          icon: "language",
          onPress: cycleLanguage,
        },
        {
          key: "premium",
          title: isPremium ? t("Premium active") : t("Upgrade to Premium"),
          icon: "star",
          onPress: () => setIsPaywallOpen(true),
        },
      ],
    },
    {
      title: t("Support"),
      buttons: [
        { key: "about", title: t("About Us"), icon: "information-circle" },
        { key: "privacy", title: t("Privacy Policy"), icon: "lock-closed" },
      ],
    },
    {
      title: t("Account"),
      buttons: [
        {
          key: "delete",
          title: t("Delete my info"),
          icon: "trash-bin",
          onPress: confirmDeleteEverything,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>{t("Settings")}</Text>

        <FlatList
          showsVerticalScrollIndicator={false}
          data={sections}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.title}>{item.title}</Text>
              {item.buttons.map((button) => (
                <CustomButton
                  key={button.key}
                  btnText={button.title}
                  notification_name={button.icon}
                  onPress={button.onPress}
                  trailing={
                    button.key === "premium" && isPremium ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.secondary}
                      />
                    ) : null
                  }
                />
              ))}
            </View>
          )}
          ListFooterComponent={<View style={{ marginBottom: 20 }} />}
        />
      </View>

      <PaywallModal
        visible={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 20,
    backgroundColor: colors.background,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  title: { fontSize: 16, fontWeight: "700", marginTop: 12 },
});

export default SettingsScreen;
