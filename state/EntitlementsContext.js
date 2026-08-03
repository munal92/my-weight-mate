import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { FREE_TIER, isPurchasesConfigured } from "../config";
import {
  configurePurchases,
  getPremiumStatus,
  onPremiumStatusChange,
  restorePurchases,
} from "../services/purchases";

/**
 * Who is allowed to do what.
 *
 * The gate checks live here rather than in the screens so that changing the
 * free tier means editing config/index.js, not hunting for `isPremium` checks.
 */

const EntitlementsContext = createContext(null);

export const EntitlementsProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isReady, setIsReady] = useState(!isPurchasesConfigured());

  useEffect(() => {
    if (!isPurchasesConfigured()) return undefined;

    let cancelled = false;
    let unsubscribe = () => {};

    const bootstrap = async () => {
      try {
        await configurePurchases();
        const premium = await getPremiumStatus();
        if (cancelled) return;
        setIsPremium(premium);
        unsubscribe = onPremiumStatusChange(setIsPremium);
      } catch {
        // A store outage must never block the app; the user stays on the free
        // tier until the next successful check.
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const restore = useCallback(async () => {
    const premium = await restorePurchases();
    setIsPremium(premium);
    return premium;
  }, []);

  const value = useMemo(
    () => ({
      isPremium,
      isReady,
      isStoreConfigured: isPurchasesConfigured(),
      restore,

      /** Free users may keep FREE_TIER.maxProfiles profiles. */
      canAddProfile: (currentCount) =>
        isPremium || currentCount < FREE_TIER.maxProfiles,

      /** Long-range charts (3 months, yearly) are premium. */
      canUseChartPeriod: (period) =>
        isPremium || FREE_TIER.chartPeriods.includes(period),

      /** The AI assistant is premium-only. */
      canUseAiCoach: () => isPremium,

      freeTier: FREE_TIER,
    }),
    [isPremium, isReady, restore]
  );

  return (
    <EntitlementsContext.Provider value={value}>
      {children}
    </EntitlementsContext.Provider>
  );
};

export const useEntitlements = () => {
  const context = useContext(EntitlementsContext);
  if (!context) {
    throw new Error(
      "useEntitlements must be used inside an EntitlementsProvider"
    );
  }
  return context;
};
