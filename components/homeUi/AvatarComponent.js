import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Image } from "react-native";

import { useTranslation } from "react-i18next";
import avatarMockPic from "../../assets/profile_avatar.png"

const AvatarComponent = ({ navigation,isLoading,setIsLoading }) => {
  
  const { t, i18n } = useTranslation();

  
  
  return (
    <View style={styles.container}>
      <Image source={avatarMockPic} style={styles.avatarStyle}/>
      <View style={styles.textContainer}>
      <Text style={styles.titleTop}>{t('Good Morning')},</Text>
      <Text style={styles.titleName}>Aysegul Unal</Text>
      </View>
      
     
    </View>
  );
};

const styles = StyleSheet.create({
  container:{
    flexDirection:"row",
    alignItems:"center",
    justifyContent:"flex-start",
    
  },
  titleTop: {
    fontSize: 18,
    fontFamily:"Barlow_300Light"
   
  },
  titleName:{
    fontSize: 22,
     fontFamily:"Barlow_600SemiBold"
    
  },
  textContainer:{
    marginLeft:24
  },
  avatarStyle:{
   
  }
});

export default AvatarComponent;
