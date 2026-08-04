import { Platform } from "react-native";

/**
 * Build-time configuration.
 *
 * Expo inlines any variable prefixed with EXPO_PUBLIC_ into the JS bundle, so
 * everything here ends up readable by anyone who downloads the app. That is
 * fine for the values below and NOT fine for anything else:
 *
 *   - RevenueCat SDK keys are public by design. They identify the app to
 *     RevenueCat and cannot be used to grant entitlements or read other users'
 *     data.
 *   - AI_PROXY_URL is just an endpoint. The OpenAI key it uses lives on the
 *     server and never reaches the device — see server/ai-proxy/README.md.
 *
 * Never add a provider secret (OpenAI, Anthropic, a database URL) here. It
 * would ship inside the bundle and be trivially extractable from the .ipa/.aab.
 */

const readEnv = (value) => {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

export const REVENUECAT_API_KEY = Platform.select({
  ios: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
  android: readEnv(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
  default: null,
});

/** RevenueCat entitlement identifier configured in the dashboard. */
export const PREMIUM_ENTITLEMENT_ID =
  readEnv(process.env.EXPO_PUBLIC_PREMIUM_ENTITLEMENT_ID) ?? "premium";

/** Offering identifier to present on the paywall. */
export const DEFAULT_OFFERING_ID = readEnv(
  process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID
);

export const AI_PROXY_URL = readEnv(process.env.EXPO_PUBLIC_AI_PROXY_URL);

export const isPurchasesConfigured = () => REVENUECAT_API_KEY != null;
export const isAiConfigured = () => AI_PROXY_URL != null;

/**
 * Free-tier limits. Kept in one place so the paywall copy and the enforcement
 * can never drift apart.
 */
export const FREE_TIER = {
  maxProfiles: 2,
  /** Chart ranges a free user can switch to. */
  chartPeriods: ["weekly", "monthly"],
};
