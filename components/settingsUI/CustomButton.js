import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import colors from "../../styles/colors";
import { Ionicons } from "@expo/vector-icons";
export default function CustomButton({btnText}) {
  return (
    <Pressable 
      style={({ pressed }) => [
        styles.buttonContainer, 
        pressed && styles.buttonPressed // Apply this style when pressed
      ]}
    >
         <Ionicons name="notifications-outline" size={24} color="white" />
      <Text style={styles.buttonText}>{btnText}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection:"row",
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: colors.textPrimary,
    paddingVertical: 12, // Add padding for better touch area
    paddingHorizontal: 12, // Add padding for better touch area
    borderRadius: 10, // Optional: add rounded corners
    height:60,
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
});
