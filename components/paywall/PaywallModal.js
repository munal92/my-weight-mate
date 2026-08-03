import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import colors from "../../styles/colors";
import { getAvailablePackages, purchasePackage } from "../../services/purchases";
import { useEntitlements } from "../../state/EntitlementsContext";

/**
 * Paywall.
 *
 * Prices are never hardcoded here — they come from the store via RevenueCat,
 * already formatted and converted for the user's region. Writing "$9.99" into
 * the app would be wrong for most of the world and would go stale the moment
 * pricing changes.
 */

const BENEFIT_KEYS = [
  "Unlimited profiles",
  "3-month and yearly charts",
  "Growth percentiles and ideal weight estimates",
  "AI assistant",
  "Export your data",
];

/** Extra line explaining what the user just bumped into. */
const REASON_KEYS = {
  profiles: "You have reached the profile limit of the free plan.",
  chart: "Longer chart ranges are part of the premium plan.",
  ai: "The assistant is part of the premium plan.",
};

const PaywallModal = ({ visible, onClose, reason }) => {
  const { t } = useTranslation();
  const { isStoreConfigured, restore } = useEntitlements();

  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyPackageId, setBusyPackageId] = useState(null);

  useEffect(() => {
    if (!visible) return undefined;

    let cancelled = false;
    setIsLoading(true);

    getAvailablePackages()
      .then((result) => {
        if (!cancelled) setPackages(result);
      })
      .catch(() => {
        if (!cancelled) setPackages([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handlePurchase = useCallback(
    async (pkg) => {
      setBusyPackageId(pkg.identifier);
      try {
        const { status } = await purchasePackage(pkg);
        if (status === "purchased") {
          onClose();
        }
        // "cancelled" is a normal outcome — the user backed out, no alert.
      } catch (error) {
        Alert.alert(t("Error"), String(error.message));
      } finally {
        setBusyPackageId(null);
      }
    },
    [onClose, t]
  );

  const handleRestore = useCallback(async () => {
    try {
      const premium = await restore();
      if (premium) {
        onClose();
      } else {
        Alert.alert(t("Restore Purchases"), t("No previous purchase found."));
      }
    } catch (error) {
      Alert.alert(t("Error"), String(error.message));
    }
  }, [restore, onClose, t]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{t("Premium")}</Text>
            {reason && REASON_KEYS[reason] && (
              <Text style={styles.reason}>{t(REASON_KEYS[reason])}</Text>
            )}

            <View style={styles.benefits}>
              {BENEFIT_KEYS.map((key) => (
                <View key={key} style={styles.benefitRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.secondary}
                  />
                  <Text style={styles.benefitText}>{t(key)}</Text>
                </View>
              ))}
            </View>

            {!isStoreConfigured ? (
              <Text style={styles.notConfigured}>
                {t(
                  "In-app purchases are not configured in this build. See config/index.js."
                )}
              </Text>
            ) : isLoading ? (
              <ActivityIndicator
                size="large"
                color={colors.icongradient1}
                style={styles.loader}
              />
            ) : packages.length === 0 ? (
              <Text style={styles.notConfigured}>
                {t("No subscription options are available right now.")}
              </Text>
            ) : (
              packages.map((pkg) => (
                <TouchableOpacity
                  key={pkg.identifier}
                  style={styles.packageButton}
                  onPress={() => handlePurchase(pkg)}
                  disabled={busyPackageId != null}
                >
                  {busyPackageId === pkg.identifier ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.packageTitle}>
                        {pkg.product.title}
                      </Text>
                      <Text style={styles.packagePrice}>
                        {pkg.product.priceString}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity onPress={handleRestore} style={styles.restore}>
              <Text style={styles.restoreText}>{t("Restore Purchases")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "88%",
  },
  closeButton: { alignSelf: "flex-end" },
  title: {
    fontSize: 26,
    fontFamily: "Barlow_700Bold",
    color: colors.textPrimary,
  },
  reason: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 6,
  },
  benefits: { marginTop: 20, marginBottom: 24, gap: 10 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  loader: { marginVertical: 24 },
  notConfigured: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: 20,
  },
  packageButton: {
    backgroundColor: colors.addProfilebtnBg,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  packageTitle: {
    color: "white",
    fontSize: 16,
    fontFamily: "Barlow_500Medium",
    flex: 1,
  },
  packagePrice: {
    color: "white",
    fontSize: 17,
    fontFamily: "Barlow_700Bold",
  },
  restore: { paddingVertical: 14, alignItems: "center" },
  restoreText: { color: colors.textSecondary, fontSize: 14 },
});

export default PaywallModal;
