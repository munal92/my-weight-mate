import React from "react";
import { View, Text, ActivityIndicator, Image, StyleSheet } from "react-native";
import colors from "../styles/colors";
//import { SvgUri } from "react-native-svg";
const { uri } = Image.resolveAssetSource(require("../assets/default.png"));

const LoadingIndicator = ({ message, showLogo = true }) => {
  return (
    <View style={styles.container}>
      {showLogo && (
        // <SvgUri
        //   uri={uri}
        //   width="260" // Set your desired width
        //   height="100" // Set your desired height
        // />
        <Image
          source={{ uri }}
          style={styles.logo} // Define your desired styles for the image here
        />
      )}

      <ActivityIndicator size="large" color={colors.icongradient2} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background, // Optional: Slightly transparent background
  },
  logo: {
    width: 400,
    height: 100,
    marginBottom: 16,
  },
  message: {
    marginTop: 16,
    fontSize: 18,
    textAlign: "center",
    fontFamily: "Barlow_400Regular",
    marginLeft: 14,
    color: "#333",
  },
});

export default LoadingIndicator;
