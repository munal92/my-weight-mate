import React, { useState } from "react";
import { StyleSheet, Dimensions, View } from "react-native";
import Carousel from "react-native-intro-carousel";
import colors from "../../styles/colors";

const { width, height } = Dimensions.get("window");

const CarouselComponent = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePageChange = (index) => {
    setCurrentIndex(index);
  };

  // Adjust padding and margin based on screen width and height
  const dynamicDescriptionStyle = {
    bottomOffset: { bottomOffset: height < 700 ? 40 : 10 },
    marginBottom: { marginBottom: height < 700 ? 90 : 50 },
  };

  const handleFinishCarousel = () => {
    // Navigate to the Home screen when the carousel is finished

    navigation.navigate("Home");
  };

  return (
    <View style={styles.container}>
      <Carousel
        data={[
          {
            key: "1",
            title: "Weighing Yourself",
            description:
              "Start your journey by weighing yourself first! Input your weight, and let the app track your progress.",
            backgroundColor: "#fff",
            image: require("../../assets/man.png"),
            titleStyle: {
              color: "black",
              fontSize: 30,
              fontWeight: "bold",
              fontFamily: "Barlow_600SemiBold",
            },
            descriptionStyle: {
              color: "black",
              fontSize: 18, // Increased font size for description
              textAlign: "center", // Optional: center-align the text
              paddingHorizontal: 30, // Optional: add some horizontal padding to prevent text from touching edges
              fontFamily: "Barlow_400Regular",
              ...dynamicDescriptionStyle.marginBottom,
            },
            imageStyle: {
              width: 300, // Increased image width
              height: 300, // Increased image height
              resizeMode: "contain",
              marginBottom: 20,
            },
          },
          {
            key: "2",
            title: "Weighing Your Baby or Pet",
            description:
              "Step on the scale with your baby or pet. Input their weight, and the app will calculate the difference.",
            backgroundColor: "#fff",
            image: require("../../assets/wbaby.png"),
            titleStyle: {
              color: "black",
              fontSize: 28,
              fontWeight: "bold",
              fontFamily: "Barlow_600SemiBold",
            },
            descriptionStyle: {
              color: "black",
              fontSize: 18, // Increased font size for description
              textAlign: "center",
              paddingHorizontal: 20,
              fontFamily: "Barlow_400Regular",
              ...dynamicDescriptionStyle.marginBottom,
            },
            imageStyle: {
              width: 300, // Increased image width
              height: 300, // Increased image height
              resizeMode: "contain",
              marginBottom: 20,
            },
          },
          {
            key: "3",
            title: "Weight Tracking and Analytics",
            description:
              "Track your progress with graphs showing your weight trends over time.",
            backgroundColor: "#fff",
            image: require("../../assets/phoneInput.png"),
            titleStyle: {
              color: "black",
              fontSize: 24,
              fontWeight: "bold",
              fontFamily: "Barlow_600SemiBold",
            },
            descriptionStyle: {
              color: "black",
              fontSize: 18, // Increased font size for description
              textAlign: "center",
              paddingHorizontal: 20,
              fontFamily: "Barlow_400Regular",
              ...dynamicDescriptionStyle.marginBottom,
            },
            imageStyle: {
              width: 300, // Increased image width
              height: 300, // Increased image height
              resizeMode: "contain",
              marginBottom: 20,
            },
          },
        ]}
        onPageChange={handlePageChange}
        paginationConfig={{
          dotSize: 8,
          color: colors.textSecondary,
          activeDotStyle: {
            backgroundColor: colors.icongradient2, // Active dot color
          },
          ...dynamicDescriptionStyle.bottomOffset,
        }}
        buttonsConfig={{
          useBottomButtons: true,

          next: {
            label: "Next",
            textStyle: {
              fontSize: 20,
              color: "white",
              fontFamily: "Barlow_500Medium",
            },
            buttonStyle: {
              backgroundColor: colors.icongradient2,
              padding: 10,
              borderRadius: 5,
              marginTop: 30,
            },
          },
          done: {
            label: "Done",
            textStyle: {
              fontSize: 20,
              color: "white",
              fontFamily: "Barlow_500Medium",
            },
            buttonStyle: {
              backgroundColor: "#3b3b3b",
              padding: 10,
              borderRadius: 5,
            },
          },
        }}
        onFinish={() => handleFinishCarousel()} // Navigate to Home when on the last page
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start", // Ensure content is aligned to the top
    paddingBottom: height < 700 ? 0 : 100,
    backgroundColor: "#fff",
  },
});

export default CarouselComponent;
