import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import moment from "moment";

import colors from "../styles/colors";
import { formatWeight, getSpecies, parseWeightInput } from "../domain/species";
import { buildInsights } from "../domain/insights";
import { addWeight, deleteWeight, listWeights } from "../db/weights";
import { getProfile } from "../db/profiles";
import WeightGraphScreen from "../components/profilesComponents/WeightGraphScreen";
import InsightCard from "../components/profilesComponents/InsightCard";
import AiCoachSheet from "../components/ai/AiCoachSheet";
import { useEntitlements } from "../state/EntitlementsContext";

const ProfileDetailScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { canUseAiCoach } = useEntitlements();
  const profileId = route.params.profileId;

  const [profile, setProfile] = useState(route.params.profile ?? null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weightInput, setWeightInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  const species = useMemo(
    () => getSpecies(profile?.species),
    [profile?.species]
  );

  const load = useCallback(async () => {
    try {
      const [freshProfile, rows] = await Promise.all([
        getProfile(profileId),
        listWeights(profileId),
      ]);
      setProfile(freshProfile);
      setEntries(rows);
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    } finally {
      setIsLoading(false);
    }
  }, [profileId, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const insights = useMemo(
    () => (profile ? buildInsights(profile, entries) : null),
    [profile, entries]
  );

  const handleAddWeight = async () => {
    const parsed = parseWeightInput(weightInput, species.id);

    if (!parsed.ok) {
      const message =
        parsed.reason === "out_of_range"
          ? t("That weight looks off for this profile. Expected between {{min}} and {{max}} {{unit}}.", {
              min: parsed.plausible.min,
              max: parsed.plausible.max,
              unit: species.unit,
            })
          : t("Weight is required");
      Alert.alert(t("Error"), message);
      return;
    }

    setIsSaving(true);
    try {
      await addWeight(profileId, parsed.kg);
      setWeightInput("");
      await load();
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWeight = (entry) => {
    Alert.alert(t("Delete entry"), t("This cannot be undone."), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteWeight(entry.id);
            await load();
          } catch (error) {
            Alert.alert(t("Error"), String(error.message));
          }
        },
      },
    ]);
  };

  const handleOpenCoach = () => {
    if (!canUseAiCoach()) {
      navigation.navigate("Settings", { showPaywall: true });
      return;
    }
    setIsCoachOpen(true);
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.icongradient1} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profile.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ProfileEdit", { profile })}
          hitSlop={12}
        >
          <Ionicons name="create-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[...entries].reverse()}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.addRow}>
              <TextInput
                style={styles.weightInput}
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
                placeholder={`${t("Add Weight")} (${species.unit})`}
                placeholderTextColor={colors.textSecondary}
                onSubmitEditing={handleAddWeight}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addButton, isSaving && styles.disabled]}
                onPress={handleAddWeight}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Ionicons name="add" size={26} color="white" />
                )}
              </TouchableOpacity>
            </View>

            <InsightCard insights={insights} speciesId={species.id} />

            <TouchableOpacity style={styles.coachButton} onPress={handleOpenCoach}>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={colors.iconfontcolor}
              />
              <Text style={styles.coachButtonText}>
                {t("Ask the assistant")}
              </Text>
              {!canUseAiCoach() && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>{t("PRO")}</Text>
                </View>
              )}
            </TouchableOpacity>

            {entries.length > 0 && (
              <WeightGraphScreen entries={entries} speciesId={species.id} />
            )}

            <Text style={styles.sectionTitle}>{t("History")}</Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {t("No weight entries yet. Add the first one above.")}
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.entryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.entryWeight}>
                {formatWeight(item.weight, species.id)}
              </Text>
              <Text style={styles.entryDate}>
                {moment(item.entry_date).format("LL")}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteWeight(item)} hitSlop={10}>
              <Ionicons name="trash-outline" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        )}
      />

      <AiCoachSheet
        visible={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        profile={profile}
        insights={insights}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  addRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "white",
  },
  addButton: {
    width: 52,
    borderRadius: 10,
    backgroundColor: colors.addProfilebtnBg,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  coachButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.iconfontcolor,
    marginBottom: 20,
  },
  coachButtonText: {
    fontSize: 15,
    fontFamily: "Barlow_500Medium",
    color: colors.iconfontcolor,
  },
  proBadge: {
    backgroundColor: colors.icongradient1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: "white",
    fontSize: 11,
    fontFamily: "Barlow_600SemiBold",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    paddingVertical: 24,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  entryWeight: {
    fontSize: 16,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  entryDate: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});

export default ProfileDetailScreen;
