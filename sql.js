import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet } from "react-native";
import {
  createProfile,
  getProfiles,
  updateProfile,
  deleteProfile,
  addWeight,
  getWeights,
  updateWeight,
  deleteWeight,
} from "./profileService"; // Import CRUD functions

export default function Profile() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [password, setPassword] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [weight, setWeight] = useState("");
  const [weights, setWeights] = useState([]);

  // Fetch profiles when the app starts
  useEffect(() => {
    const fetchProfilesData = async () => {
      const profilesData = await getProfiles();
      setProfiles(profilesData);
    };
    fetchProfilesData();
  }, []);

  // Select a profile to view details
  const selectProfile = async (profile) => {
    setSelectedProfile(profile);
    const weightsData = await getWeights(profile.id);
    setWeights(weightsData);
  };

  // Add new profile
  const handleAddProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Name is required");
      return;
    }
    await createProfile(name, dob, password, avatarName);
    setName("");
    setDob("");
    setPassword("");
    setAvatarName("");
    const profilesData = await getProfiles();
    setProfiles(profilesData);
  };

  // Update the profile
  const handleUpdateProfile = async () => {
    if (!name) {
      Alert.alert("Error", "Please enter a new name");
      return;
    }
    await updateProfile(selectedProfile.id, name, dob, avatarName);
    setName("");
    setDob("");
    setAvatarName("");
    const profilesData = await getProfiles();
    setProfiles(profilesData);
    Alert.alert("Success", "Profile updated");
  };

  // Delete the profile
  const handleDeleteProfile = async () => {
    if (selectedProfile) {
      await deleteProfile(selectedProfile.id);
      setSelectedProfile(null);
      const profilesData = await getProfiles();
      setProfiles(profilesData);
    }
  };

  // Add a weight entry
  const handleAddWeight = async () => {
    if (!weight) {
      Alert.alert("Error", "Weight is required");
      return;
    }
    await addWeight(selectedProfile.id, weight);
    setWeight("");
    const weightsData = await getWeights(selectedProfile.id);
    setWeights(weightsData);
  };

  // Update a weight entry
  const handleUpdateWeight = async (weightId) => {
    if (!weight) {
      Alert.alert("Error", "Please enter a new weight");
      return;
    }
    await updateWeight(weightId, weight);
    setWeight("");
    const weightsData = await getWeights(selectedProfile.id);
    setWeights(weightsData);
  };

  // Delete a weight entry
  const handleDeleteWeight = async (weightId) => {
    await deleteWeight(weightId);
    const weightsData = await getWeights(selectedProfile.id);
    setWeights(weightsData);
  };

  return (
    <View style={styles.container}>
      {selectedProfile ? (
        <>
          <Text style={styles.title}>Profile: {selectedProfile.name}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter weight"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />
          <Button title="Add Weight" onPress={handleAddWeight} />
          <FlatList
            data={weights}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View>
                <Text>{`${item.entry_date}: ${item.weight} kg`}</Text>
                <Button title="Delete Weight" onPress={() => handleDeleteWeight(item.id)} />
                <Button title="Update Weight" onPress={() => handleUpdateWeight(item.id)} />
              </View>
            )}
          />
          <Button title="Back to Profiles" onPress={() => setSelectedProfile(null)} />
          <TextInput
            style={styles.input}
            placeholder="Update Avatar Name"
            value={avatarName}
            onChangeText={setAvatarName}
          />
          <Button title="Update Profile" onPress={handleUpdateProfile} />
          <Button title="Delete Profile" onPress={handleDeleteProfile} />
        </>
      ) : (
        <>
          <Text style={styles.title}>Create Profile</Text>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Date of Birth (optional)"
            value={dob}
            onChangeText={setDob}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (optional)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Avatar Name (optional)"
            value={avatarName}
            onChangeText={setAvatarName}
          />
          <Button title="Add Profile" onPress={handleAddProfile} />

          <Text style={styles.title}>Profiles</Text>
          <FlatList
            data={profiles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <Button title={item.name} onPress={() => selectProfile(item)} />
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
});





// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Button,
//   FlatList,
//   Alert,
//   StyleSheet,
// } from "react-native";
// import * as SQLite from "expo-sqlite";

// // Open the database asynchronously
// const openDb = async () => {
//   const db = await SQLite.openDatabaseAsync("weightTrackingApp.db");
//   return db;
// };

