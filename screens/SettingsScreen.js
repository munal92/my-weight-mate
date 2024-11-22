import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";

import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
const SettingsScreen = ({ navigation,isLoading,setIsLoading }) => {
  
  const { t, i18n } = useTranslation();


  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () =>{ 
    
    
    setIsEnabled(previousState => !previousState);
    console.log(i18n.language)
    i18n.changeLanguage(i18n.language === "tr" ? "eng" : "tr" )
  
  }

  
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Settings')}</Text>


      <Switch
          trackColor={{false: '#767577', true: '#81b0ff'}}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
     
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

export default SettingsScreen;
