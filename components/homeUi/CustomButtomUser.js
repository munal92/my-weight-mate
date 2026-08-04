import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import colors from "../../styles/colors";

export default function CustomButtonUser({
  btnText,
  styleBtn,
  onPress,
  disabled = false,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={btnText}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.buttonContainer,
        styleBtn,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonText}>{btnText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection:"row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.iconfontcolor,
    paddingVertical: 10, // Add padding for better touch area
    paddingHorizontal: 10, // Add padding for better touch area
    borderRadius: 10, // Optional: add rounded corners
    height:42,
    marginVertical:10
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
    marginLeft:20
  },
  buttonPressed: {
    opacity: 0.7, // Reduces opacity when pressed, giving it a "pressed" effect
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
