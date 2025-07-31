import React from "react";
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "./App";
import axios from "axios";

// Define the API URL - change this to your Django backend URL
const API_URL = "http://192.168.1.12:8000";

// Define the props using StackScreenProps
type LoginScreenProps = StackScreenProps<RootStackParamList, "Login">;

// Define the expected response type
interface LoginResponse {
  user: {
    id: number;
    username: string;
    email: string;
  };
  refresh: string;
  access: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;

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

  // Animate error state
  const animateError = () => {
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate title on mount
  useEffect(() => {
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Check if the user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        navigation.navigate("Main");
      }
    };
    checkLoginStatus();
  }, [navigation]);

  // Handle login logic
  const handleLogin = async () => {
    if (!email || !password) {
      animateError();
      Alert.alert("Validation Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    animateLoading();

    try {
      // Call Django backend login endpoint
      const response = await axios.post<LoginResponse>(`${API_URL}/api/users/login/`, {
        email,
        password,
      });

      // Store the auth token and user data
      if (response.data.access) {
        await AsyncStorage.setItem("authToken", response.data.access);
      }
      if (response.data.user) {
        await AsyncStorage.setItem("userData", JSON.stringify(response.data.user));
      }

      // Animate success
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Navigate to the main screen after successful login
        navigation.navigate("Main");
      });
    } catch (error) {
      console.error("Login error:", error);
      animateError();
      if (error instanceof Error && 'response' in error) {
        // Handle server error response
        const axiosError = error as { response?: { data?: any } };
        console.log("Server error response:", axiosError.response?.data);
        Alert.alert(
          "Login Failed", 
          typeof axiosError.response?.data === 'object' 
            ? JSON.stringify(axiosError.response.data, null, 2)
            : "Login failed. Please check your credentials and try again."
        );
      } else {
        // Handle network or other errors
        Alert.alert("Network Error", "Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
      fadeAnim.setValue(1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateX: slideAnim }
              ]
            }
          ]}
        >
          <Animated.Text 
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            Unlock The Power{"\n"}Of Communication
          </Animated.Text>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
            <TouchableOpacity 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons 
                name={showPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.disabledButton
              ]}
              onPress={() => {
                animatePress();
                handleLogin();
              }}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={() => navigation.navigate("SignUp")}
            disabled={isLoading}
            style={styles.signUpLinkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLink}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#000",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 16,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signUpLinkContainer: {
    marginTop: 8,
  },
  signUpLink: {
    color: "#007AFF",
    fontSize: 16,
  },
  errorText: {
    color: "#FF3B30",
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
});

export default LoginScreen;