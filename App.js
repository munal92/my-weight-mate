import React, { useLayoutEffect, useState } from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CarouselComponent from "./components/ui/CarouselComponent.js";
import Home from "./screens/Home.js"; // Import the Home component
import ProfilesScreen from "./screens/ProfilesScreen.js";
import SettingsScreen from "./screens/SettingsScreen.js";
import LoadingIndicator from "./helpers/LoadingIndicator.js";
import {
  useFonts,
  Barlow_300Light,
  Barlow_400Regular,
  Barlow_700Bold,
  Barlow_600SemiBold,
  Barlow_500Medium,
} from "@expo-google-fonts/barlow";
import { Ionicons } from "@expo/vector-icons";
import { I18nextProvider } from "react-i18next";
import i18next from "./i18n";
import { useTranslation } from "react-i18next";
import colors from "./styles/colors.js";

import { Dimensions } from "react-native";

// Screen width
const screenHeight = Dimensions.get("window").height;

const BottomTabs = createBottomTabNavigator();
const Stack = createStackNavigator();

function BottomTabsNavigator({ isLoading, setIsLoading }) {
  const { t, i18n } = useTranslation();
  return (
    <BottomTabs.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name="home"
            size={26} // Increase icon size
            color={color}
          />
        ),
        tabBarStyle: {
          display: isLoading ? "none" : "flex", // Hide tab bar when loading
          backgroundColor: colors.bottomTabBlack,
          borderTopRightRadius: 30,
          borderTopLeftRadius: 30,
          height: (20 * screenHeight) / 200, // Increase height of the tab bar
          paddingTop: (3 * screenHeight) / 200,
        },
        tabBarActiveTintColor: colors.background, // Set color when the tab is selected
        tabBarInactiveTintColor: colors.textSecondary, // Set color when the tab is unselected
      }}
    >
      <BottomTabs.Screen
        name="Profiles" // Static screen name
        component={ProfilesScreen}
        options={{
          headerShown: false,
          title: t("Profiles"),
          tabBarLabel: t("Profiles"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-sharp" size={28} color={color} /> // Increased size
          ),
        }}
      />
      <BottomTabs.Screen
        name="Home" // Static screen name
        options={{
          headerShown: false,
          title: t("Home"),
          tabBarLabel: t("Home"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={28} color={color} /> // Increased size
          ),
        }}
      >
        {(props) => (
          <Home {...props} isLoading={isLoading} setIsLoading={setIsLoading} />
        )}
      </BottomTabs.Screen>
      <BottomTabs.Screen
        name="Settings" // Static screen name
        component={SettingsScreen}
        options={{
          headerShown: false,
          title: t("Settings"),
          tabBarLabel: t("Settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={28} color={color} /> // Increased size
          ),
        }}
      />
    </BottomTabs.Navigator>
  );
}

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useFonts({
    Barlow_300Light,
    Barlow_400Regular,
    Barlow_700Bold,
    Barlow_600SemiBold,
    Barlow_500Medium,
  });

  // Render a loading screen while the fonts are loading
  if (!fontsLoaded) {
    return <LoadingIndicator />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        // initialRouteName="Carousel"
        screenOptions={{ headerShown: false }}
      >
        {/* <Stack.Screen name="Carousel" component={CarouselComponent} /> */}
        <Stack.Screen
          name="BottomTabsNavigator"
          options={{ headerShown: false }}
        >
          {(props) => (
            <BottomTabsNavigator
              {...props}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

// Barlow_100Thin - Extra thin
// Barlow_200ExtraLight - Very light
// Barlow_300Light - Light
// Barlow_400Regular - Regular (normal weight)
// Barlow_500Medium - Medium weight
// Barlow_600SemiBold - Semi-bold
// Barlow_700Bold - Bold
// Barlow_800ExtraBold - Extra bold
// Barlow_900Black - Black (heaviest weight)
