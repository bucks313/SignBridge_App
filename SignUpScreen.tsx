import React from "react";
import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import type { StackScreenProps } from "@react-navigation/stack";
import type { RootStackParamList } from "./App";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// Define the API URL - change this to your Django backend URL
const API_URL = "http://192.168.1.12:8000";

// Define the props using StackScreenProps
type SignUpScreenProps = StackScreenProps<RootStackParamList, "SignUp">;

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }): React.ReactElement => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  // Password validation
  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pass)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pass)) {
      return "Password must contain at least one number";
    }
    return null;
  };

  // Define the expected response type
  interface SignUpResponse {
    user: {
      id: number;
      username: string;
      email: string;
    };
    refresh: string;
    access: string;
  }
  
  const handleSignUp = async () => {
    if (!username || !email || !password) {
      animateError();
      Alert.alert("Validation Error", "Please fill in all required fields");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      animateError();
      Alert.alert("Password Error", passwordError);
      return;
    }

    setIsLoading(true);
    animateLoading();

    try {
      // Call Django backend signup endpoint
      const response = await axios.post<SignUpResponse>(`${API_URL}/api/users/register/`, {
        username,
        email,
        password,
        password2: password,
        first_name: firstName,
        last_name: lastName,
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
        // Navigate to the login screen after successful signup
        navigation.navigate("Login");
      });
    } catch (error) {
      console.error("Signup error:", error);
      animateError();
      if (error instanceof Error && 'response' in error) {
        // Handle server error response
        const axiosError = error as { response?: { data?: any } };
        console.log("Server error response:", axiosError.response?.data);
        Alert.alert(
          "Signup Failed", 
          typeof axiosError.response?.data === 'object' 
            ? JSON.stringify(axiosError.response.data, null, 2)
            : "Signup failed. Please try again."
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
          <Text style={styles.title}>Create Your Account</Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name (Optional)"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name (Optional)"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
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
                styles.signUpButton,
                isLoading && styles.signUpButtonDisabled
              ]} 
              onPress={() => {
                animatePress();
                handleSignUp();
              }}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity 
            onPress={() => navigation.navigate("Login")} 
            disabled={isLoading}
            style={styles.loginLinkContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.loginLink}>Already have an account? Login</Text>
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
  signUpButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    width: "100%",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 16,
  },
  signUpButtonDisabled: {
    backgroundColor: "#ccc",
  },
  signUpButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLinkContainer: {
    marginTop: 8,
  },
  loginLink: {
    color: "#007AFF",
    fontSize: 16,
  },
});

export default SignUpScreen;