import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, SafeAreaView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
import CustomButton from "../components/settingsUI/CustomButton";
import AvatarComponent from "../components/homeUi/AvatarComponent";

const SettingsScreen = ({ navigation, isLoading, setIsLoading }) => {
  const { t, i18n } = useTranslation();

  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = async () => {
    try {
      const newLanguage = i18n.language === "tr" ? "en" : "tr";
      await AsyncStorage.setItem("selectedLanguage", newLanguage);
      setIsEnabled((previousState) => !previousState);
      console.log("Changing language to:", newLanguage);
      i18n.changeLanguage(newLanguage);
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  // Define data for each section (Account, Support, Settings)
  const sections = [
    {
      title: t("Settings"),
      buttons: [
        { title: t("Notification Settings"), icon: "notifications" },
        { title: t("Select a Language"), icon: "language" },
        { title: t("Select Weight Units"), icon: "scale" },
      ],
    },
    {
      title: t("Support"),
      buttons: [
        { title: t("About Us"), icon: "information-circle" },
        { title: t("Privacy Policy"), icon: "lock-closed" },
      ],
    },
    {
      title: t("Account"),
      buttons: [{ title: t("Delete my info"), icon: "trash-bin" }],
    },
  ];

  // Render a button for each item
  const renderItem = ({ item }) => (
    <CustomButton btnText={item.title} notification_name={item.icon} />
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <AvatarComponent />
        <FlatList
          showsVerticalScrollIndicator={false}
          data={sections} // List of sections
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View>
              <Text style={styles.title}>{item.title}</Text>
              <FlatList
                showsVerticalScrollIndicator={false}
                data={item.buttons} // List of buttons in each section
                keyExtractor={(button, index) => index.toString()}
                renderItem={renderItem}
              />
            </View>
          )}
          ListFooterComponent={<View style={{ marginBottom: 20 }} />} // Optional: Add footer space
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 20,
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default SettingsScreen;
