import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import Checkbox from "expo-checkbox";
import { Ionicons } from "@expo/vector-icons";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { useTranslation } from "react-i18next";

import colors from "../styles/colors";
import AvatarComponent from "../components/homeUi/AvatarComponent";
import CustomButtonUser from "../components/homeUi/CustomButtomUser";
import { formatWeight, getSpecies, parseWeightInput } from "../domain/species";
import { addWeight } from "../db/weights";
import { useProfiles } from "../state/ProfilesContext";

/**
 * Quick-entry screen: pick a profile, log a weight.
 *
 * Every piece of this used to be inert — the picker held three literal strings
 * (Me / Baby / Cat), Submit only wrote to the console, "Remember my selection"
 * was a checkbox wired to nothing, and "Add Weight" had no handler at all.
 */
const Home = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    profiles,
    isLoading,
    selectedProfile,
    selectedProfileId,
    selectProfile,
    rememberSelection,
    toggleRememberSelection,
  } = useProfiles();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [draftProfileId, setDraftProfileId] = useState(null);
  const [weightInput, setWeightInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const species = useMemo(
    () => getSpecies(selectedProfile?.species),
    [selectedProfile?.species]
  );

  const openPicker = () => {
    setDraftProfileId(selectedProfileId);
    setIsPickerOpen(true);
  };

  const submitSelection = async () => {
    if (draftProfileId != null) {
      await selectProfile(draftProfileId);
    }
    setIsPickerOpen(false);
  };

  const handleAddWeight = async () => {
    if (!selectedProfile) {
      Alert.alert(t("Error"), t("Select a profile first"));
      return;
    }

    const parsed = parseWeightInput(weightInput, species.id);
    if (!parsed.ok) {
      const message =
        parsed.reason === "out_of_range"
          ? t(
              "That weight looks off for this profile. Expected between {{min}} and {{max}} {{unit}}.",
              {
                min: parsed.plausible.min,
                max: parsed.plausible.max,
                unit: species.unit,
              }
            )
          : t("Weight is required");
      Alert.alert(t("Error"), message);
      return;
    }

    setIsSaving(true);
    try {
      await addWeight(selectedProfile.id, parsed.kg);
      setWeightInput("");
      Alert.alert(
        t("Success"),
        t("Logged {{weight}} for {{name}}", {
          weight: formatWeight(parsed.kg, species.id),
          name: selectedProfile.name,
        })
      );
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.icongradient1} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.topHeaderContainer}>
        <AvatarComponent profile={selectedProfile} />
        <Ionicons name="notifications-outline" size={24} color="black" />
      </View>

      <View style={styles.home_container}>
        {profiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.title}>{t("No profiles yet")}</Text>
            <Text style={styles.emptyText}>
              {t("Add yourself, your baby or your pet to get started.")}
            </Text>
            <CustomButtonUser
              styleBtn={{ marginTop: 16 }}
              btnText={t("Add Profile")}
              onPress={() => navigation.navigate("ProfileEdit")}
            />
          </View>
        ) : (
          <>
            <Text style={styles.title}>{t("Select Weight Mate")}</Text>

            <TouchableOpacity onPress={openPicker} style={styles.button}>
              <Text style={styles.buttonText}>
                {selectedProfile?.name ?? t("Select a profile")}
              </Text>
              <SimpleLineIcons
                name="arrow-down"
                size={18}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <View style={styles.checkboxSection}>
              <Checkbox
                style={styles.checkbox}
                value={rememberSelection}
                onValueChange={toggleRememberSelection}
                color={rememberSelection ? colors.secondary : undefined}
              />
              <Text style={styles.paragraph}>
                {t("Remember my selection next time")}
              </Text>
            </View>

            <TextInput
              style={styles.weightInput}
              value={weightInput}
              onChangeText={setWeightInput}
              keyboardType="numeric"
              placeholder={`${t("Weight")} (${species.unit})`}
              placeholderTextColor={colors.textSecondary}
              onSubmitEditing={handleAddWeight}
              returnKeyType="done"
            />

            <CustomButtonUser
              styleBtn={{ marginTop: 12 }}
              btnText={isSaving ? t("Saving...") : t("Add Weight")}
              onPress={handleAddWeight}
              disabled={isSaving}
            />

            <TouchableOpacity
              style={styles.detailLink}
              onPress={() =>
                navigation.navigate("ProfileDetail", {
                  profileId: selectedProfile.id,
                  profile: selectedProfile,
                })
              }
            >
              <Text style={styles.detailLinkText}>
                {t("See history and charts")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <Modal
          animationType="slide"
          transparent
          visible={isPickerOpen}
          onRequestClose={() => setIsPickerOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{t("Select Weight Mate")}</Text>

              <Picker
                selectedValue={draftProfileId}
                onValueChange={setDraftProfileId}
                style={styles.picker}
              >
                {profiles.map((profile) => (
                  <Picker.Item
                    key={profile.id}
                    label={profile.name}
                    value={profile.id}
                  />
                ))}
              </Picker>

              <TouchableOpacity
                onPress={submitSelection}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>{t("Submit")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsPickerOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>{t("Close")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  centered: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "500", marginBottom: 10 },
  home_container: {
    flex: 2,
    justifyContent: "flex-start",
    padding: 20,
    paddingTop: 60,
  },
  topHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  emptyState: { alignItems: "flex-start" },
  emptyText: { fontSize: 14, color: colors.textSecondary },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    borderColor: colors.textPrimary,
    borderWidth: 1,
  },
  buttonText: { color: colors.textPrimary, fontSize: 16 },
  weightInput: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "white",
  },
  detailLink: { marginTop: 20, alignItems: "center" },
  detailLinkText: {
    fontSize: 14,
    color: colors.textPrimary,
    textDecorationLine: "underline",
  },
  picker: { width: "100%", marginBottom: 10 },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "600" },
  submitButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: { color: "white", fontSize: 16 },
  closeButton: {
    backgroundColor: colors.accent,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: { color: "white", fontSize: 16 },
  checkboxSection: { flexDirection: "row", alignItems: "center" },
  paragraph: { fontSize: 15 },
  checkbox: { marginRight: 8, marginVertical: 8, width: 18, height: 18 },
});

export default Home;
