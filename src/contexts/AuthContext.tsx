import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, LoginCredentials, RegisterCredentials, AuthResponse, ApiError } from '../types';
import apiClient from '../utils/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
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
        if (!storedToken && typeof window !== 'undefined' && window.localStorage) {
          storedToken = localStorage.getItem('token');
          storedUser = localStorage.getItem('user');
        }
        
        if (storedToken) {
          setToken(storedToken);
          // Optionally validate token here
        }
        
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          } catch (parseError) {
            console.warn('Failed to parse stored user data:', parseError);
            await AsyncStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.warn('Failed to load session:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const clearError = () => setError(null);

  const storeAuthData = async (authData: AuthResponse) => {
    const { token, refreshToken, user } = authData;
    
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
    
    // Also store in web localStorage if running on web
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
    
    setToken(token);
    setUser(user);
  };

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error('Login failed - no data received');
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
      
      if (response.data) {
        await storeAuthData(response.data);
      } else {
        throw new Error('Registration failed - no data received');
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      setError(null);
      
      await AsyncStorage.multiRemove(['token', 'user', 'refreshToken']);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    }
  };

  const refreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: storedRefreshToken
      });
      
      if (response.data) {
        await storeAuthData(response.data);
      }
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token, 
        isLoading, 
        error, 
        login, 
        register, 
        logout, 
        clearError, 
        refreshToken 
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
