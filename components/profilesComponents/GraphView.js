import React from "react";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

import colors from "../../styles/colors";

const screenWidth = Dimensions.get("window").width;

/**
 * Presentational wrapper around chart-kit's LineChart.
 *
 * `onDataPointClick` used to call an undefined `handleDataPointClick` that
 * lived in the parent module's scope, so tapping any point threw a
 * ReferenceError. It is a prop now, and optional.
 */
function GraphView({
  graphData,
  onDataPointClick,
  decimals = 1,
  paddingR = 50,
  paddingL = 40,
  graphBgColor = "transparent",
  labelTextColor = "black",
  gridColor = "black",
  lineColor = colors.secondary,
  dotColor = "white",
  graphPadding = 0,
  height = 220,
}) {
  return (
    <LineChart
      data={graphData}
      width={screenWidth - 25}
      height={height}
      style={{
        borderRadius: 10,
        overflow: "hidden",
        alignItems: "center",
        paddingRight: paddingR,
        paddingLeft: paddingL,
        padding: graphPadding,
        backgroundColor: graphBgColor,
      }}
      chartConfig={{
        labelColor: () => labelTextColor,
        propsForBackgroundLines: {
          stroke: gridColor,
          strokeWidth: 1,
          strokeDasharray: "4, 4",
        },
        backgroundGradientFrom: "black",
        backgroundGradientTo: "black",
        backgroundGradientFromOpacity: 0,
        backgroundGradientToOpacity: 0,
        fillShadowGradient: "black",
        fillShadowGradientOpacity: 0,
        fillShadowGradientToOpacity: 0,
        decimalPlaces: decimals,
        color: () => lineColor,
        propsForDots: {
          r: "3",
          strokeWidth: "4",
          opacity: "0.4",
          stroke: dotColor,
        },
      }}
      bezier
      withInnerLines
      withOuterLines={false}
      withVerticalLines={false}
      withHorizontalLines
      onDataPointClick={onDataPointClick}
    />
  );
}

export default GraphView;
