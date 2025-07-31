"use client";

import React from "react";
import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { StackScreenProps } from "@react-navigation/stack";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { RootStackParamList, TabParamList } from "./App";
import axios from "axios";

// Define the API URL - change this to your Django backend URL
const API_URL = "http://192.168.1.12:8000";

// Define props for the component
type MainScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Home">,
  StackScreenProps<RootStackParamList>
>;

const MainScreen: React.FC<MainScreenProps> = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Animate button press
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate loading state
  const animateLoading = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Function to handle video upload
  const handleVideoUpload = async () => {
    try {
      animatePress();
      setIsUploading(true);
      animateLoading();

      if (Platform.OS === "ios") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Required", "Sorry, we need camera roll permissions to upload videos!");
          return;
        }
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: false,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const selectedVideo = result.assets[0];
        const fileSize = selectedVideo.size
          ? `${(selectedVideo.size / 1024 / 1024).toFixed(2)} MB`
          : "Unknown size";

        Alert.alert("Video Selected", `Name: ${selectedVideo.name}\nSize: ${fileSize}`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Process Video",
            onPress: async () => {
              try {
                const formData = new FormData();
                const fetchResponse = await fetch(selectedVideo.uri);
                const blob = await fetchResponse.blob();
                formData.append("file", blob, selectedVideo.name);

                const axiosResponse = await axios.post(`${API_URL}/api/process-video/`, formData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                  onUploadProgress: (progressEvent: { loaded: number; total?: number }) => {
                    const percentCompleted = progressEvent.total 
                      ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                      : 0;
                    console.log(`Upload Progress: ${percentCompleted}%`);
                  },
                } as any);

                Alert.alert("Success", "Video processed successfully!");
                console.log("Processed video response:", axiosResponse.data);
              } catch (error) {
                console.error("Error processing video:", error);
                Alert.alert("Error", "Failed to process the video. Please try again.");
              }
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick a video. Please try again.");
    } finally {
      setIsUploading(false);
      fadeAnim.setValue(1);
    }
  };

  // Function to handle camera access
  const handleCameraAccess = () => {
    Alert.alert("Camera", "Opening camera for ASL translation...");
    // Implement camera functionality here
  };

  // Function to handle notifications
  const handleNotifications = () => {
    Alert.alert("Notifications", "Opening notifications...");
    // Implement notifications functionality here
  };

  // Function to handle translation
  // Define the expected response structure
  interface TranslationResponse {
    translation: string;
  }
  
  const handleTranslate = async () => {
    if (!inputText.trim()) {
      Alert.alert("Input Required", "Please type a message to translate");
      return;
    }

    setIsTranslating(true);
    animateLoading();

    try {
      const response = await axios.post(`${API_URL}/api/translate/`, {
        text: inputText,
        language: selectedLanguage,
      });

      const data = response.data as TranslationResponse;
      
      // Animate success
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert("Translation Success", `Translated: ${data.translation}`);
    } catch (error) {
      console.error("Translation error:", error);
      Alert.alert("Error", "Failed to translate the text. Please try again.");
    } finally {
      setIsTranslating(false);
      fadeAnim.setValue(1);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>SignBridge</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleNotifications}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={handleCameraAccess}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.translateOptions}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={animatePress}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>Translate to text</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={animatePress}
                activeOpacity={0.7}
              >
                <Text style={styles.optionText}>Translate to voice</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View 
            style={[
              styles.uploadArea,
              { opacity: fadeAnim }
            ]}
          >
            <Ionicons name="cloud-upload-outline" size={48} color="gray" />
          </Animated.View>

          <TouchableOpacity
            style={[
              styles.uploadButton,
              isUploading && styles.uploadButtonDisabled
            ]}
            onPress={handleVideoUpload}
            disabled={isUploading}
            activeOpacity={0.7}
          >
            {isUploading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload a video</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.uploadDescription}>
            Upload a video to translate ASL to text
          </Text>

          <View style={styles.languageSelector}>
            <Text style={styles.languageLabel}>Language</Text>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => {
                Alert.alert("Select Language", "Choose a language", [
                  { text: "English", onPress: () => setSelectedLanguage("English") },
                  { text: "Spanish", onPress: () => setSelectedLanguage("Spanish") },
                  { text: "French", onPress: () => setSelectedLanguage("French") },
                  { text: "Cancel", style: "cancel" },
                ]);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.languageButtonText}>{selectedLanguage}</Text>
              <Ionicons name="chevron-down" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputArea}>
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => Alert.alert("Voice Input", "Listening for voice input...")}
              activeOpacity={0.7}
            >
              <Ionicons name="mic-outline" size={24} color="black" />
            </TouchableOpacity>
            <TextInput
              style={styles.inputField}
              placeholder="Type a message"
              value={inputText}
              onChangeText={setInputText}
              editable={!isTranslating}
              multiline
            />
          </View>

          <Animated.View 
            style={[
              styles.translateButtonContainer,
              { transform: [{ translateY }] }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.translateButton,
                isTranslating && styles.translateButtonDisabled
              ]}
              onPress={handleTranslate}
              disabled={isTranslating}
              activeOpacity={0.7}
            >
              {isTranslating ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <>
                  <Text style={styles.translateButtonText}>Translate to ASL</Text>
                  <Ionicons name="camera-outline" size={24} color="white" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  iconButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  translateOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#000",
  },
  uploadArea: {
    height: 150,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  uploadDescription: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  languageSelector: {
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: "#000",
  },
  languageButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
  },
  languageButtonText: {
    fontSize: 16,
    color: "#000",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 8,
    marginBottom: 20,
  },
  micButton: {
    padding: 8,
  },
  inputField: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  translateButtonContainer: {
    marginBottom: 20,
  },
  translateButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  translateButtonDisabled: {
    backgroundColor: "#ccc",
  },
  translateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default MainScreen;