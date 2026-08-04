import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import Avatar1 from "../../assets/avatar_1.svg";
import Avatar2 from "../../assets/avatar_2.svg";
import Avatar3 from "../../assets/avatar_3.svg";
import Avatar4 from "../../assets/avatar_4.svg";
import Avatar5 from "../../assets/avatar_5.svg";
import AvatarCat1 from "../../assets/avatar_cat_1.svg";
import { getSpecies } from "../../domain/species";

const avatars = {
  avatar_1: Avatar1,
  avatar_2: Avatar2,
  avatar_3: Avatar3,
  avatar_4: Avatar4,
  avatar_5: Avatar5,
  avatar_cat_1: AvatarCat1,
};

/** Greeting that matches the time of day rather than always saying morning. */
const greetingKey = (hour) => {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const AvatarComponent = ({ profile }) => {
  const { t } = useTranslation();

  // The name was hardcoded to a single person, so every profile and every
  // install showed the same one.
  const displayName = profile?.name ?? t("there");
  const species = getSpecies(profile?.species);
  const AvatarSvg =
    avatars[profile?.avatar_name] || avatars[species.defaultAvatar];

  return (
    <View style={styles.container}>
      <AvatarSvg width={54} height={54} />
      <View style={styles.textContainer}>
        <Text style={styles.titleTop}>{t(greetingKey(new Date().getHours()))},</Text>
        <Text style={styles.titleName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
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
    marginLeft: 16,
    flex: 1,
  },
});

export default AvatarComponent;
