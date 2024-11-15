import React, { useLayoutEffect, useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import LoadingIndicator from "../helpers/LoadingIndicator";
const Home = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  useLayoutEffect(() => {
    setTimeout(() => {
      setIsLoading(false); // Hide loading indicator after 5 seconds
      navigation.navigate("Home");
    }, 4000); // 5000 milliseconds = 5 seconds
  }, []);

  if (isLoading) {
    return <LoadingIndicator message={"Loading..."} />;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to the Home Page!</Text>
      <Button
        title="Go to Carousel"
        onPress={() => navigation.navigate("Carousel")} // To navigate back if needed
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default Home;
