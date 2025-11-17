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
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, useTheme, IconButton } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useIsFocused } from "@react-navigation/native";
import { MenuItem } from "../types";
import { formatCurrency, parseErrorMessage } from "../utils/validation";
import apiClient from "../utils/apiClient";
import ErrorMessage from "../components/common/ErrorMessage";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';
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
  const { t } = useTranslation();

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
        logger.error("Error fetching favorites:", err);
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
      Alert.alert(t("common.success"), t("menu.removeFromFavorites"));
    } catch (err: any) {
      logger.error("Error removing favorite:", err);
      Alert.alert(t("common.error"), t("errors.somethingWentWrong"));
    }
  };

  const handleCartError = useCallback(
    (error: any) => {
      const code = error?.code || error?.message;
      if (code === "LOGIN_REQUIRED") {
        Alert.alert(t("auth.login"), t("cart.loginRequired"));
        return;
      }
      Alert.alert(t("common.error"), t("cart.updateFailed"));
    },
    [t]
  );

  const handleAddToCart = useCallback(
    async (item: MenuItem) => {
      try {
        await addToCart({
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl ?? null,
        });
      } catch (error: any) {
        handleCartError(error);
      }
    },
    [addToCart, handleCartError, t]
  );

  const handleRefresh = () => {
    fetchFavorites(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Text style={styles.title}>{t("menu.favorites")}</Text>

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
            <Text style={styles.errorTitle}>{t("errors.somethingWentWrong")}</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchFavorites()}
            >
              <Text style={styles.retryButtonText}>{t("errors.tryAgain")}</Text>
            </TouchableOpacity>
          </View>
        ) : favorites.length > 0 ? (
          favorites.map((favorite) => (
            <Card key={favorite.id} style={styles.favoriteCard}>
              {favorite.menuItem.imageUrl ? (
                <Card.Cover
                  source={{ uri: favorite.menuItem.imageUrl }}
                  style={styles.favoriteImage}
                />
              ) : null}
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
                  <Text style={styles.addButtonText}>{t("menu.addToCart")}</Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>♥</Text>
            <Text style={styles.emptyText}>{t("menu.favorites")}</Text>
            <Text style={styles.emptySubText}>
              {t("menu.addToFavorites")}
            </Text>
          </View>
        )}
      </ScrollView>

      <ErrorMessage error={error} onDismiss={() => setError(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // MAIN CONTAINER - The entire Favorites screen wrapper
  // Used by: Root View component wrapping all favorites content
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    padding: 16, // 16px padding on all sides (top, right, bottom, left)
  },

  // ============================================================================
  // CENTERED - Used for loading and empty states
  // Used by: View when showing loading spinner or empty state
  // ============================================================================
  centered: {
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
  },

  // ============================================================================
  // SCREEN TITLE - "My Favorites" heading at top
  // Used by: Text component showing screen title
  // ============================================================================
  title: {
    fontSize: 28, // Large text for main heading
    fontWeight: "bold", // Bold for emphasis
    color: "#fffbe8", // Light cream color
    textAlign: "center", // Centers text horizontally
    marginBottom: 24, // 24px space before favorites list
  },

  // ============================================================================
  // LOADING TEXT - "Loading favorites..." text
  // Used by: Text shown while fetching favorites from API
  // ============================================================================
  loadingText: {
    color: "#fffbe8", // Light cream color
    fontSize: 16, // Standard readable size
  },

  // ============================================================================
  // SCROLL CONTENT - ScrollView content wrapper for favorite cards
  // Used by: ScrollView contentContainerStyle holding all favorite cards
  // ============================================================================
  scrollContent: {
    paddingBottom: 20, // 20px bottom padding for scroll overrun
  },

  // ============================================================================
  // FAVORITE CARD - Individual card showing one favorited menu item
  // Used by: Card component for each favorite in the list
  // ============================================================================
  favoriteCard: {
    marginBottom: 16, // 16px space between favorite cards
    backgroundColor: "#2d2117", // Dark brown card background
    borderRadius: 16, // Rounded corners for modern look
    borderWidth: 1, // 1px border
    borderColor: "#e0b97f", // Gold border to match theme
  },

  favoriteImage: {
    height: 170,
    backgroundColor: "#3a2b1f",
  },

  // ============================================================================
  // CARD HEADER - Top row with item name/price and heart button
  // Used by: View at top of each favorite card
  // ============================================================================
  cardHeader: {
    flexDirection: "row", // Arranges item info and heart horizontally
    justifyContent: "space-between", // Pushes item info left and heart right
    alignItems: "flex-start", // Aligns items to top
    marginBottom: 8, // 8px space before description
  },

  // ============================================================================
  // ITEM INFO - Container for item name and price
  // Used by: View wrapping name and price text
  // ============================================================================
  itemInfo: {
    flex: 1, // Takes remaining space (lets heart stay at edge)
  },

  // ============================================================================
  // ITEM NAME - Menu item name (e.g., "Margherita Pizza")
  // Used by: Text component displaying item name
  // ============================================================================
  itemName: {
    fontSize: 18, // Large text for item name prominence
    fontWeight: "bold", // Bold for emphasis
    color: "#fffbe8", // Light cream color
    marginBottom: 4, // 4px space below name
  },

  // ============================================================================
  // ITEM PRICE - Menu item price (e.g., "€12.50")
  // Used by: Text component showing item price
  // ============================================================================
  itemPrice: {
    fontSize: 16, // Medium text for price
    color: "#e0b97f", // Gold accent color
    fontWeight: "600", // Semi-bold for emphasis
  },

  // ============================================================================
  // ITEM DESCRIPTION - Menu item description text
  // Used by: Text component showing item description
  // ============================================================================
  itemDescription: {
    fontSize: 14, // Standard readable size
    color: "#fffbe8", // Light cream color
    opacity: 0.8, // Slightly transparent (80% visible) for hierarchy
    marginBottom: 12, // 12px space before badges
  },

  // ============================================================================
  // BADGES CONTAINER - Row of dietary badges (V, VG, GF, Spicy)
  // Used by: View wrapping all dietary badge pills
  // ============================================================================
  badgesContainer: {
    flexDirection: "row", // Arranges badges horizontally
    flexWrap: "wrap", // Wraps to next line if too many badges
    gap: 6, // 6px space between each badge
    marginBottom: 12, // 12px space before add to cart button
  },

  // ============================================================================
  // BADGE - Individual dietary badge pill (Vegetarian, Vegan, etc.)
  // Used by: View for each dietary indicator badge
  // ============================================================================
  badge: {
    paddingHorizontal: 8, // 8px left/right inner padding
    paddingVertical: 4, // 4px top/bottom inner padding
    borderRadius: 12, // Rounded pill shape
    borderWidth: 1, // 1px border
    backgroundColor: "transparent", // No background (just border and text)
    // Border color is set dynamically per badge type (green, orange, red, etc.)
  },

  // ============================================================================
  // BADGE TEXT - Text inside badges (V, VG, GF, 🌶)
  // Used by: Text inside each dietary badge
  // ============================================================================
  badgeText: {
    fontSize: 11, // Small text for compact badges
    fontWeight: "600", // Semi-bold text
    // Color is set dynamically per badge type
  },

  // ============================================================================
  // ADD BUTTON - "Add to Cart" button on each favorite card
  // Used by: TouchableOpacity for adding item to cart
  // ============================================================================
  addButton: {
    backgroundColor: "#e0b97f", // Gold button background
    borderRadius: 8, // Rounded corners
    padding: 12, // 12px padding all sides
    alignItems: "center", // Centers button text horizontally
  },

  // ============================================================================
  // ADD BUTTON TEXT - Text inside "Add to Cart" button
  // Used by: Text inside add to cart button
  // ============================================================================
  addButtonText: {
    color: "#231a13", // Dark text on gold button for high contrast
    fontWeight: "bold", // Bold for emphasis
    fontSize: 14, // Standard button text size
  },

  // ============================================================================
  // EMPTY STATE - Container shown when no favorites exist
  // Used by: View displayed when favorites list is empty
  // ============================================================================
  emptyState: {
    alignItems: "center", // Centers content horizontally
    paddingVertical: 60, // 60px padding top/bottom for breathing room
  },

  // ============================================================================
  // EMPTY ICON - Large heart icon shown in empty state
  // Used by: Text/Icon component showing empty state visual
  // ============================================================================
  emptyIcon: {
    fontSize: 64, // Very large icon for visual impact
    color: "#e0b97f40", // Semi-transparent gold (25% opacity)
    marginBottom: 16, // 16px space below icon
  },

  // ============================================================================
  // EMPTY TEXT - "No favorites yet" main message
  // Used by: Text component in empty state
  // ============================================================================
  emptyText: {
    fontSize: 18, // Medium-large text
    color: "#fffbe8", // Light cream color
    fontWeight: "bold", // Bold for visibility
    marginBottom: 8, // 8px space before subtitle
  },

  // ============================================================================
  // EMPTY SUB TEXT - "Start adding items..." subtitle
  // Used by: Text component below emptyText
  // ============================================================================
  emptySubText: {
    fontSize: 14, // Smaller than main text
    color: "#e0b97f", // Gold accent color
    textAlign: "center", // Centers text for multi-line messages
    paddingHorizontal: 40, // 40px padding left/right for text wrapping
  },

  // ============================================================================
  // ERROR CONTAINER - Wrapper shown when favorites fetch fails
  // Used by: View displayed on API error
  // ============================================================================
  errorContainer: {
    alignItems: "center", // Centers error message horizontally
    paddingVertical: 40, // 40px padding top/bottom
    paddingHorizontal: 20, // 20px padding left/right
  },

  // ============================================================================
  // ERROR TITLE - "Failed to load favorites" heading
  // Used by: Text showing main error message
  // ============================================================================
  errorTitle: {
    color: "#ff6b6b", // Red color indicates error
    fontSize: 18, // Large for visibility
    fontWeight: "bold", // Bold for emphasis
    marginBottom: 8, // 8px space before error details
    textAlign: "center", // Centers text
  },

  // ============================================================================
  // ERROR TEXT - Detailed error message
  // Used by: Text showing error details/description
  // ============================================================================
  errorText: {
    color: "#fffbe8", // Light cream color
    fontSize: 14, // Standard size
    textAlign: "center", // Centers text for readability
    marginBottom: 20, // 20px space before retry button
    opacity: 0.8, // Slightly transparent (80% visible)
  },

  // ============================================================================
  // RETRY BUTTON - Button to retry failed request
  // Used by: TouchableOpacity to refresh favorites after error
  // ============================================================================
  retryButton: {
    backgroundColor: "#e0b97f", // Gold background
    paddingHorizontal: 20, // 20px left/right padding
    paddingVertical: 10, // 10px top/bottom padding
    borderRadius: 8, // Rounded corners
  },

  // ============================================================================
  // RETRY BUTTON TEXT - "Try Again" text
  // Used by: Text inside retry button
  // ============================================================================
  retryButtonText: {
    color: "#231a13", // Dark text on light button
    fontSize: 14, // Standard size
    fontWeight: "600", // Semi-bold
  },
});

export default FavoritesScreen;


