import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";

import Avatar1 from "../../assets/avatar_1.svg";
import Avatar2 from "../../assets/avatar_2.svg";
import Avatar3 from "../../assets/avatar_3.svg";
import Avatar4 from "../../assets/avatar_4.svg";
import Avatar5 from "../../assets/avatar_5.svg";
import AvatarCat1 from "../../assets/avatar_cat_1.svg";
import colors from "../../styles/colors";
import WeightGraphScreen from "./WeightGraphScreen";
import { formatWeight, getSpecies } from "../../domain/species";
import { summarize } from "../../domain/insights";

const avatars = {
  avatar_1: Avatar1,
  avatar_2: Avatar2,
  avatar_3: Avatar3,
  avatar_4: Avatar4,
  avatar_5: Avatar5,
  avatar_cat_1: AvatarCat1,
};

/**
 * One profile's summary card.
 *
 * Start / Current / Change come from the profile's own entries. They used to be
 * the literal strings "1,8 kg", "1,5 kg" and "1,3 kg" on every card, and the
 * chart underneath was a shared 26-row mock array.
 */
export default function ProfileCard({ profile, entries = [], onPress }) {
  const { t } = useTranslation();
  const species = getSpecies(profile.species);
  const AvatarSvg =
    avatars[profile.avatar_name] || avatars[species.defaultAvatar];

  const trend = useMemo(() => summarize(entries), [entries]);
  const hasData = trend.count > 0;

  const changeText = useMemo(() => {
    if (trend.count < 2) return "-";
    const sign = trend.change > 0 ? "+" : trend.change < 0 ? "-" : "";
    return `${sign}${formatWeight(Math.abs(trend.change), species.id)}`;
  }, [trend, species.id]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={profile.name}
    >
      <View style={styles.topContainer}>
        <View style={styles.avatarContainer}>
          <AvatarSvg width={74} height={74} style={styles.avatar} />
          <Text style={styles.name} numberOfLines={1}>
            {profile.name}
          </Text>
          <Text style={styles.speciesLabel}>{t(species.labelKey)}</Text>
        </View>

        <View style={styles.topWeightContainer}>
          <View style={styles.weightTextContainer}>
            <Text style={styles.topLabelStyle}>{t("Start")}</Text>
            <Text style={styles.topTextStyle}>
              {hasData ? formatWeight(trend.first.weight, species.id) : "-"}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.weightTextContainer}>
            <Text style={styles.topLabelStyle}>{t("Current")}</Text>
            <Text style={styles.topTextStyle}>
              {hasData ? formatWeight(trend.latest.weight, species.id) : "-"}
            </Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.weightTextContainer}>
            <Text style={styles.topLabelStyle}>{t("Change")}</Text>
            <Text style={styles.topTextStyle}>{changeText}</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("Weight overview")}</Text>
          <Text style={styles.seeAll}>{t("See All")}</Text>
        </View>

        {hasData ? (
          <WeightGraphScreen
            entries={entries}
            speciesId={species.id}
            isJustYearly
          />
        ) : (
          <Text style={styles.emptyText}>
            {t("No weight entries yet. Add the first one above.")}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginVertical: 20 },
  avatar: {
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 2,
  },
  name: {
    fontSize: 16,
    color: "#333",
    marginTop: 4,
    maxWidth: 90,
    textAlign: "center",
  },
  speciesLabel: { fontSize: 12, color: colors.textSecondary },
  avatarContainer: { justifyContent: "center", alignItems: "center" },
  topContainer: { flexDirection: "row" },
  topWeightContainer: {
    backgroundColor: colors.profileGraphbg,
    flexDirection: "row",
    flex: 2,
    marginBottom: 20,
    marginLeft: 20,
    borderRadius: 10,
    padding: 10,
  },
  verticalDivider: {
    width: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    height: "100%",
  },
  topLabelStyle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textAlign: "center",
  },
  topTextStyle: {
    color: "white",
    fontSize: 15,
    fontFamily: "Barlow_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },
  weightTextContainer: { flex: 1, justifyContent: "center" },
  bottomContainer: {},
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontFamily: "Barlow_600SemiBold" },
  seeAll: {
    fontSize: 14,
    fontFamily: "Barlow_600SemiBold",
    textDecorationLine: "underline",
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 16,
  },
});
