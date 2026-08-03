import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import colors from "../styles/colors";
import {
  DEFAULT_SPECIES_ID,
  allSpecies,
  getSpecies,
  parseWeightInput,
} from "../domain/species";
import { createProfile, updateProfile } from "../db/profiles";
import { useProfiles } from "../state/ProfilesContext";

/**
 * Creates or edits a profile.
 *
 * Which fields are shown is driven entirely by the species registry
 * (needsHeight / needsBirthDate / needsSex), so adding an animal to
 * domain/species.js gives it a working form here with no changes.
 */
const ProfileEditScreen = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { reload } = useProfiles();
  const existing = route.params?.profile ?? null;
  const isEditing = existing != null;

  const [name, setName] = useState(existing?.name ?? "");
  const [speciesId, setSpeciesId] = useState(
    existing?.species ?? DEFAULT_SPECIES_ID
  );
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? "");
  const [sex, setSex] = useState(existing?.sex ?? "");
  const [breed, setBreed] = useState(existing?.breed ?? "");
  const [heightCm, setHeightCm] = useState(
    existing?.height_cm != null ? String(existing.height_cm) : ""
  );
  const [targetWeight, setTargetWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const species = useMemo(() => getSpecies(speciesId), [speciesId]);

  const validate = () => {
    if (!name.trim()) return t("Name is required");

    if (birthDate.trim() && Number.isNaN(Date.parse(birthDate.trim()))) {
      return t("Use the date format YYYY-MM-DD");
    }

    if (heightCm.trim()) {
      const value = Number(heightCm.replace(",", "."));
      if (!Number.isFinite(value) || value <= 0 || value > 260) {
        return t("Enter a valid height in cm");
      }
    }

    if (targetWeight.trim()) {
      const parsed = parseWeightInput(targetWeight, speciesId);
      if (!parsed.ok) {
        return t("Enter a valid target weight");
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert(t("Error"), validationError);
      return;
    }

    setIsSaving(true);
    try {
      const targetParsed = targetWeight.trim()
        ? parseWeightInput(targetWeight, speciesId)
        : null;

      const payload = {
        name: name.trim(),
        species: speciesId,
        birthDate: birthDate.trim() || null,
        sex: sex || null,
        breed: breed.trim() || null,
        heightCm: heightCm.trim() ? Number(heightCm.replace(",", ".")) : null,
        targetWeight: targetParsed?.kg ?? null,
      };

      if (isEditing) {
        await updateProfile(existing.id, payload);
      } else {
        await createProfile({ ...payload, avatarName: species.defaultAvatar });
      }

      await reload();
      navigation.goBack();
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("Cancel")}
        >
          <Ionicons name="arrow-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? t("Edit Profile") : t("New Profile")}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.label}>{t("Name")}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t("Name")}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>{t("Type")}</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={speciesId} onValueChange={setSpeciesId}>
            {allSpecies().map((item) => (
              <Picker.Item
                key={item.id}
                label={t(item.labelKey)}
                value={item.id}
              />
            ))}
          </Picker>
        </View>

        {species.needsBirthDate && (
          <>
            <Text style={styles.label}>{t("Date of Birth")}</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>
              {t("Needed to show growth percentiles")}
            </Text>
          </>
        )}

        {species.needsSex && (
          <>
            <Text style={styles.label}>{t("Sex")}</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={sex} onValueChange={setSex}>
                <Picker.Item label={t("Not specified")} value="" />
                <Picker.Item label={t("Male")} value="male" />
                <Picker.Item label={t("Female")} value="female" />
              </Picker>
            </View>
          </>
        )}

        {species.needsHeight && (
          <>
            <Text style={styles.label}>{t("Height (cm)")}</Text>
            <TextInput
              style={styles.input}
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              placeholder="170"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.hint}>{t("Needed to calculate BMI")}</Text>
          </>
        )}

        {species.group === "pet" && (
          <>
            <Text style={styles.label}>{t("Breed")}</Text>
            <TextInput
              style={styles.input}
              value={breed}
              onChangeText={setBreed}
              placeholder={t("Optional")}
              placeholderTextColor={colors.textSecondary}
            />
          </>
        )}

        <Text style={styles.label}>
          {t("Target weight")} ({species.unit})
        </Text>
        <TextInput
          style={styles.input}
          value={targetWeight}
          onChangeText={setTargetWeight}
          keyboardType="numeric"
          placeholder={t("Optional")}
          placeholderTextColor={colors.textSecondary}
        />

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>{t("Save")}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  form: { padding: 20, paddingBottom: 60 },
  label: {
    fontSize: 15,
    fontFamily: "Barlow_500Medium",
    color: colors.textPrimary,
    marginTop: 18,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: "white",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: 10,
    backgroundColor: "white",
    overflow: "hidden",
  },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: colors.addProfilebtnBg,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: "white",
    fontSize: 17,
    fontFamily: "Barlow_600SemiBold",
  },
});

export default ProfileEditScreen;
