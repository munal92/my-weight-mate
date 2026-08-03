import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { I18nextProvider, useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Dimensions } from "react-native";
import {
  useFonts,
  Barlow_300Light,
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from "@expo-google-fonts/barlow";

import CarouselComponent from "./components/ui/CarouselComponent.js";
import Home from "./screens/Home.js";
import ProfilesScreen from "./screens/ProfilesScreen.js";
import SettingsScreen from "./screens/SettingsScreen.js";
import ProfileDetailScreen from "./screens/ProfileDetailScreen.js";
import ProfileEditScreen from "./screens/ProfileEditScreen.js";
import LoadingIndicator from "./helpers/LoadingIndicator.js";
import i18next from "./i18n";
import colors from "./styles/colors.js";
import { getDb } from "./db/database";
import { ProfilesProvider } from "./state/ProfilesContext";
import { EntitlementsProvider } from "./state/EntitlementsContext";

const screenHeight = Dimensions.get("window").height;
const ONBOARDING_KEY = "hasSeenOnboarding";

const BottomTabs = createBottomTabNavigator();
const Stack = createStackNavigator();

function BottomTabsNavigator() {
  const { t } = useTranslation();

  return (
    <BottomTabs.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bottomTabBlack,
          borderTopRightRadius: 30,
          borderTopLeftRadius: 30,
          height: (20 * screenHeight) / 200,
          paddingTop: (3 * screenHeight) / 200,
        },
        tabBarActiveTintColor: colors.background,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <BottomTabs.Screen
        name="Profiles"
        component={ProfilesScreen}
        options={{
          title: t("Profiles"),
          tabBarLabel: t("Profiles"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-sharp" size={28} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="Home"
        component={Home}
        options={{
          title: t("Home"),
          tabBarLabel: t("Home"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
      />
      <BottomTabs.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t("Settings"),
          tabBarLabel: t("Settings"),
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={28} color={color} />
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

const App = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(null);
  const [startupError, setStartupError] = useState(null);

  const [fontsLoaded] = useFonts({
    Barlow_300Light,
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // getDb() opens the connection and runs any pending migrations.
        await getDb();
        const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (cancelled) return;
        setHasSeenOnboarding(seen === "true");
        setIsDbReady(true);
      } catch (error) {
        if (!cancelled) setStartupError(error);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch {
      // Worst case the intro shows once more; not worth blocking on.
    }
  }, []);

  if (startupError) {
    return <LoadingIndicator message={String(startupError.message)} />;
  }

  if (!fontsLoaded || !isDbReady || hasSeenOnboarding === null) {
    return <LoadingIndicator />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nextProvider i18n={i18next}>
          <EntitlementsProvider>
            <ProfilesProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  {!hasSeenOnboarding && (
                    <Stack.Screen name="Carousel">
                      {(props) => (
                        <CarouselComponent
                          {...props}
                          onFinish={completeOnboarding}
                        />
                      )}
                    </Stack.Screen>
                  )}
                  <Stack.Screen
                    name="BottomTabsNavigator"
                    component={BottomTabsNavigator}
                  />
                  <Stack.Screen
                    name="ProfileDetail"
                    component={ProfileDetailScreen}
                  />
                  <Stack.Screen
                    name="ProfileEdit"
                    component={ProfileEditScreen}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </ProfilesProvider>
          </EntitlementsProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
