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
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
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
  // login success
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
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout }}
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
