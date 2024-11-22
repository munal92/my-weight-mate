import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  FlatList,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import moment from "moment";
import colors from "../../styles/colors";

// Screen width
const screenWidth = Dimensions.get("window").width;

// Mock data for weight tracking
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
  { date: "2024-11-13", weight: 69.8 },
  { date: "2024-11-14", weight: 69.9 },
  { date: "2024-11-15", weight: 70.1 },
  { date: "2024-11-16", weight: 70.2 },
  { date: "2024-11-17", weight: 70.3 },
  { date: "2024-11-18", weight: 70.4 },
  { date: "2024-11-19", weight: 70.5 },
  { date: "2024-11-20", weight: 70.6 },
];

const WeightGraphScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [filteredData, setFilteredData] = useState(mockData);
  const { t, i18n } = useTranslation();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(moment());
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [currentYear, setCurrentYear] = useState(moment().year());
  const [current3Months, setCurrent3Months] = useState(
    moment().startOf("month").subtract(2, "months")
  );

  // Filter data based on selected period
  const filterData = (period) => {
    let filtered = [...mockData];

    switch (period) {
      case "weekly": {
        const startOfWeek = currentWeek.clone().startOf("isoWeek");
        const endOfWeek = currentWeek.clone().endOf("isoWeek");
        filtered = filtered.filter((entry) => {
          const entryDate = moment(entry.date);
          return entryDate.isBetween(startOfWeek, endOfWeek, null, "[]");
        });
        break;
      }
      case "monthly": {
        const startOfMonth = currentMonth.clone().startOf("month");
        const endOfMonth = currentMonth.clone().endOf("month");
        filtered = filtered.filter((entry) => {
          const entryDate = moment(entry.date);
          return entryDate.isBetween(startOfMonth, endOfMonth, null, "[]");
        });
        break;
      }
      case "3months": {
        const startOf3Months = current3Months.clone().startOf("month");
        const endOf3Months = current3Months
          .clone()
          .add(2, "months")
          .endOf("month");
        filtered = filtered.filter((entry) => {
          const entryDate = moment(entry.date);
          return entryDate.isBetween(startOf3Months, endOf3Months, null, "[]");
        });
        break;
      }
      case "yearly": {
        filtered = filtered.filter((entry) => {
          const entryDate = moment(entry.date);
          return entryDate.year() === currentYear;
        });
        break;
      }
      default:
        break;
    }

    // setFilteredData(filtered);
    setFilteredData(
      filtered.filter(
        (entry) => typeof entry.weight === "number" && isFinite(entry.weight)
      )
    );
  };

  useEffect(() => {
    filterData(selectedPeriod);
  }, [selectedPeriod, currentWeek, currentMonth, currentYear, current3Months]);

  // Format the date for labels
  const formatDate = (date1) => {
    const date = moment(date1);
    if (i18n.language !== "en") {
      return date.format("DD/MM");
    }
    return date.format("MM/DD");
  };

  // Change the week, month, or year
  const changeWeek = (direction) => {
    setCurrentWeek(currentWeek.clone().add(direction, "week"));
  };

  const changeMonth = (direction) => {
    setCurrentMonth(currentMonth.clone().add(direction, "month"));
  };

  const changeYear = (direction) => {
    setCurrentYear(currentYear + direction);
  };

  const change3Months = (direction) => {
    setCurrent3Months(current3Months.clone().add(direction, "months"));
  };

  // Graph data for rendering the chart
  const graphData = {
    labels: filteredData.map((entry) => formatDate(entry.date)),
    datasets: [
      {
        data: filteredData
          .filter(
            (entry) =>
              typeof entry.weight === "number" && isFinite(entry.weight)
          )
          .map((entry) => entry.weight),
      },
    ],
  };

  // Handle data point click to show more details
  const handleDataPointClick = (data) => {
    setSelectedPoint(data);
    Alert.alert(
      "Weight Value",
      `Date: ${data.indexLabel}\nWeight: ${data.value}`
    );
  };

  // Render period label
  const renderPeriodLabel = () => {
    if (selectedPeriod === "weekly") {
      const startOfWeek = currentWeek
        .clone()
        .startOf("isoWeek")
        .format("MMM D");
      const endOfWeek = currentWeek.clone().endOf("isoWeek").format("MMM D");
      return `${startOfWeek} - ${endOfWeek}`;
    }
    if (selectedPeriod === "monthly") {
      return currentMonth.format("MMMM YYYY");
    }
    if (selectedPeriod === "3months") {
      const startMonth = current3Months.clone().format("MMM");
      const endMonth = current3Months.clone().add(2, "months").format("MMM");
      return `${startMonth}-${endMonth}`;
    }
    if (selectedPeriod === "yearly") {
      return `${currentYear}`;
    }
  };

  const renderCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.weight}>{item.weight} kg</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: "flex-start", padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Weight Tracker</Text>

      {/* Period buttons */}
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        {["weekly", "monthly", "3months", "yearly"].map((period) => (
          <TouchableOpacity
            key={period}
            style={{
              marginRight: 20,
              padding: 10,
              backgroundColor:
                selectedPeriod === period ? "#4CAF50" : "#97B098",
              borderRadius: 5,
            }}
            onPress={() => {
              setSelectedPeriod(period);
              filterData(period);
            }}
          >
            <Text style={{ color: "#fff" }}>
              {t(period.charAt(0).toUpperCase() + period.slice(1))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData} // Pass your data here
        renderItem={renderCard} // Card rendering function
        keyExtractor={(item, index) => index.toString()} // Unique key for each item
        contentContainerStyle={styles.listContainer} // Styling for the list container
        ListHeaderComponent={
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: "#4CAF50",
                  borderRadius: 5,
                }}
                onPress={() => {
                  if (selectedPeriod === "weekly") changeWeek(-1);
                  else if (selectedPeriod === "monthly") changeMonth(-1);
                  else if (selectedPeriod === "yearly") changeYear(-1);
                  else if (selectedPeriod === "3months") change3Months(-3);
                  filterData(selectedPeriod);
                }}
              >
                <Text style={{ color: "#fff" }}>{"<"}</Text>
              </TouchableOpacity>

              <Text style={{ flex: 1, textAlign: "center", fontSize: 16 }}>
                {renderPeriodLabel()}
              </Text>

              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor: "#4CAF50",
                  borderRadius: 5,
                }}
                onPress={() => {
                  if (selectedPeriod === "weekly") changeWeek(1);
                  else if (selectedPeriod === "monthly") changeMonth(1);
                  else if (selectedPeriod === "yearly") changeYear(1);
                  else if (selectedPeriod === "3months") change3Months(3);
                  filterData(selectedPeriod);
                }}
              >
                <Text style={{ color: "#fff" }}>{">"}</Text>
              </TouchableOpacity>
            </View>
            {filteredData.length === 0 ? (
              <Text>No data found for this period</Text>
            ) : (
              <LineChart
                data={graphData}
                width={screenWidth - 45}
                height={220}
                style={{
                  borderRadius: 10, // Add border radius
                  overflow: "hidden", // Ensure content inside follows border radius
                  shadowColor: "transparent", // Remove shadow for iOS
                  elevation: 0, // Remove shadow for Android
                  backgroundColor: "#333333",
                  paddingTop: 14,
                  marginBottom: 14,
                }}
                chartConfig={{
                  labelColor: () => "#ffffff", // Text color for labels
                  propsForBackgroundLines: {
                    stroke: "transparent", // Removes grid lines
                  },

                  backgroundGradientFrom: "#333333", // Background gradient start color
                  backgroundGradientTo: "#333333", // Background gradient end color
                  backgroundGradientFromOpacity: 0,
                  backgroundGradientToOpacity: 0,
                  fillShadowGradient: "transparent", // Removes gradient below the line
                  fillShadowGradientOpacity: 0, // Fully transparent fill gradient
                  fillShadowGradientToOpacity: 0,

                  decimalPlaces: 1,
                  color: () => colors.secondary, // Line color
                  propsForDots: {
                    r: "3", // Dot radius
                    strokeWidth: "0", // Removes border from dots
                    stroke: "transparent", // Ensures no shadow around dots
                  },
                }}
                bezier={false} // Ensure no smoothing effect adds artifacts
                withInnerLines={false} // Explicitly remove inner grid lines
                withOuterLines={false} // Explicitly remove outer grid lines
                onDataPointClick={(data) => handleDataPointClick(data)}
              />
            )}
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {},
  card: {
    backgroundColor: "#f8f8f8", // Light background for the card
    padding: 16, // Inner padding for content
    marginBottom: 12, // Space between cards
    borderRadius: 8, // Rounded corners
    shadowColor: "#000", // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow positioning
    shadowOpacity: 0.2, // Shadow transparency
    shadowRadius: 4, // Shadow blur radius
    elevation: 4, // Shadow for Android
  },
  date: {
    fontSize: 16, // Font size for the date
    fontWeight: "bold", // Bold text for the date
    color: "#333", // Text color
    marginBottom: 8, // Spacing below the date
  },
  weight: {
    fontSize: 14, // Font size for the weight
    color: "#666", // Text color
  },
});

export default WeightGraphScreen;
