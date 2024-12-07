import React from "react";
import { StyleSheet } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

import "moment/locale/tr";
import "moment/locale/es";
import colors from "../../styles/colors";

// Screen width
const screenWidth = Dimensions.get("window").width;

function GraphView({
  graphData,
  paddingR = 50,
  paddingL = 40,
  graphBgColor = "transparent",
  labelTextColor = "black",
  gridColor = "black",
  lineColor = colors.secondary,
  dotColor = "white",
  graphPadding = 0,
}) {
  return (
    <LineChart
      data={graphData}
      width={screenWidth - 25}
      height={220}
      style={{
        borderRadius: 10, // Add border radius
        overflow: "hidden", // Ensure content inside follows border radius
        shadowColor: "black", // Remove shadow for iOS
        elevation: 0, // Remove shadow for Android
        // backgroundColor: "#333333",
        alignItems: "center",
        paddingRight: paddingR,
        paddingLeft: paddingL,
        padding: graphPadding,
        backgroundColor: graphBgColor,
      }}
      chartConfig={{
        labelColor: () => labelTextColor, // Text color for labels

        propsForBackgroundLines: {
          stroke: gridColor, // Set the color for horizontal grid lines

          strokeWidth: 1, // Optional: Adjust thickness of lines
          strokeDasharray: "4, 4", // Optional: Dashed horizontal lines
        },

        backgroundGradientFrom: "black", // Background gradient start color
        backgroundGradientTo: "black", // Background gradient end color
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        fillShadowGradient: "black", // Removes gradient below the line
        fillShadowGradientOpacity: 0, // Fully transparent fill gradient
        fillShadowGradientToOpacity: 0,

        decimalPlaces: 1,
        color: () => lineColor, // Line color
        propsForDots: {
          r: "3", // Dot radius
          strokeWidth: "4", // Removes border from dots
          opacity: "0.4",
          stroke: dotColor, // Ensures no shadow around dots
        },
      }}
      bezier={true} // Ensure no smoothing effect adds artifacts
      withInnerLines={true} // Ensure horizontal grid lines are shown
      withOuterLines={false} // Optional: Remove outer border lines
      withVerticalLines={false} // Disable vertical lines
      withHorizontalLines={true} // Ensure horizontal lines are displayed
      onDataPointClick={(data) => handleDataPointClick(data)}
    />
  );
}

const styles = StyleSheet.create({});

export default GraphView;