// export default function Profile() {
//   const [profiles, setProfiles] = useState([]);
//   const [name, setName] = useState("");
//   const [dob, setDob] = useState("");
//   const [password, setPassword] = useState("");
//   const [avatarName, setAvatarName] = useState("");
//   const [selectedProfile, setSelectedProfile] = useState(null);
//   const [weight, setWeight] = useState("");
//   const [weights, setWeights] = useState([]);

//   // Initialize the database and create tables
//   useEffect(() => {
//     const createTables = async () => {
//       try {
//         const db = await openDb();

//         // Create profiles and weights tables
//         await db.execAsync(`
//           CREATE TABLE IF NOT EXISTS profiles (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             name TEXT,
//             dob DATE,
//             password TEXT,
//             avatar_name TEXT,
            
//           );
          
//           CREATE TABLE IF NOT EXISTS weights (
//             id INTEGER PRIMARY KEY AUTOINCREMENT,
//             profile_id INTEGER,
//             weight REAL,
//             entry_date DATE,
//             FOREIGN KEY (profile_id) REFERENCES profiles(id)
//           );
//         `);
//         console.log("Tables created or already exist");
//       } catch (error) {
//         console.error("Error creating tables:", error);
//       }
//     };

//     createTables();
//     fetchProfiles(); // Fetch profiles when the app starts
//   }, []);

//   // Fetch all profiles
//   const fetchProfiles = async () => {
//     try {
//       const db = await openDb();
//       const profiles = await db.getAllAsync("SELECT * FROM profiles");
//       setProfiles(profiles);
//     } catch (error) {
//       console.error("Error fetching profiles:", error);
//     }
//   };

//   // Add a new profile
//   const addProfile = async () => {
//     if (name === "") {
//       Alert.alert("Error", "Name is required");
//       return;
//     }

//     try {
//       const db = await openDb();
//       const result = await db.runAsync(
//         "INSERT INTO profiles (name, dob, password) VALUES (?, ?, ?)",
//         name,
//         dob || null,
//         password || null,
//         avatarName || null
//       );
//       fetchProfiles();
//       setName("");
//       setDob("");
//       setPassword("");
//       setAvatarName("")
//     } catch (error) {
//       console.error("Error adding profile:", error);
//     }
//   };

//   // Select a profile and load weights
//   const selectProfile = (profile) => {
//     if (profile.password) {
//       Alert.prompt("Enter Password", "", [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "OK",
//           onPress: (input) => {
//             if (input === profile.password) {
//               setSelectedProfile(profile);
//               fetchWeights(profile.id);
//             } else {
//               Alert.alert("Incorrect password");
//             }
//           },
//         },
//       ]);
//     } else {
//       setSelectedProfile(profile);
//       fetchWeights(profile.id);
//     }
//   };

//   // Fetch weights for a selected profile
//   const fetchWeights = async (profileId) => {
//     try {
//       const db = await openDb();
//       const weights = await db.getAllAsync(
//         "SELECT * FROM weights WHERE profile_id = ?",
//         profileId
//       );
//       setWeights(weights);
//     } catch (error) {
//       console.error("Error fetching weights:", error);
//     }
//   };

//   // Add a weight entry for the selected profile
//   const addWeight = async () => {
//     if (weight === "") {
//       Alert.alert("Error", "Weight is required");
//       return;
//     }

//     const entryDate = new Date().toISOString();

//     try {
//       const db = await openDb();
//       const result = await db.runAsync(
//         "INSERT INTO weights (profile_id, weight, entry_date) VALUES (?, ?, ?)",
//         selectedProfile.id,
//         parseFloat(weight),
//         entryDate
//       );
//       fetchWeights(selectedProfile.id);
//       setWeight("");
//     } catch (error) {
//       console.error("Error adding weight:", error);
//     }
//   };

//   // Delete a profile
//   const deleteProfile = async (profileId) => {
//     Alert.alert(
//       "Confirm Delete",
//       "Are you sure you want to delete this profile?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete",
//           onPress: async () => {
//             try {
//               const db = await openDb();
//               await db.runAsync("DELETE FROM profiles WHERE id = ?", profileId);
//               await db.runAsync(
//                 "DELETE FROM weights WHERE profile_id = ?",
//                 profileId
//               ); // Delete associated weights
//               fetchProfiles();
//               setSelectedProfile(null);
//               Alert.alert("Success", "Profile and associated weights deleted");
//             } catch (error) {
//               console.error("Error deleting profile:", error);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Delete a weight entry
//   const deleteWeight = async (weightId) => {
//     Alert.alert(
//       "Confirm Delete",
//       "Are you sure you want to delete this weight entry?",
//       [
//         {
//           text: "Cancel",
//           style: "cancel",
//         },
//         {
//           text: "Delete",
//           onPress: async () => {
//             try {
//               const db = await openDb();
//               await db.runAsync("DELETE FROM weights WHERE id = ?", weightId);
//               fetchWeights(selectedProfile.id);
//               Alert.alert("Success", "Weight entry deleted");
//             } catch (error) {
//               console.error("Error deleting weight:", error);
//             }
//           },
//         },
//       ]
//     );
//   };

