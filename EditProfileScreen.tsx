"use client";

import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList, TabParamList } from "./App";
import { CommonActions } from "@react-navigation/native";
import axios from "axios";

// Define the API URL - change this to your Django backend URL
const API_URL = "http://your-django-backend-ip:8000";

// Define the props using CompositeScreenProps for nested navigators
type EditProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Profile">,
  StackScreenProps<RootStackParamList>
>;

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [name, setName] = useState<string>("Arthur");
  const [username, setUsername] = useState<string>("Arthur002");
  const [dateOfBirth, setDateOfBirth] = useState<string>("09/11/2001");
  const [bio, setBio] = useState<string>("World can be a beautiful place if we work tog...");
  const [gender, setGender] = useState<string>("Male");
  const [showASLBadge, setShowASLBadge] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSave = async () => {
    if (!name || !username) {
      Alert.alert("Validation Error", "Name and Username are required!");
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        throw new Error("User not authenticated");
      }

      // Call Django backend API to save profile data
      const response = await axios.put(
        `${API_URL}/api/profile/`,
        {
          name,
          username,
          dateOfBirth,
          bio,
          gender,
          showASLBadge,
        },
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      Alert.alert("Success", "Profile saved successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    Alert.alert("Unsaved Changes", "Do you want to discard your changes?", [
      { text: "Cancel", style: "cancel" },
      { text: "Discard", onPress: () => navigation.goBack() },
    ]);
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            // Clear login status
            await AsyncStorage.removeItem("authToken");
            await AsyncStorage.removeItem("userData");

            // Navigate to Login screen using CommonActions
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Login" }],
              })
            );
          } catch (error) {
            console.error("Error logging out:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
          <Text style={styles.headerTitle}>Edit profile</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <Image
          source={require("./assets/profile1.jpg")} // Make sure this path is correct
          style={styles.profileImage}
        />
        <TouchableOpacity>
          <Text style={styles.editImageText}>Edit picture or avatar</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          editable={!isLoading}
        />
        <TextInput
          style={styles.input}
          placeholder="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          editable={!isLoading}
        />

        <TouchableOpacity style={styles.addButton} disabled={isLoading}>
          <Text style={styles.addButtonText}>Add a link</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} disabled={isLoading}>
          <Text style={styles.addButtonText}>Add a banner</Text>
        </TouchableOpacity>

        {/* Gender Picker */}
        <Picker
          selectedValue={gender}
          onValueChange={(itemValue) => setGender(itemValue)}
          style={styles.input}
          enabled={!isLoading}
        >
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
          <Picker.Item label="Other" value="Other" />
        </Picker>

        {/* ASL Badge Switch */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Show ASL Badge</Text>
          <Switch
            value={showASLBadge}
            onValueChange={setShowASLBadge}
            disabled={isLoading}
          />
        </View>

        <TouchableOpacity disabled={isLoading}>
          <Text style={styles.linkText}>Personal Information Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity disabled={isLoading}>
          <Text style={styles.linkText}>Show verified profile</Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.disabledButton]}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Makes the image circular
  },
  editImageText: {
    color: "#6200EE",
    marginTop: 10,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  addButton: {
    borderWidth: 1,
    borderColor: "#6200EE",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    alignItems: "center",
  },
  addButtonText: {
    color: "#6200EE",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  switchLabel: {
    fontSize: 16,
  },
  linkText: {
    color: "#6200EE",
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#6200EE",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 20,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "#FF3B30",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    marginHorizontal: 20,
  },
  logoutButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#666",
  },
});

export default EditProfileScreen;