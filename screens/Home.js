import React, { useLayoutEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, SafeAreaView } from "react-native";
import LoadingIndicator from "../helpers/LoadingIndicator";
import { useTranslation } from "react-i18next";
import colors from "../styles/colors";
import { Ionicons } from "@expo/vector-icons";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import AvatarComponent from "../components/homeUi/AvatarComponent";
import CustomButtonUser from "../components/homeUi/CustomButtomUser";
import { Picker } from '@react-native-picker/picker';
import Checkbox from 'expo-checkbox';


const Home = ({ navigation, isLoading, setIsLoading }) => {
  const { t, i18n } = useTranslation();
  const [selectedItem, setSelectedItem] = useState("Me"); // Track selected item
  const [isModalVisible, setIsModalVisible] = useState(false); // Control visibility of Modal
  const pickerRef = useRef();
  const [isChecked, setChecked] = useState(false);

  // Open Modal when Button is pressed
  const openModal = () => {
    setIsModalVisible(true); // Show the modal
  };

  // Close Modal
  const closeModal = () => {
    setIsModalVisible(false); // Hide the modal
  };

  // Handle item selection from Picker
  const onValueChange = (itemValue) => {
    setSelectedItem(itemValue); // Update the selected item
  };

  // Handle submitting the selection
  const submitSelection = () => {
    closeModal(); // Close the modal
    // You can handle the submission here (e.g., save the selected item)
    console.log("Selected Item Submitted:", selectedItem); // Example: log the selected item
  };

  useLayoutEffect(() => {
    setTimeout(() => {
      setIsLoading(false); // Hide loading indicator after 5 seconds
    }, 0);
  }, []);

  if (isLoading) {
    return <LoadingIndicator message={t("Loading") + "..."} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeaderContainer}>
        <AvatarComponent />
        <Ionicons name="notifications-outline" size={24} color="black" />
      </View>

      <View style={styles.home_container}>
        <Text style={styles.title}>{t("Select Weight Mate")}</Text>

        {/* Button to trigger Modal Picker */}
        <TouchableOpacity onPress={openModal} style={styles.button}>
          <Text style={styles.buttonText}>{selectedItem || t("Select a profile")}</Text>

          <SimpleLineIcons name="arrow-down" size={18}  color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.checkboxSection}>
        <Checkbox
          style={styles.checkbox}
          value={isChecked}
          onValueChange={setChecked}
          color={isChecked ? colors.secondary : undefined}
        />
        <Text style={styles.paragraph}>Remember my selection next time</Text>
      </View>
        <CustomButtonUser styleBtn={{marginTop:12}} btnText={t("Add Weight")} />
        {/* Modal to display the Picker */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{t("Select Weight Mate")}</Text>
              
              <Picker
                ref={pickerRef}
                selectedValue={selectedItem}
                onValueChange={onValueChange}
                style={styles.picker}
              >
                <Picker.Item label="Me" value="Me" />
                <Picker.Item label="Baby" value="Baby" />
                <Picker.Item label="Cat" value="Cat" />
                {/* Add more items as needed */}
              </Picker>

              {/* Submit Button to confirm selection */}
              <TouchableOpacity onPress={submitSelection} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>{t("Submit")}</Text>
              </TouchableOpacity>

              {/* Close Button (optional) */}
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>{t("Close")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom:10
  },
  home_container: {
    flex: 2,
    justifyContent: "flex-start",
    padding: 20,
   
    paddingTop:100
  },
  topHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  button: {
   
    paddingVertical: 10, // Add padding for better touch area
    paddingHorizontal: 14, // Add padding for better touch area
    borderRadius: 10,
    flexDirection:"row",
    justifyContent:"space-between",
    marginVertical: 10,
    borderColor:colors.textPrimary,
    borderWidth:1,
   

  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
   
  },
  picker: {
  
    width: '100%',
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContainer: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderRadius: 10,
    
    width: "80%", // You can adjust this as needed
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
   
  },
  submitButton: {
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: colors.danger,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
  checkboxSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paragraph: {
    fontSize: 15,
  },
  checkbox: {
    marginRight: 8,
    marginVertical:8,
    width:18,
    height:18
  },
});

export default Home;
