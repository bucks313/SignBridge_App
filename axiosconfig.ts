import axios, { InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


// Environment variables would be better for this
const API_BASE_URL = "http://192.168.1.12:8000/api";
const API_TIMEOUT = 15000; // 15 seconds timeout

// Create Axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Function to get the token and apply it to a request
const getTokenAndApply = async (config: InternalAxiosRequestConfig) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Token ${token}`;
    }
  } catch (error) {
    console.error("Error retrieving token:", error);
  }
  return config;
};

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    // Apply the token to the request
    return await getTokenAndApply(config);
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    // Handle successful responses
    return response;
  },
  (error) => {
    // Handle response errors
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      console.error("Unauthorized request:", error);
    }
    return Promise.reject(error);
  }
);

// Export the Axios instance
export default axiosInstance;