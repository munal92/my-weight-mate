import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/es";

import colors from "../../styles/colors";
import GraphView from "./GraphView";
import { fromKg, getSpecies } from "../../domain/species";
import { useEntitlements } from "../../state/EntitlementsContext";

/**
 * Weight chart with a switchable time window.
 *
 * Takes its data from props — it used to hold a hardcoded `mockData` array, so
 * every profile showed the same invented 2024 numbers.
 *
 * For the long windows the entries are averaged per month before plotting.
 * The old version emitted one label per month but one point per entry, so
 * labels and points drifted out of alignment as soon as a month had more than
 * one weigh-in.
 */

export const PERIODS = ["weekly", "monthly", "3 Months", "yearly"];

const WeightGraphScreen = ({
  entries = [],
  speciesId,
  isJustYearly = false,
  onRequestUpgrade,
}) => {
  const { t, i18n } = useTranslation();
  const { canUseChartPeriod } = useEntitlements();

  const [selectedPeriod, setSelectedPeriod] = useState(
    isJustYearly ? "yearly" : "weekly"
  );
  const [anchor, setAnchor] = useState(() => moment());

  const species = getSpecies(speciesId);

  useEffect(() => {
    moment.locale(i18n.language);
  }, [i18n.language]);

  const range = useMemo(() => {
    switch (selectedPeriod) {
      case "monthly":
        return {
          start: anchor.clone().startOf("month"),
          end: anchor.clone().endOf("month"),
          step: "month",
          aggregate: false,
        };
      case "3 Months":
        return {
          start: anchor.clone().subtract(2, "months").startOf("month"),
          end: anchor.clone().endOf("month"),
          step: "month",
          stepSize: 3,
          aggregate: true,
        };
      case "yearly":
        return {
          start: anchor.clone().startOf("year"),
          end: anchor.clone().endOf("year"),
          step: "year",
          aggregate: true,
        };
      case "weekly":
      default:
        return {
          start: anchor.clone().startOf("isoWeek"),
          end: anchor.clone().endOf("isoWeek"),
          step: "week",
          aggregate: false,
        };
    }
  }, [selectedPeriod, anchor]);

  /** Points in the selected window, already converted to the display unit. */
  const points = useMemo(() => {
    const inRange = entries
      .filter((entry) => Number.isFinite(entry.weight))
      .filter((entry) => {
        const date = moment(entry.entry_date);
        return date.isBetween(range.start, range.end, null, "[]");
      });

    if (!range.aggregate) {
      return inRange.map((entry) => ({
        label: moment(entry.entry_date).format(
          i18n.language === "en" ? "MM/DD" : "DD/MM"
        ),
        value: fromKg(entry.weight, species.id),
      }));
    }

    // One averaged point per month, so labels and values stay 1:1.
    const buckets = new Map();
    for (const entry of inRange) {
      const key = moment(entry.entry_date).format("YYYY-MM");
      const bucket = buckets.get(key) ?? { sum: 0, count: 0, key };
      bucket.sum += entry.weight;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    return [...buckets.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((bucket) => ({
        label: moment(bucket.key, "YYYY-MM").format("MMM"),
        value: fromKg(bucket.sum / bucket.count, species.id),
      }));
  }, [entries, range, species.id, i18n.language]);

  const shiftPeriod = (direction) => {
    const amount = range.stepSize ?? 1;
    setAnchor((current) => current.clone().add(direction * amount, range.step));
  };

  const handlePeriodChange = (period) => {
    if (!canUseChartPeriod(period)) {
      onRequestUpgrade?.(period);
      return;
    }
    setSelectedPeriod(period);
    setAnchor(moment());
  };

  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case "monthly":
        return range.start.format("MMMM YYYY");
      case "3 Months":
        return `${range.start.format("MMM")} - ${range.end.format("MMM YYYY")}`;
      case "yearly":
        return range.start.format("YYYY");
      case "weekly":
      default:
        return `${range.start.format("MMM D")} - ${range.end.format("MMM D")}`;
    }
  }, [selectedPeriod, range]);

  const graphData = {
    labels: points.map((point) => point.label),
    datasets: [{ data: points.map((point) => point.value) }],
  };

  const chart =
    points.length === 0 ? (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>{t("No data found")}</Text>
      </View>
    ) : (
      <GraphView
        graphData={graphData}
        decimals={species.decimals}
        height={isJustYearly ? 180 : 220}
      />
    );

  if (isJustYearly) return chart;

  return (
    <View style={styles.container}>
      <View style={styles.periodTabs}>
        {PERIODS.map((period) => {
          const isLocked = !canUseChartPeriod(period);
          const isActive = period === selectedPeriod;
          return (
            <TouchableOpacity
              key={period}
              style={[styles.periodTab, isActive && styles.periodTabActive]}
              onPress={() => handlePeriodChange(period)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  isActive && styles.periodTabTextActive,
                ]}
              >
                {t(period)}
              </Text>
              {isLocked && (
                <Ionicons
                  name="lock-closed"
                  size={11}
                  color={isActive ? "white" : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => shiftPeriod(-1)} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.periodLabel}>{periodLabel}</Text>
        <TouchableOpacity onPress={() => shiftPeriod(1)} hitSlop={12}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {chart}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  periodTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },
  periodTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  periodTabActive: {
    backgroundColor: colors.bottomTabBlack,
    borderColor: colors.bottomTabBlack,
  },
  periodTabText: { fontSize: 12, color: colors.textPrimary },
  periodTabTextActive: { color: "white" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  periodLabel: {
    fontSize: 15,
    fontFamily: "Barlow_600SemiBold",
    color: colors.textPrimary,
  },
  emptyChart: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});

export default WeightGraphScreen;
