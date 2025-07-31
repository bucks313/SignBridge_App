import React, { createContext, useContext, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, signup, logout, AuthResponse } from './services/auth';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import MainScreen from './screens/MainScreen';
import MessagesScreen from './screens/MessagesScreen';
import SearchResultsScreen from './screens/SearchResultsScreen';
import EditProfileScreen from './screens/EditProfileScreen';

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type TabParamList = {
  Main: undefined;
  Messages: undefined;
  Search: undefined;
  Profile: undefined;
};

// Create navigators
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Create auth context
interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  signup: (email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="SignUp" component={SignUpScreen} />
  </AuthStack.Navigator>
);

// Main Tabs Navigator
const MainTabs = () => (
  <Tab.Navigator>
    <Tab.Screen name="Main" component={MainScreen} />
    <Tab.Screen name="Messages" component={MessagesScreen} />
    <Tab.Screen name="Search" component={SearchResultsScreen} />
    <Tab.Screen name="Profile" component={EditProfileScreen} />
  </Tab.Navigator>
);

// App component
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const result = await login(email, password);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  };

  const handleSignup = async (email: string, password: string) => {
    const result = await signup(email, password);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
      }}
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {isAuthenticated ? (
            <Stack.Screen name="App" component={MainTabs} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}