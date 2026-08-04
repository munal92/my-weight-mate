import Purchases, { LOG_LEVEL } from "react-native-purchases";

import {
  DEFAULT_OFFERING_ID,
  PREMIUM_ENTITLEMENT_ID,
  REVENUECAT_API_KEY,
  isPurchasesConfigured,
} from "../config";

/**
 * Thin wrapper around RevenueCat.
 *
 * Every function is safe to call when no API key is configured — it resolves to
 * a "not premium, nothing for sale" result instead of throwing. That keeps the
 * app fully usable during development and for anyone running it before the
 * store products exist, without scattering `if (configured)` checks through the
 * UI.
 *
 * In Expo Go the native module is unavailable and the SDK falls back to its
 * Preview API Mode, so the app still loads; real purchases only work in a
 * development build or a store build.
 */

let configurePromise = null;

export const configurePurchases = async () => {
  if (!isPurchasesConfigured()) return false;

  if (!configurePromise) {
    configurePromise = (async () => {
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.WARN);
      }
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      return true;
    })().catch((error) => {
      configurePromise = null;
      throw error;
    });
  }

  return configurePromise;
};

const hasPremium = (customerInfo) =>
  Boolean(customerInfo?.entitlements?.active?.[PREMIUM_ENTITLEMENT_ID]);

export const getPremiumStatus = async () => {
  if (!isPurchasesConfigured()) return false;
  await configurePurchases();
  const customerInfo = await Purchases.getCustomerInfo();
  return hasPremium(customerInfo);
};

/**
 * Subscribes to entitlement changes. Returns an unsubscribe function, or a
 * no-op when purchases are not configured.
 */
export const onPremiumStatusChange = (listener) => {
  if (!isPurchasesConfigured()) return () => {};

  const handler = (customerInfo) => listener(hasPremium(customerInfo));
  Purchases.addCustomerInfoUpdateListener(handler);
  return () => Purchases.removeCustomerInfoUpdateListener(handler);
};

/** Returns the packages to show on the paywall, or [] when unavailable. */
export const getAvailablePackages = async () => {
  if (!isPurchasesConfigured()) return [];
  await configurePurchases();

  const offerings = await Purchases.getOfferings();
  const offering = DEFAULT_OFFERING_ID
    ? offerings.all?.[DEFAULT_OFFERING_ID]
    : offerings.current;

  return offering?.availablePackages ?? [];
};

/**
 * @returns {Promise<{status: 'purchased'|'cancelled'|'unavailable'}>}
 * Cancellation is a normal outcome, not an error, so it is reported in the
 * result rather than thrown — the caller should not show an error alert when a
 * user simply backs out of the store sheet.
 */
export const purchasePackage = async (packageToBuy) => {
  if (!isPurchasesConfigured()) return { status: "unavailable" };
  await configurePurchases();

  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
    return { status: hasPremium(customerInfo) ? "purchased" : "cancelled" };
  } catch (error) {
    if (error?.userCancelled) return { status: "cancelled" };
    throw error;
  }
};

export const restorePurchases = async () => {
  if (!isPurchasesConfigured()) return false;
  await configurePurchases();
  const customerInfo = await Purchases.restorePurchases();
  return hasPremium(customerInfo);
};

/**
 * The app-user id RevenueCat assigned. The AI proxy uses it to verify the
 * caller actually holds the premium entitlement before spending tokens.
 */
export const getAppUserId = async () => {
  if (!isPurchasesConfigured()) return null;
  await configurePurchases();
  return Purchases.getAppUserID();
};
