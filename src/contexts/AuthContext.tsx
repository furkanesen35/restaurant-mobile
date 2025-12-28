import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError,
} from "../types";
import apiClient from "../utils/apiClient";
import { useCookieConsent } from "./CookieConsentContext";
import logger from "../utils/logger";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  googleSignIn: (googleUser: {
    email: string;
    name: string;
    idToken: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Register for push notifications
async function registerForPushNotifications() {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#e0b97f",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.warn("Push notification permission not granted");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: "34d8bfb4-2a86-49ed-a4d6-b29eee48d18d",
    })).data;
    return token;
  } catch (error) {
    logger.error("Error getting push token:", error);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasConsent } = useCookieConsent();

  const persistUser = useCallback(async (userData: User | null) => {
    if (userData) {
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("user", JSON.stringify(userData));
      }
    } else {
      await AsyncStorage.removeItem("user");
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      try {
        let storedToken = await AsyncStorage.getItem("token");
        let storedUser = await AsyncStorage.getItem("user");
        // Also check web localStorage if running on web
        if (
          !storedToken &&
          typeof window !== "undefined" &&
          window.localStorage
        ) {
          storedToken = localStorage.getItem("token");
          storedUser = localStorage.getItem("user");
        }
        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setToken(storedToken);
            setUser(parsedUser);
            
            // Validate token with backend
            try {
              logger.log('[Auth] Validating stored token...');
              await apiClient.get("/auth/me");
              // Token is valid, keep user logged in
              logger.info("Session restored successfully");
            } catch (validationError: any) {
              logger.log('[Auth] Token validation failed:', validationError);
              // Token is invalid (401, 403, etc.) - clear session
              logger.info("Stored token is invalid, clearing session");
              await AsyncStorage.removeItem("token");
              await AsyncStorage.removeItem("user");
              await AsyncStorage.removeItem("refreshToken");
              if (typeof window !== "undefined" && window.localStorage) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
              }
              setToken(null);
              setUser(null);
            }
          } catch (parseError) {
            logger.warn("Failed to parse stored user data:", parseError);
            await AsyncStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        logger.warn("Failed to load session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const clearError = () => setError(null);

  // Register push notification token with backend
  const registerPushToken = useCallback(async () => {
    // Only register push tokens if user has consented to marketing or analytics
    if (!hasConsent("marketing") && !hasConsent("analytics")) {
      logger.info("Push notifications disabled - consent not granted");
      return;
    }

    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await apiClient.post("/notifications/register", {
          token: pushToken,
        });
        logger.info("Push token registered with backend");
      }
    } catch (error) {
      logger.error("Failed to register push token:", error);
    }
  }, [hasConsent]);

  const storeAuthData = useCallback(
    async (authData: AuthResponse) => {
      const { token, refreshToken, user } = authData;
      await AsyncStorage.setItem("token", token);
      await persistUser(user);
      if (refreshToken) {
        await AsyncStorage.setItem("refreshToken", refreshToken);
      }
      // Also store in web localStorage if running on web
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("token", token);
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }
      }
      setToken(token);
      setUser(user);

      // Register for push notifications after login
      registerPushToken();
    },
    [persistUser, registerPushToken],
  );

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      logger.log('[Auth] Attempting login for:', credentials.email);
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      logger.log('[Auth] Login response:', response);
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error("Login failed - no data received");
      }
    } catch (error) {
      logger.log('[Auth] Login error details:', error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "Login failed. Please try again.";
      
      // Show alert for production debugging
      if (!__DEV__) {
        Alert.alert("Login Error", JSON.stringify(error, null, 2));
      }
      
      setError(errorMessage);
      logger.error("[AuthContext] login error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      logger.log('[Auth] Attempting register for:', credentials.email);
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        credentials
      );
      logger.log('[Auth] Register response:', response);
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error("Registration failed - no data received");
      }
    } catch (error) {
      logger.log('[Auth] Register error details:', error);
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "Registration failed. Please try again.";
      setError(errorMessage);
      logger.error("[AuthContext] register error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const googleSignIn = async (googleUser: {
    email: string;
    name: string;
    idToken: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/google",
        googleUser
      );
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error("Google sign-in failed - no data received");
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "Google sign-in failed. Please try again.";
      setError(errorMessage);
      logger.error("[AuthContext] Google sign-in error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Clear storage first to prevent any async issues
      await AsyncStorage.multiRemove(["token", "user", "refreshToken"]);

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      }

      // Clear state after storage is cleared
      setToken(null);
      setUser(null);
      setError(null);
    } catch (error) {
      logger.warn("Error during logout:", error);
    }
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiClient.post<AuthResponse>("/auth/refresh", {
        refreshToken: storedRefreshToken,
      });

      if (response.data) {
        await storeAuthData(response.data);
      }
    } catch (error) {
      // If refresh fails, logout user (but avoid infinite loops)
      logger.warn("[AuthContext] Refresh failed, clearing session");
      try {
        setToken(null);
        setUser(null);
        setError(null);
        await AsyncStorage.multiRemove(["token", "user", "refreshToken"]);
      } catch (logoutError) {
        logger.warn("Error during logout after refresh failure:", logoutError);
      }
      throw error;
    }
  }, [storeAuthData]);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const updatedUser = { ...prev, ...updates };
        void persistUser(updatedUser);
        return updatedUser;
      });
    },
    [persistUser],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        googleSignIn,
        logout,
        clearError,
        refreshToken,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
