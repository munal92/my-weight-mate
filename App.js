import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import CarouselComponent from "./components/ui/CarouselComponent.js";
import Home from "./screens/Home.js"; // Import the Home component
import LoadingIndicator from "./helpers/LoadingIndicator.js";
import {
  useFonts,
  Barlow_400Regular,
  Barlow_700Bold,
  Barlow_600SemiBold,
  Barlow_500Medium,
} from "@expo-google-fonts/barlow";

const Stack = createStackNavigator();

const App = () => {
  const [fontsLoaded] = useFonts({
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
        initialRouteName="Carousel"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Carousel" component={CarouselComponent} />
        <Stack.Screen name="Home" component={Home} />
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
