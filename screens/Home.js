import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button,SafeAreaView } from "react-native";
import LoadingIndicator from "../helpers/LoadingIndicator";
import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
import { Ionicons } from "@expo/vector-icons";
import AvatarComponent from "../components/homeUi/AvatarComponent";

const Home = ({ navigation,isLoading,setIsLoading }) => {
  
  const { t, i18n } = useTranslation();

  
  useLayoutEffect(() => {
    setTimeout(() => {
      setIsLoading(false); // Hide loading indicator after 5 seconds
     // navigation.navigate("Home");
    }, 1000); // 5000 milliseconds = 5 seconds
  }, []);

  if (isLoading) {
    return <LoadingIndicator message={t('Loading')+"..."} />;
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderContainer}>
      <AvatarComponent/>
      <Ionicons name="notifications-outline" size={24} color="black" />
      </View>
      
      <View style={styles.home_container} >
      <Text style={styles.title}>{t('Home')}</Text>
      <Button
        title="Go to Carousel"
        onPress={() => navigation.navigate("Carousel")} // To navigate back if needed
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
   
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  home_container:{
    flex:2,
    justifyContent: "center",
    alignItems:"center"
  },
  topHeaderContainer:{
   
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"space-between",
    padding:24
  }
});

export default Home;
