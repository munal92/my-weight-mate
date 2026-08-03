import React, { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Dimensions,
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import colors from "../../styles/colors";

const { width, height } = Dimensions.get("window");
const isShortScreen = height < 700;

const slides = [
  {
    key: "1",
    titleKey: "Weighing Yourself",
    descriptionKey:
      "Start your journey by weighing yourself first! Input your weight, and let the app track your progress.",
    image: require("../../assets/man.png"),
    titleSize: 30,
  },
  {
    key: "2",
    titleKey: "Weighing Your Baby or Pet",
    descriptionKey:
      "Step on the scale with your baby or pet. Input their weight, and the app will calculate the difference.",
    image: require("../../assets/wbaby.png"),
    titleSize: 28,
  },
  {
    key: "3",
    titleKey: "Weight Tracking and Analytics",
    descriptionKey:
      "Track your progress with graphs showing your weight trends over time.",
    image: require("../../assets/phoneInput.png"),
    titleSize: 24,
  },
];

const CarouselComponent = ({ navigation, onFinish }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const listRef = useRef(null);

  const isLastSlide = currentIndex === slides.length - 1;

  const handleFinish = () => {
    if (onFinish) {
      onFinish();
      return;
    }
    navigation.navigate("BottomTabsNavigator");
  };

  const handleNext = () => {
    if (isLastSlide) {
      handleFinish();
      return;
    }
    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  };

  // FlatList reports every partially visible item; take the most visible one.
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderItem = useCallback(
    ({ item }) => (
      <View style={styles.slide}>
        <Image source={item.image} style={styles.image} />
        <Text style={[styles.title, { fontSize: item.titleSize }]}>
          {t(item.titleKey)}
        </Text>
        <Text style={styles.description}>{t(item.descriptionKey)}</Text>
      </View>
    ),
    [t]
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <View
              key={slide.key}
              style={[
                styles.dot,
                index === currentIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.button,
            isLastSlide ? styles.doneButton : styles.nextButton,
          ]}
        >
          <Text style={styles.buttonText}>
            {isLastSlide ? t("Done") : t("Next")}
          </Text>
        </TouchableOpacity>

        {!isLastSlide && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>{t("Skip")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  image: {
    width: 300,
    height: 300,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    color: "black",
    fontWeight: "bold",
    fontFamily: "Barlow_600SemiBold",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    color: "black",
    fontSize: 18,
    textAlign: "center",
    paddingHorizontal: 20,
    fontFamily: "Barlow_400Regular",
  },
  footer: {
    alignItems: "center",
    paddingBottom: isShortScreen ? 24 : 48,
  },
  pagination: {
    flexDirection: "row",
    marginBottom: isShortScreen ? 16 : 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: colors.icongradient2,
  },
  dotInactive: {
    backgroundColor: colors.textSecondary,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderRadius: 5,
  },
  nextButton: {
    backgroundColor: colors.icongradient2,
  },
  doneButton: {
    backgroundColor: "#3b3b3b",
  },
  buttonText: {
    fontSize: 20,
    color: "white",
    fontFamily: "Barlow_500Medium",
  },
  skipButton: {
    marginTop: 12,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontFamily: "Barlow_400Regular",
  },
});

export default CarouselComponent;
