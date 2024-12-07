import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button, Image } from "react-native";

import { useTranslation } from "react-i18next";
import avatarMockPic from "../../assets/profile_avatar.png";
import Avatar1 from "../../assets/avatar_1.svg";
import Avatar2 from "../../assets/avatar_2.svg";
import Avatar3 from "../../assets/avatar_3.svg";
import Avatar4 from "../../assets/avatar_4.svg";
import Avatar5 from "../../assets/avatar_5.svg";
import AvatarCat1 from "../../assets/avatar_cat_1.svg";

const AvatarComponent = ({ navigation, isLoading, setIsLoading }) => {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.container}>
      {/* <Image source={avatarMockPic} style={styles.avatarStyle} /> */}
      <Avatar4 />
      <View style={styles.textContainer}>
        <Text style={styles.titleTop}>{t("Good Morning")},</Text>
        <Text style={styles.titleName}>Aysegul Unal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  titleTop: {
    fontSize: 18,
    fontFamily: "Barlow_300Light",
  },
  titleName: {
    fontSize: 22,
    fontFamily: "Barlow_600SemiBold",
  },
  textContainer: {
    marginLeft: 24,
  },
});

export default AvatarComponent;
