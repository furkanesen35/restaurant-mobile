import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextType {
  user: any;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkStorage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      let storedToken = await AsyncStorage.getItem("token");
      let storedUser = await AsyncStorage.getItem("user");
      
      // Also check web localStorage if running on web
      if (!storedToken && typeof window !== 'undefined' && window.localStorage) {
        storedToken = localStorage.getItem('token');
        storedUser = localStorage.getItem('user');
      }
      
      if (storedToken) {
        setToken(storedToken);
        console.log('Token loaded from storage');
      }
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log('User loaded from storage');
      }
      setIsLoading(false);
    };
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
  const res = await fetch("http://192.168.1.110:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        await AsyncStorage.setItem("token", data.token);
        
        // Also store in web localStorage if running on web
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', data.token);
        }
        
        if (data.user) {
          setUser(data.user);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('user', JSON.stringify(data.user));
          }
        } else {
          setUser({ email });
          await AsyncStorage.setItem("user", JSON.stringify({ email }));
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('user', JSON.stringify({ email }));
          }
        }
        console.log('Login successful - token and user stored');
      } else {
        throw new Error(data.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
  const res = await fetch("http://192.168.1.110:3000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        await AsyncStorage.setItem("token", data.token);
        if (data.user) {
          setUser(data.user);
          await AsyncStorage.setItem("user", JSON.stringify(data.user));
        } else {
          setUser({ name, email });
          await AsyncStorage.setItem("user", JSON.stringify({ name, email }));
        }
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    console.log('=== LOGOUT FUNCTION CALLED ===');
    console.log('Current token before logout:', token);
    console.log('Current user before logout:', user);
    
    // Check what's in storage before clearing
    const asyncToken = await AsyncStorage.getItem("token");
    console.log('AsyncStorage token before clear:', asyncToken);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const localToken = localStorage.getItem('token');
      console.log('localStorage token before clear:', localToken);
    }
    
    // Clear state
    setToken(null);
    setUser(null);
    console.log('State cleared - token and user set to null');
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    console.log('AsyncStorage cleared');
    
    // Clear web localStorage if running on web
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('localStorage cleared');
      
      // Verify localStorage is actually cleared
      const tokenAfter = localStorage.getItem('token');
      console.log('localStorage token after clear:', tokenAfter);
    }
    
    // Verify AsyncStorage is cleared
    const asyncTokenAfter = await AsyncStorage.getItem("token");
    console.log('AsyncStorage token after clear:', asyncTokenAfter);
    
    console.log('=== LOGOUT COMPLETED ===');
  };

  const checkStorage = async () => {
    console.log('=== STORAGE CHECK ===');
    console.log('Current state - token:', token, 'user:', user);
    
    const asyncToken = await AsyncStorage.getItem("token");
    const asyncUser = await AsyncStorage.getItem("user");
    console.log('AsyncStorage - token:', asyncToken, 'user:', asyncUser);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      console.log('localStorage - token:', localToken, 'user:', localUser);
    }
    console.log('=== END STORAGE CHECK ===');
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, checkStorage }}
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
