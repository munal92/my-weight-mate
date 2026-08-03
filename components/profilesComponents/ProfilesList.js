import React from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";

import ProfileCard from "./ProfileCard";
import colors from "../../styles/colors";

/**
 * Renders the profiles the caller passes in.
 *
 * The list used to own a hardcoded three-entry array (Me / Baby / Cat), so the
 * screen showed the same three fake profiles no matter what was in the
 * database.
 */
export default function ProfilesList({
  profiles,
  entriesByProfile = {},
  isLoading,
  onSelectProfile,
  ListHeaderComponent,
  ListFooterComponent,
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.icongradient1} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>{t("No profiles yet")}</Text>
            <Text style={styles.emptyText}>
              {t("Add yourself, your baby or your pet to get started.")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProfileCard
            profile={item}
            entries={entriesByProfile[item.id] ?? []}
            onPress={() => onSelectProfile?.(item)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", paddingHorizontal: 24 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