//   // Update profile's name
//   const updateProfile = async () => {
//     if (!name) {
//       Alert.alert("Error", "Please enter a new name");
//       return;
//     }

//     try {
//       const db = await openDb();
//       await db.runAsync(
//         "UPDATE profiles SET name = ? WHERE id = ?",
//         name,
//         selectedProfile.id
//       );
//       fetchProfiles();
//       setName("");
//       Alert.alert("Success", "Profile updated");
//     } catch (error) {
//       console.error("Error updating profile:", error);
//     }
//   };

//   // Update profile's date of birth
//   const updateDob = async () => {
//     if (!dob) {
//       Alert.alert("Error", "Please enter a new date of birth");
//       return;
//     }

//     try {
//       const db = await openDb();
//       await db.runAsync(
//         "UPDATE profiles SET dob = ? WHERE id = ?",
//         dob,
//         selectedProfile.id
//       );
//       fetchProfiles();
//       setDob("");
//       Alert.alert("Success", "Date of Birth updated");
//     } catch (error) {
//       console.error("Error updating DOB:", error);
//     }
//   };

//   // Update weight entry
//   const updateWeightEntry = async (weightId) => {
//     if (!weight) {
//       Alert.alert("Error", "Please enter a new weight");
//       return;
//     }

//     try {
//       const db = await openDb();
//       await db.runAsync(
//         "UPDATE weights SET weight = ? WHERE id = ?",
//         parseFloat(weight),
//         weightId
//       );
//       fetchWeights(selectedProfile.id);
//       setWeight("");
//       Alert.alert("Success", "Weight updated");
//     } catch (error) {
//       console.error("Error updating weight:", error);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       {selectedProfile ? (
//         <>
//           <Text style={styles.title}>Profile: {selectedProfile.name}</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Enter weight"
//             keyboardType="numeric"
//             value={weight}
//             onChangeText={setWeight}
//           />
//           <Button title="Add Weight" onPress={addWeight} />
//           <FlatList
//             data={weights}
//             keyExtractor={(item) => item.id.toString()}
//             renderItem={({ item }) => (
//               <View>
//                 <Text>{`${item.entry_date}: ${item.weight} kg`}</Text>
//                 <Button
//                   title="Delete Weight"
//                   onPress={() => deleteWeight(item.id)}
//                 />
//                 <Button
//                   title="Update Weight"
//                   onPress={() => updateWeightEntry(item.id)}
//                 />
//               </View>
//             )}
//           />
//           <Button
//             title="Back to Profiles"
//             onPress={() => setSelectedProfile(null)}
//           />
//           <Button title="Update Profile Name" onPress={updateProfile} />
//           <Button title="Update DOB" onPress={updateDob} />
//           <Button
//             title="Delete Profile"
//             onPress={() => deleteProfile(selectedProfile.id)}
//           />
//         </>
//       ) : (
//         <>
//           <Text style={styles.title}>Create Profile</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="Name"
//             value={name}
//             onChangeText={setName}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Date of Birth (optional)"
//             value={dob}
//             onChangeText={setDob}
//           />
//           <TextInput
//             style={styles.input}
//             placeholder="Password (optional)"
//             secureTextEntry
//             value={password}
//             onChangeText={setPassword}
//           />
//           <Button title="Add Profile" onPress={addProfile} />

//           <Text style={styles.title}>Profiles</Text>
//           {profiles.length === 0 ? (
//             <Text style={styles.noProfilesText}>
//               No profiles found, click below to create a new profile.
//             </Text>
//           ) : (
//             <FlatList
//               data={profiles}
//               keyExtractor={(item) => item.id.toString()}
//               renderItem={({ item }) => (
//                 <Button title={item.name} onPress={() => selectProfile(item)} />
//               )}
//             />
//           )}
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   noProfilesContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     marginTop: 20,
//   },
//   noProfilesText: {
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 10,
//   },
//   input: {
//     borderColor: "#ccc",
//     borderWidth: 1,
//     padding: 10,
//     marginBottom: 10,
//   },
// });
