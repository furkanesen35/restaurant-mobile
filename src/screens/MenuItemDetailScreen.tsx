import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { MenuItem, MenuItemModifier, SelectedModifier } from "../types";
import ENV from "../config/env";
import logger from "../utils/logger";

type RouteParams = {
  item: MenuItem;
};

const MenuItemDetailScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params as RouteParams;
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch modifiers for this item
  useEffect(() => {
    const fetchModifiers = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${ENV.API_URL}/api/modifiers/menu-item/${item.id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch modifiers");
        }
        const data = await response.json();
        setModifiers(data.modifiers || []);
      } catch (err) {
        logger.error("Error fetching modifiers:", err);
        // Don't show error - modifiers are optional
      } finally {
        setLoading(false);
      }
    };

    fetchModifiers();
  }, [item.id]);

  // Get localized name for modifier
  const getModifierName = (modifier: MenuItemModifier) => {
    if (currentLanguage === "en" && modifier.nameEn) {
      return modifier.nameEn;
    }
    if (currentLanguage === "de" && modifier.nameDe) {
      return modifier.nameDe;
    }
    return modifier.name;
  };

  // Group modifiers by category
  const groupedModifiers = modifiers.reduce((acc, mod) => {
    const category = mod.category || t("modifiers.extras");
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(mod);
    return acc;
  }, {} as Record<string, MenuItemModifier[]>);

  // Handle modifier quantity change
  const updateModifierQuantity = (modifierId: number, delta: number) => {
    const modifier = modifiers.find((m) => m.id === modifierId);
    if (!modifier) return;

    setSelectedModifiers((prev) => {
      const existing = prev.find((m) => m.modifierId === modifierId);
      const currentQty = existing?.quantity || 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, modifier.maxQuantity));

      if (newQty === 0) {
        return prev.filter((m) => m.modifierId !== modifierId);
      }

      if (existing) {
        return prev.map((m) =>
          m.modifierId === modifierId ? { ...m, quantity: newQty } : m
        );
      }

      return [...prev, { modifierId, quantity: newQty }];
    });
  };

  // Get selected quantity for a modifier
  const getModifierQuantity = (modifierId: number) => {
    return selectedModifiers.find((m) => m.modifierId === modifierId)?.quantity || 0;
  };

  // Calculate total price
  const calculateTotal = () => {
    const basePrice = item.price * quantity;
    const modifiersPrice = selectedModifiers.reduce((sum, sel) => {
      const modifier = modifiers.find((m) => m.id === sel.modifierId);
      return sum + (modifier?.price || 0) * sel.quantity;
    }, 0);
    return basePrice + modifiersPrice * quantity;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      // Build modifiers array with names and prices for display
      const modifiersWithDetails = selectedModifiers.map((sel) => {
        const mod = modifiers.find((m) => m.id === sel.modifierId);
        return {
          modifierId: sel.modifierId,
          quantity: sel.quantity,
          name: mod ? getModifierName(mod) : "",
          price: mod?.price || 0,
        };
      });

      console.log("[MenuItemDetailScreen] Adding to cart:", {
        menuItemId: item.id,
        name: item.name,
        quantity,
        selectedModifiers,
        modifiersWithDetails,
      });

      await addToCart({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl ?? null,
        quantity,
        modifiers: modifiersWithDetails,
      });

      Alert.alert(
        t("cart.title"),
        t("cart.itemAdded"),
        [
          { text: t("cart.continueShopping"), style: "cancel" },
          {
            text: t("cart.goToCart"),
            onPress: () => {
              // First go back to MainTabs, then navigate to Cart tab
              navigation.goBack();
              // Use setTimeout to ensure the navigation back completes first
              setTimeout(() => {
                navigation.getParent()?.navigate("MainTabs", { screen: "Cart" });
              }, 100);
            },
          },
        ]
      );
    } catch (error: any) {
      const code = error?.code || error?.message;
      const statusCode = error?.statusCode;
      if (code === "LOGIN_REQUIRED" || statusCode === 401) {
        Alert.alert(t("auth.login"), t("cart.loginRequired"));
        return;
      }
      Alert.alert(t("common.error"), t("cart.updateFailed"));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(item.id);
    } catch (error: any) {
      const statusCode = error?.statusCode;
      const code = error?.code;
      if (code === "LOGIN_REQUIRED" || statusCode === 401) {
        Alert.alert(t("auth.login"), t("cart.loginRequired"));
      }
    }
  };

  const DietaryBadges = () => {
    const badges = [];
    if (item.isVegetarian)
      badges.push({ icon: "leaf", label: t("menu.vegetarian"), color: "#4caf50" });
    if (item.isVegan)
      badges.push({ icon: "nutrition", label: t("menu.vegan"), color: "#66bb6a" });
    if (item.isGlutenFree)
      badges.push({ icon: "restaurant", label: t("menu.glutenFree"), color: "#ff9800" });
    if (item.isSpicy)
      badges.push({ icon: "flame", label: t("menu.spicy"), color: "#f44336" });

    if (badges.length === 0) return null;

    return (
      <View style={styles.dietaryBadgesContainer}>
        {badges.map((badge, index) => (
          <View
            key={index}
            style={[
              styles.dietaryBadge,
              { backgroundColor: badge.color + "20", borderColor: badge.color },
            ]}
          >
            <Ionicons name={badge.icon as any} size={14} color={badge.color} />
            <Text style={[styles.dietaryBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fffbe8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={{ fontSize: 28 }}>
              {isFavorite(item.id) ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Image */}
        {item.imageUrl ? (
          <ImageBackground
            source={{ uri: item.imageUrl }}
            style={styles.imageHero}
            imageStyle={styles.imageRadius}
            resizeMode="cover"
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        ) : (
          <View style={[styles.imageHero, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
          </View>

          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}

          <DietaryBadges />

          {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
            <View style={styles.bonusPointsBadge}>
              <Text style={styles.bonusPointsText}>
                🌟 {item.loyaltyPointsMultiplier}x {t("profile.loyaltyPoints")}
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>{t("cart.quantity")}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#231a13" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color="#231a13" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Modifiers Section */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{t("common.loading")}</Text>
            </View>
          ) : modifiers.length > 0 ? (
            <View style={styles.modifiersSection}>
              <Text style={styles.sectionTitle}>{t("modifiers.addExtras")}</Text>

              {Object.entries(groupedModifiers).map(([category, mods]) => (
                <View key={category} style={styles.modifierCategory}>
                  <Text style={styles.modifierCategoryTitle}>{category}</Text>
                  {mods.map((mod) => (
                    <View key={mod.id} style={styles.modifierRow}>
                      <View style={styles.modifierInfo}>
                        <Text style={styles.modifierName}>
                          {getModifierName(mod)}
                        </Text>
                        <Text style={styles.modifierPrice}>
                          +€{mod.price.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.modifierControls}>
                        <TouchableOpacity
                          style={[
                            styles.modifierBtn,
                            getModifierQuantity(mod.id) === 0 &&
                              styles.modifierBtnDisabled,
                          ]}
                          onPress={() => updateModifierQuantity(mod.id, -1)}
                          disabled={getModifierQuantity(mod.id) === 0}
                        >
                          <Ionicons
                            name="remove"
                            size={16}
                            color={
                              getModifierQuantity(mod.id) === 0
                                ? "#666"
                                : "#231a13"
                            }
                          />
                        </TouchableOpacity>
                        <Text style={styles.modifierQty}>
                          {getModifierQuantity(mod.id)}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.modifierBtn,
                            getModifierQuantity(mod.id) >= mod.maxQuantity &&
                              styles.modifierBtnDisabled,
                          ]}
                          onPress={() => updateModifierQuantity(mod.id, 1)}
                          disabled={getModifierQuantity(mod.id) >= mod.maxQuantity}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color={
                              getModifierQuantity(mod.id) >= mod.maxQuantity
                                ? "#666"
                                : "#231a13"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>{t("cart.total")}</Text>
          <Text style={styles.totalPrice}>€{calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#231a13" />
          ) : (
            <>
              <Ionicons name="cart" size={20} color="#231a13" />
              <Text style={styles.addToCartBtnText}>{t("menu.addToCart")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  header: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageHero: {
    width: "100%",
    height: 280,
    backgroundColor: "#3a2b1f",
  },
  imageRadius: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  placeholderIcon: {
    fontSize: 80,
  },
  detailsContainer: {
    padding: 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  itemName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fffbe8",
    flex: 1,
    marginRight: 16,
  },
  itemPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e0b97f",
  },
  itemDescription: {
    fontSize: 16,
    color: "#b8a68a",
    lineHeight: 24,
    marginBottom: 16,
  },
  dietaryBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dietaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  dietaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bonusPointsBadge: {
    backgroundColor: "#d4af37",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  bonusPointsText: {
    color: "#231a13",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fffbe8",
    marginBottom: 12,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0b97f",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fffbe8",
    minWidth: 30,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: "#b8a68a",
    fontSize: 14,
  },
  modifiersSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
  },
  modifierCategory: {
    marginBottom: 16,
  },
  modifierCategoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e0b97f",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modifierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#2d2117",
    borderRadius: 12,
    marginBottom: 8,
  },
  modifierInfo: {
    flex: 1,
  },
  modifierName: {
    fontSize: 16,
    color: "#fffbe8",
    fontWeight: "500",
  },
  modifierPrice: {
    fontSize: 14,
    color: "#b8a68a",
    marginTop: 2,
  },
  modifierControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modifierBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0b97f",
    justifyContent: "center",
    alignItems: "center",
  },
  modifierBtnDisabled: {
    backgroundColor: "#3a2b1f",
  },
  modifierQty: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fffbe8",
    minWidth: 24,
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#2d2117",
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
    gap: 16,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#b8a68a",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fffbe8",
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addToCartBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#231a13",
  },
});

export default MenuItemDetailScreen;
