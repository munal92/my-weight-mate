import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import ProfileCard from "./ProfileCard";

const profiles = [
  { id: "1", name: "Me", avatar_name: "avatar_1" },
  { id: "2", name: "Baby", avatar_name: "avatar_2" },
  { id: "3", name: "Cat", avatar_name: "avatar_cat_1" },
];

export default function ProfilesList() {
  return (
    <View style={styles.container}>
      <FlatList
        data={profiles}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfileCard user_profile={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 24,
  },
});
