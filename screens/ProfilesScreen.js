import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button, SafeAreaView } from "react-native";

import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
import WeightGraphScreen from "../components/profilesComponents/WeightGraphScreen";
import ProfilesList from "../components/profilesComponents/ProfilesList";
const ProfilesScreen = ({ navigation, isLoading, setIsLoading }) => {
  const { t, i18n } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ProfilesList />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
});

export default ProfilesScreen;
