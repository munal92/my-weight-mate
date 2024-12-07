import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Avatar1 from "../../assets/avatar_1.svg";
import Avatar2 from "../../assets/avatar_2.svg";
import Avatar3 from "../../assets/avatar_3.svg";
import Avatar4 from "../../assets/avatar_4.svg";
import Avatar5 from "../../assets/avatar_5.svg";
import AvatarCat1 from "../../assets/avatar_cat_1.svg";
import colors from "../../styles/colors";
import GraphView from "./GraphView";
import WeightGraphScreen from "./WeightGraphScreen";

const avatars = {
  avatar_1: Avatar1,
  avatar_2: Avatar2,
  avatar_3: Avatar3,
  avatar_cat_1: AvatarCat1,
};

const mockData = [
  { date: "2024-05-01", weight: 70 },
  { date: "2024-05-07", weight: 71 },
  { date: "2024-05-15", weight: 69 },
  { date: "2024-05-22", weight: 72 },
  { date: "2024-06-01", weight: 70 },
  { date: "2024-06-10", weight: 68 },
  { date: "2024-06-15", weight: 70 },
  { date: "2024-06-25", weight: 71 },
  { date: "2024-07-05", weight: 69 },
  { date: "2024-07-10", weight: 68 },
  { date: "2024-08-01", weight: 71 },
  { date: "2024-08-15", weight: 70 },
  { date: "2024-08-20", weight: 72 },
  { date: "2024-09-01", weight: 73 },
  { date: "2024-09-05", weight: 74 },
  { date: "2024-09-15", weight: 72 },
  { date: "2024-10-15", weight: 72 },
  { date: "2024-11-13", weight: 69.8 },
  { date: "2024-11-14", weight: 69.9 },
  { date: "2024-11-15", weight: 70.1 },
  { date: "2024-11-16", weight: 70.2 },
  { date: "2024-11-24", weight: 70.3 },
  { date: "2024-11-26", weight: 70.4 },
  { date: "2024-11-27", weight: 70.5 },
  { date: "2024-11-20", weight: 70.6 },
  { date: "2024-12-20", weight: 70.6 },
];

export default function ProfileCard({ user_profile }) {
  const AvatarSvg = avatars[user_profile.avatar_name] || avatars.avatar_1;

  return (
    <View style={styles.card}>
      <View style={styles.topContainer}>
        <View style={styles.avatarContainer}>
          <AvatarSvg width={74} height={74} style={styles.avatar} />
          <Text style={styles.name}>{user_profile.name}</Text>
        </View>
        <View style={styles.topWeightContainer}>
          <View style={styles.weightTextContainer}>
            <Text style={styles.topTextStyle}>Start</Text>
            <Text style={styles.topTextStyle}>1,8 kg</Text>
          </View>
          <View style={{ width: 2, backgroundColor: "#ccc", height: "100%" }} />
          <View style={styles.weightTextContainer}>
            <Text style={styles.topTextStyle}>Current</Text>
            <Text style={styles.topTextStyle}>1,5 kg</Text>
          </View>
          <View style={{ width: 2, backgroundColor: "#ccc", height: "100%" }} />
          <View style={styles.weightTextContainer}>
            <Text style={styles.topTextStyle}>Last</Text>
            <Text style={styles.topTextStyle}>1,3 kg</Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginVertical: 20,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600" }}>
            My Weight Overview
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              textDecorationLine: "underline",
            }}
          >
            See All
          </Text>
        </View>
        <WeightGraphScreen isJustYearly={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 20,
    // backgroundColor: "#fff",
    // borderRadius: 8,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 2,
  },
  avatar: {
    // width: 74,
    // height: 74,
    borderRadius: 10,
    borderColor: "black",
    borderWidth: 2,
  },
  name: {
    fontSize: 16,
    //fontWeight: "bold",
    color: "#333",
  },

  avatarContainer: {
    justifyContent: "center", // Centers vertically
    alignItems: "center", // Centers horizontally
    flexDirection: "column", // Stacks items vertically
  },
  topContainer: {
    flexDirection: "row",
  },

  topWeightContainer: {
    backgroundColor: colors.profileGraphbg,
    flexDirection: "row",
    flex: 2,
    marginBottom: 20,
    marginLeft: 20,
    borderRadius: 10,
    padding: 10,
    // width: 254,
    // height: 74,
  },
  topTextStyle: {
    color: "white",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
  },
  weightTextContainer: {
    flex: 1,
    justifyContent: "center", // Centers vertically
  },

  bottomContainer: {},
});
