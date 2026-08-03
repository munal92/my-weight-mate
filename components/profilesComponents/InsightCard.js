import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import colors from "../../styles/colors";
import { formatWeight } from "../../domain/species";

/**
 * Shows whatever the domain layer could work out for this profile.
 *
 * Every block is conditional on purpose: a profile with no height gets no BMI,
 * an infant with no birth date gets no percentile, and a pet with no body
 * condition score gets no ideal-weight estimate. Showing less beats showing a
 * number we cannot stand behind.
 */
const Stat = ({ label, value, tone }) => (
  <View style={styles.stat}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, tone === "muted" && styles.statValueMuted]}>
      {value}
    </Text>
  </View>
);

const InsightCard = ({ insights, speciesId }) => {
  const { t } = useTranslation();

  if (!insights || insights.trend.count === 0) return null;

  const { trend, bmi, growth, idealWeight, target } = insights;
  const change = trend.change;

  const changeLabel =
    change == null || trend.count < 2
      ? t("Not enough data")
      : `${change > 0 ? "+" : ""}${formatWeight(Math.abs(change), speciesId).replace(
          /^/,
          change < 0 ? "-" : ""
        )}`;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Stat
          label={t("Start")}
          value={formatWeight(trend.first.weight, speciesId)}
        />
        <View style={styles.divider} />
        <Stat
          label={t("Current")}
          value={formatWeight(trend.latest.weight, speciesId)}
        />
        <View style={styles.divider} />
        <Stat
          label={t("Change")}
          value={changeLabel}
          tone={trend.count < 2 ? "muted" : undefined}
        />
      </View>

      {(bmi || growth || idealWeight || target) && (
        <View style={styles.insightSection}>
          {bmi && (
            <Text style={styles.insightLine}>
              {t("BMI")}: <Text style={styles.insightValue}>{bmi.value}</Text>
              {"  "}
              <Text style={styles.insightCategory}>{t(bmi.categoryKey)}</Text>
            </Text>
          )}

          {growth && (
            <Text style={styles.insightLine}>
              {t("Growth percentile")}:{" "}
              <Text style={styles.insightValue}>{growth.percentile}%</Text>
              {"  "}
              <Text style={styles.insightCategory}>
                {t("{{count}} months old", { count: growth.ageMonths })}
              </Text>
            </Text>
          )}

          {idealWeight && (
            <Text style={styles.insightLine}>
              {t("Estimated ideal weight")}:{" "}
              <Text style={styles.insightValue}>{idealWeight.formatted}</Text>
            </Text>
          )}

          {target && (
            <Text style={styles.insightLine}>
              {t("Target")}:{" "}
              <Text style={styles.insightValue}>{target.formatted}</Text>
              {"  "}
              <Text style={styles.insightCategory}>
                {target.remaining > 0
                  ? t("{{amount}} to lose", {
                      amount: formatWeight(target.remaining, speciesId),
                    })
                  : target.remaining < 0
                  ? t("{{amount}} to gain", {
                      amount: formatWeight(-target.remaining, speciesId),
                    })
                  : t("Target reached")}
              </Text>
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.profileGraphbg,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  row: { flexDirection: "row", alignItems: "stretch" },
  stat: { flex: 1, justifyContent: "center" },
  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textAlign: "center",
  },
  statValue: {
    color: "white",
    fontSize: 16,
    fontFamily: "Barlow_600SemiBold",
    textAlign: "center",
    marginTop: 2,
  },
  statValueMuted: { fontSize: 13, fontFamily: "Barlow_400Regular" },
  divider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  insightSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    gap: 6,
  },
  insightLine: { color: "rgba(255,255,255,0.85)", fontSize: 14 },
  insightValue: { color: "white", fontFamily: "Barlow_600SemiBold" },
  insightCategory: { color: "rgba(255,255,255,0.7)", fontSize: 13 },
});

export default InsightCard;
