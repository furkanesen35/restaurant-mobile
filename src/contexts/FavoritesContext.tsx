import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../utils/apiClient";
import logger from "../utils/logger";

type FavoritesContextType = {
  favorites: Set<string>;
  loading: boolean;
  initialized: boolean;
  isFavorite: (menuItemId: string) => boolean;
  toggleFavorite: (menuItemId: string) => Promise<void>;
  refetch: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Use ref to avoid stale closure in toggleFavorite
  const favoritesRef = useRef<Set<string>>(favorites);
  favoritesRef.current = favorites;

  const resetFavorites = useCallback(() => {
    setFavorites(new Set());
    setInitialized(true);
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user || !token) {
      resetFavorites();
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get<
        Array<{ menuItem: { id: string } }>
      >("/api/favorites");
      const favoriteIds = new Set(
        (response.data || []).map((fav) => fav.menuItem.id.toString())
      );
      setFavorites(favoriteIds);
    } catch (err: any) {
      // Don't log 401 errors as they're expected when not logged in
      if (err?.statusCode !== 401) {
        logger.error("Error fetching favorites:", err);
      }
      // Reset favorites on error to ensure clean state
      setFavorites(new Set());
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user, token, resetFavorites]);

  // Fetch favorites when user/token changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Reset favorites when user logs out
  useEffect(() => {
    if (!user) {
      resetFavorites();
    }
  }, [user, resetFavorites]);

  const toggleFavorite = useCallback(async (menuItemId: string) => {
    if (!user || !token) {
      const error = new Error("LOGIN_REQUIRED") as Error & { code?: string; statusCode?: number };
      error.code = "LOGIN_REQUIRED";
      error.statusCode = 401;
      throw error;
    }

    // Use ref to get current state and avoid stale closure
    const currentlyFavorite = favoritesRef.current.has(menuItemId);

    // Optimistic update
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (currentlyFavorite) {
        newSet.delete(menuItemId);
      } else {
        newSet.add(menuItemId);
      }
      return newSet;
    });

    try {
      if (currentlyFavorite) {
        await apiClient.delete(`/api/favorites/${menuItemId}`);
      } else {
        await apiClient.post("/api/favorites", { menuItemId });
      }
      // After successful toggle, refetch to ensure sync with server
      // This handles edge cases where server state might differ
      await fetchFavorites();
    } catch (err: any) {
      // Don't log 401 errors as they're expected when not logged in
      if (err?.statusCode !== 401) {
        logger.error("Error toggling favorite:", err);
      }
      // Revert optimistic update on error
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (currentlyFavorite) {
          newSet.add(menuItemId);
        } else {
          newSet.delete(menuItemId);
        }
        return newSet;
      });
      throw err;
    }
  }, [user, token, fetchFavorites]);

  const isFavorite = useCallback((menuItemId: string) => {
    return favorites.has(menuItemId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        initialized,
        isFavorite,
        toggleFavorite,
        refetch: fetchFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
