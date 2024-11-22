import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";

import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
import WeightGraphScreen from "../components/profilesComponents/WeightGraphScreen";
const ProfilesScreen = ({ navigation,isLoading,setIsLoading }) => {
  
  const { t, i18n } = useTranslation();

  
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Profiles')}</Text>
      <WeightGraphScreen/>
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default ProfilesScreen;
