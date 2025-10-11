import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  ApiError,
} from "../types";
import apiClient from "../utils/apiClient";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        console.log("[AuthContext] Loaded session:", {
          storedToken,
          storedUser,
        });
        if (storedToken) {
          setToken(storedToken);
          console.log("[AuthContext] Token set:", storedToken);
          // Optionally validate token here
        }
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            console.log("[AuthContext] User set:", parsedUser);
          } catch (parseError) {
            console.warn("Failed to parse stored user data:", parseError);
            await AsyncStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.warn("Failed to load session:", error);
      } finally {
        setIsLoading(false);
        console.log("[AuthContext] isLoading set to false");
      }
    };
    loadSession();
  }, []);

  const clearError = () => setError(null);

  const storeAuthData = async (authData: AuthResponse) => {
    const { token, refreshToken, user } = authData;
    await AsyncStorage.setItem("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    }
    // Also store in web localStorage if running on web
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    }
    setToken(token);
    setUser(user);
    console.log("[AuthContext] storeAuthData called:", {
      token,
      user,
      refreshToken,
    });
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    console.log("[AuthContext] login called with:", credentials);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/login",
        credentials,
      );
      console.log("[AuthContext] login response:", response.data);
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
      console.error("[AuthContext] login error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("[AuthContext] login finished, isLoading set to false");
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    console.log("[AuthContext] register called with:", credentials);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/register",
        credentials,
      );
      console.log("[AuthContext] register response:", response.data);
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
      console.error("[AuthContext] register error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log("[AuthContext] register finished, isLoading set to false");
    }
  };

  const googleSignIn = async (googleUser: {
    email: string;
    name: string;
    idToken: string;
  }) => {
    setIsLoading(true);
    setError(null);
    console.log("[AuthContext] Google sign-in called with:", googleUser.email);
    try {
      const response = await apiClient.post<AuthResponse>(
        "/auth/google",
        googleUser,
      );
      console.log("[AuthContext] Google sign-in response:", response.data);
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
      console.error("[AuthContext] Google sign-in error:", errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
      console.log(
        "[AuthContext] Google sign-in finished, isLoading set to false",
      );
    }
  };

  const logout = useCallback(async () => {
    try {
      console.log("[AuthContext] logout initiated");

      // Clear storage first to prevent any async issues
      await AsyncStorage.multiRemove(["token", "user", "refreshToken"]);

      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refreshToken");
      }

      // Clear state after storage is cleared
      setToken(null);
      setUser(null);
      setError(null);

      console.log("[AuthContext] logout successful");
    } catch (error) {
      console.warn("Error during logout:", error);
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
      console.log("[AuthContext] Refresh failed, logging out");
      try {
        setToken(null);
        setUser(null);
        setError(null);
        await AsyncStorage.multiRemove(["token", "user", "refreshToken"]);
      } catch (logoutError) {
        console.warn("Error during logout after refresh failure:", logoutError);
      }
      throw error;
    }
  }, []);

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
