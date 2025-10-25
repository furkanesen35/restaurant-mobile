import { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";
import { useAuth } from "../contexts/AuthContext";

export const useFavorites = () => {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!user || !token) return;
    try {
      setLoading(true);
      const response = await apiClient.get<
        Array<{ menuItem: { id: string } }>
      >("/api/favorites");
      const favoriteIds = new Set(
        (response.data || []).map((fav) => fav.menuItem.id)
      );
      setFavorites(favoriteIds);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = async (menuItemId: string) => {
    if (!user || !token) return;

    const isFavorite = favorites.has(menuItemId);

    // Optimistic update
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (isFavorite) {
        newSet.delete(menuItemId);
      } else {
        newSet.add(menuItemId);
      }
      return newSet;
    });

    try {
      if (isFavorite) {
        await apiClient.delete(`/api/favorites/${menuItemId}`);
      } else {
        await apiClient.post("/api/favorites", { menuItemId });
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      // Revert optimistic update on error
      setFavorites((prev) => {
        const newSet = new Set(prev);
        if (isFavorite) {
          newSet.add(menuItemId);
        } else {
          newSet.delete(menuItemId);
        }
        return newSet;
      });
    }
  };

  const isFavorite = (menuItemId: string) => favorites.has(menuItemId);

  return {
    favorites,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
