import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { Card, useTheme, IconButton } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useIsFocused } from "@react-navigation/native";
import { MenuItem } from "../types";
import { formatCurrency, parseErrorMessage } from "../utils/validation";
import apiClient from "../utils/apiClient";
import ErrorMessage from "../components/common/ErrorMessage";

interface Favorite {
  id: number;
  menuItem: MenuItem;
  createdAt: string;
}

const FavoritesScreen = () => {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const { addToCart } = useCart();
  const isFocused = useIsFocused();

  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFavorites = useCallback(
    async (isRefresh = false) => {
      if (!user || !token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Favorite[]>("/api/favorites");
        setFavorites(response.data || []);
      } catch (err: any) {
        const errorMessage = parseErrorMessage(err);
        setError(errorMessage);
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, token]
  );

  useEffect(() => {
    if (isFocused) {
      fetchFavorites();
    }
  }, [isFocused, fetchFavorites]);

  const removeFavorite = async (menuItemId: string) => {
    try {
      await apiClient.delete(`/api/favorites/${menuItemId}`);
      setFavorites((prev) =>
        prev.filter((fav) => fav.menuItem.id !== menuItemId)
      );
      Alert.alert("Success", "Removed from favorites");
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      Alert.alert("Error", "Failed to remove from favorites");
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
    });
    Alert.alert("Added to Cart", `${item.name} has been added to your cart`);
  };

  const handleRefresh = () => {
    fetchFavorites(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.title}>My Favorites</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#e0b97f"]}
            tintColor="#e0b97f"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load favorites</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchFavorites()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : favorites.length > 0 ? (
          favorites.map((favorite) => (
            <Card key={favorite.id} style={styles.favoriteCard}>
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {favorite.menuItem.name}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(favorite.menuItem.price)}
                    </Text>
                  </View>
                  <IconButton
                    icon="heart"
                    iconColor="#f44336"
                    size={24}
                    onPress={() => removeFavorite(favorite.menuItem.id)}
                  />
                </View>

                {favorite.menuItem.description && (
                  <Text style={styles.itemDescription}>
                    {favorite.menuItem.description}
                  </Text>
                )}

                {/* Dietary badges */}
                <View style={styles.badgesContainer}>
                  {favorite.menuItem.isVegetarian && (
                    <View style={[styles.badge, { borderColor: "#4caf50" }]}>
                      <Text style={[styles.badgeText, { color: "#4caf50" }]}>
                        V
                      </Text>
                    </View>
                  )}
                  {favorite.menuItem.isVegan && (
                    <View style={[styles.badge, { borderColor: "#66bb6a" }]}>
                      <Text style={[styles.badgeText, { color: "#66bb6a" }]}>
                        VG
                      </Text>
                    </View>
                  )}
                  {favorite.menuItem.isGlutenFree && (
                    <View style={[styles.badge, { borderColor: "#ff9800" }]}>
                      <Text style={[styles.badgeText, { color: "#ff9800" }]}>
                        GF
                      </Text>
                    </View>
                  )}
                  {favorite.menuItem.isSpicy && (
                    <View style={[styles.badge, { borderColor: "#f44336" }]}>
                      <Text style={[styles.badgeText, { color: "#f44336" }]}>
                        🌶
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCart(favorite.menuItem)}
                >
                  <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>♥</Text>
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptySubText}>
              Tap the heart icon on menu items to save your favorites!
            </Text>
          </View>
        )}
      </ScrollView>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fffbe8",
    textAlign: "center",
    marginBottom: 24,
  },
  loadingText: {
    color: "#fffbe8",
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  favoriteCard: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fffbe8",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: "#e0b97f",
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: 14,
    color: "#fffbe8",
    opacity: 0.8,
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#231a13",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    color: "#e0b97f40",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: "#fffbe8",
    fontWeight: "bold",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#e0b97f",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: "#ff6b6b",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    color: "#fffbe8",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: "#e0b97f",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#231a13",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default FavoritesScreen;
