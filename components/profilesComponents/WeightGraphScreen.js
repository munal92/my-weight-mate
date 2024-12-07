import React, { useState, useEffect, useLayoutEffect } from "react";
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

import "moment/locale/tr";
import "moment/locale/es";
import colors from "../../styles/colors";
import GraphView from "./GraphView";

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

const WeightGraphScreen = ({ isJustYearly = false }) => {
  console.log(isJustYearly);
  const [selectedPeriod, setSelectedPeriod] = useState(
    isJustYearly ? "yearly" : "weekly"
  );
  const [filteredData, setFilteredData] = useState(mockData);
  const { t, i18n } = useTranslation();
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(moment());
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [currentYear, setCurrentYear] = useState(moment().year());
  const [current3Months, setCurrent3Months] = useState(
    moment().startOf("month").subtract(2, "months")
  );

  // // Ensure moment locale matches i18n.language
  useEffect(() => {
    console.log("GIRDI ", i18n.language);
    moment.locale(i18n.language); // Set moment's locale dynamically
  }, [i18n.language]);

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
      case "3 Months": {
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
    console.log("Current Language: ", i18n.language);
  }, [selectedPeriod, currentWeek, currentMonth, currentYear, current3Months]);

  // useLayoutEffect(() => {
  //   moment.locale(i18n.language); // Update moment's locale based on the selected language
  // }, [i18n.language]);

  const [language, setLanguage] = useState(i18n.language);

  useEffect(() => {
    setLanguage(i18n.language); // Update state when language changes
  }, [i18n.language]);

  useEffect(() => {
    moment.locale(language); // Update moment locale based on state
  }, [language]);

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

  const generateyaxislabels = () => {
    if (selectedPeriod === "3 Months" || selectedPeriod === "yearly") {
      let monthlabels = [];
      filteredData.map((entry) => {
        if (!monthlabels.includes(moment(entry.date).format("MMM"))) {
          monthlabels.push(moment(entry.date).format("MMM"));
        }
      });

      if (monthlabels.length > 8) {
        const filteredMonths = monthlabels.filter((item, indx) => {
          if (indx % 2 == 0) {
            return item;
          }
        });
        return filteredMonths;
      }

      return monthlabels;
    }

    return filteredData.map((entry) => formatDate(entry.date));
  };
  // Graph data for rendering the chart
  const graphData = {
    labels: generateyaxislabels(),
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
    if (selectedPeriod === "3 Months") {
      const startMonth = current3Months.clone().format("MMM");
      const endMonth = current3Months.clone().add(2, "months").format("MMM");
      return `${startMonth}-${endMonth}`;
    }
    if (selectedPeriod === "yearly") {
      return `${currentYear}`;
    }
  };

  if (isJustYearly) {
    return (
      <>
        {filteredData.length === 0 ? (
          <Text>No data found for this period</Text>
        ) : (
          <GraphView
            graphData={graphData}
            paddingR={55}
            paddingL={50}
            graphBgColor={colors.profileGraphbg}
            labelTextColor="white"
            gridColor="transparent"
            lineColor="white"
            dotColor="transparent"
            graphPadding={10}
          />
        )}
      </>
    );
  }

  const renderCard = ({ item }) => {
    return (
      <View style={styles.card}>
        <Text style={styles.date}>
          {moment(item.date).format("dddd")}, {moment(item.date).format("MMMM")}{" "}
          {moment(item.date).format("DD")}
        </Text>
        <Text style={styles.weight}>{item.weight} kg</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        padding: 20,
        width: "100%",
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 20 }}>ME</Text>

      {/* Period buttons */}
      <View
        style={{
          flexDirection: "row",
          marginBottom: 20,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {["weekly", "monthly", "3 Months", "yearly"].map((period) => (
          <TouchableOpacity
            key={period}
            style={{
              backgroundColor: "transparent",

              borderBottomLeftRadius: 5,
              borderBottomRightRadius: 5,
              borderBottomWidth: selectedPeriod === period ? 2 : 0,
              borderBottomColor: colors.secondary,
            }}
            onPress={() => {
              setSelectedPeriod(period);
              filterData(period);
            }}
          >
            <Text style={{ color: "black", marginBottom: 5 }}>
              {t(period.charAt(0).toUpperCase() + period.slice(1))}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredData} // Pass your data here
        renderItem={renderCard} // Card rendering function
        keyExtractor={(item, index) => index.toString() + i18n.language} // Unique key for each item
        contentContainerStyle={styles.listContainer} // Styling for the list container
        showsVerticalScrollIndicator={false}
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
                  backgroundColor: "transparent",

                  borderRadius: 5,
                  width: 50,
                  height: 30,
                  justifyContent: "center",
                }}
                onPress={() => {
                  if (selectedPeriod === "weekly") changeWeek(-1);
                  else if (selectedPeriod === "monthly") changeMonth(-1);
                  else if (selectedPeriod === "yearly") changeYear(-1);
                  else if (selectedPeriod === "3 Months") change3Months(-3);
                  filterData(selectedPeriod);
                }}
              >
                <Text
                  style={{ color: "black", fontSize: 24, fontWeight: "400" }}
                >
                  {"<"}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 16,
                  fontWeight: "400",
                }}
              >
                {renderPeriodLabel()}
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: "transparent",

                  justifyContent: "center",
                  alignItems: "flex-end",
                  borderRadius: 5,
                  width: 50,
                  height: 30,
                }}
                onPress={() => {
                  if (selectedPeriod === "weekly") changeWeek(1);
                  else if (selectedPeriod === "monthly") changeMonth(1);
                  else if (selectedPeriod === "yearly") changeYear(1);
                  else if (selectedPeriod === "3 Months") change3Months(3);
                  filterData(selectedPeriod);
                }}
              >
                <Text
                  style={{ color: "black", fontSize: 24, fontWeight: "400" }}
                >
                  {">"}
                </Text>
              </TouchableOpacity>
            </View>
            {filteredData.length === 0 ? (
              <Text>No data found for this period</Text>
            ) : (
              <GraphView graphData={graphData} />
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
    // backgroundColor: "#f8f8f8", // Light background for the card
    // padding: 16, // Inner padding for content
    marginVertical: 18, // Space between cards
    borderRadius: 8, // Rounded corners
    // shadowColor: "#000", // Shadow color
    // shadowOffset: { width: 0, height: 2 }, // Shadow positioning
    // shadowOpacity: 0.2, // Shadow transparency
    // shadowRadius: 4, // Shadow blur radius
    // elevation: 4, // Shadow for Android
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
