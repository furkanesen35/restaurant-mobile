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
import { Platform } from "react-native";
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
      logger.log("Push notification permission not granted");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: "34d8bfb4-2a86-49ed-a4d6-b29eee48d18d",
    })).data;
    logger.log("Expo Push Token:", token);
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
        logger.debug("[AuthContext] Loaded session:", {
          storedToken,
          storedUser,
        });
        if (storedToken) {
          setToken(storedToken);
          logger.debug("[AuthContext] Token set:", storedToken);
          // Optionally validate token here
        }
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            logger.debug("[AuthContext] User set:", parsedUser);
          } catch (parseError) {
            logger.warn("Failed to parse stored user data:", parseError);
            await AsyncStorage.removeItem("user");
          }
        }
      } catch (error) {
        logger.warn("Failed to load session:", error);
      } finally {
        setIsLoading(false);
        logger.debug("[AuthContext] isLoading set to false");
      }
    };
    loadSession();
  }, []);

  const clearError = () => setError(null);

  // Register push notification token with backend
  const registerPushToken = useCallback(async () => {
    // Only register push tokens if user has consented to marketing or analytics
    if (!hasConsent("marketing") && !hasConsent("analytics")) {
      logger.log("Push notifications disabled - no consent for marketing/analytics");
      return;
    }

    try {
      const pushToken = await registerForPushNotifications();
      if (pushToken) {
        await apiClient.post("/notifications/register", {
          token: pushToken,
        });
        logger.log("Push token registered with backend");
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
      logger.debug("[AuthContext] storeAuthData called:", {
        token,
        user,
        refreshToken,
      });

      // Register for push notifications after login
      registerPushToken();
    },
    [persistUser, registerPushToken],
  );

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    logger.debug("[AuthContext] login called with:", credentials);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      logger.debug("[AuthContext] login response:", response.data);
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error("Login failed - no data received");
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "Login failed. Please try again.";
      setError(errorMessage);
      logger.error("[AuthContext] login error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      logger.debug("[AuthContext] login finished, isLoading set to false");
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    logger.debug("[AuthContext] register called with:", credentials);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        credentials
      );
      logger.debug("[AuthContext] register response:", response.data);
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error("Registration failed - no data received");
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.message || "Registration failed. Please try again.";
      setError(errorMessage);
      logger.error("[AuthContext] register error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      logger.debug("[AuthContext] register finished, isLoading set to false");
    }
  };

  const googleSignIn = async (googleUser: {
    email: string;
    name: string;
    idToken: string;
  }) => {
    setIsLoading(true);
    setError(null);
    logger.debug("[AuthContext] Google sign-in called with:", googleUser.email);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/google",
        googleUser
      );
      logger.debug("[AuthContext] Google sign-in response:", response.data);
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
      logger.debug(
        "[AuthContext] Google sign-in finished, isLoading set to false"
      );
    }
  };

  const logout = useCallback(async () => {
    try {
      logger.debug("[AuthContext] logout initiated");

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

      logger.debug("[AuthContext] logout successful");
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
      logger.debug("[AuthContext] Refresh failed, logging out");
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
