import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../contexts/CartContext";
import { useTheme, Card } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';
import ENV from "../config/env";
import { CartItem } from "../contexts/CartContext";

// Calculate item total including modifiers
const calculateItemTotal = (item: CartItem) => {
  const basePrice = item.price * item.quantity;
  const modifiersPrice = (item.modifiers || []).reduce((sum, mod) => {
    return sum + (mod.price || 0) * mod.quantity;
  }, 0);
  return basePrice + modifiersPrice * item.quantity;
};
const CartScreen = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [minOrderValue, setMinOrderValue] = useState<number>(0);

  useEffect(() => {
    if (!isFocused) return;

    let isMounted = true;

    const fetchMinOrder = async () => {
      try {
        const response = await fetch(`${ENV.API_URL}/api/settings/minOrderValue`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        if (isMounted && data?.value) {
          setMinOrderValue(parseFloat(data.value));
        }
      } catch (error) {
        logger.warn("Could not fetch minimum order value:", error);
      }
    };

    fetchMinOrder();

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

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

  const handleUpdateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      try {
        await updateQuantity(cartItemId, quantity);
      } catch (error) {
        handleCartError(error);
      }
    },
    [updateQuantity, handleCartError]
  );

  const handleRemoveItem = useCallback(
    async (cartItemId: number) => {
      try {
        await removeFromCart(cartItemId);
      } catch (error) {
        handleCartError(error);
      }
    },
    [removeFromCart, handleCartError]
  );

  const total = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const isBelowMinimum = minOrderValue > 0 && total < minOrderValue;

  const handleProceedToCheckout = () => {
    if (!user) {
      Alert.alert(t("auth.login"), t("auth.login"));
      return;
    }
    if (cart.length === 0) {
      Alert.alert(t("cart.emptyCart"), t("cart.emptyCart"));
      return;
    }
    if (isBelowMinimum) {
      Alert.alert(
        t("cart.title"),
        `${t("cart.total")}: €${minOrderValue.toFixed(2)}. ${t("cart.continueShopping")}`
      );
      return;
    }
    navigation.navigate("Checkout" as never);
  };

  // Debug: Log cart items
  logger.log("[CartScreen] Rendering cart with items:", JSON.stringify(cart, null, 2));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>{t("cart.title")}</Text>
      {cart.length === 0 ? (
        <Text style={{ color: colors.onBackground, fontSize: 18 }}>
          {t("cart.emptyCart")}
        </Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.cartItemId.toString()}
          renderItem={({ item }) => {
            const itemTotal = calculateItemTotal(item);
            const hasModifiers = item.modifiers && item.modifiers.length > 0;
            logger.log("[CartScreen] Item:", item.name, "hasModifiers:", hasModifiers, "modifiers:", item.modifiers);
            
            return (
              <Card style={styles.card}>
                {item.imageUrl ? (
                  <ImageBackground
                    source={{ uri: item.imageUrl }}
                    style={styles.cartImageHero}
                    imageStyle={styles.cartImageHeroRadius}
                    resizeMode="cover"
                  >
                    <View style={styles.cartImageOverlay} />
                    <View style={styles.cartImageTextBar}>
                      <Text style={styles.cartImageTitle}>{item.name}</Text>
                      <Text style={styles.cartImagePrice}>€{item.price.toFixed(2)}</Text>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.cartImageHero, styles.cartImageFallback]}>
                    <Text style={styles.cartFallbackIcon}>🍽️</Text>
                    <Text style={styles.cartFallbackName}>{item.name}</Text>
                    <Text style={styles.cartFallbackPrice}>€{item.price.toFixed(2)}</Text>
                  </View>
                )}
                <Card.Content>
                  {/* Display modifiers if any */}
                  {hasModifiers && (
                    <View style={styles.modifiersContainer}>
                      {item.modifiers!.map((mod, idx) => (
                        <View key={idx} style={styles.modifierRow}>
                          <Text style={styles.modifierText}>
                            + {mod.name} {mod.quantity > 1 ? `(x${mod.quantity})` : ""}
                          </Text>
                          <Text style={styles.modifierPrice}>
                            €{((mod.price || 0) * mod.quantity).toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Display special instructions if any */}
                  {item.specialInstructions && (
                    <View style={styles.specialInstructionsContainer}>
                      <Ionicons name="document-text-outline" size={14} color="#b8a68a" />
                      <Text style={styles.specialInstructionsText}>
                        {item.specialInstructions}
                      </Text>
                    </View>
                  )}
                  
                  {/* Subtotal for this item */}
                  <View style={styles.itemSubtotalRow}>
                    <Text style={styles.itemSubtotalLabel}>
                      {t("cart.subtotal")} (x{item.quantity})
                    </Text>
                    <Text style={styles.itemSubtotalPrice}>€{itemTotal.toFixed(2)}</Text>
                  </View>

                  <View style={styles.cartActionsRow}>
                    <View style={styles.quantityGroup}>
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          handleUpdateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        style={styles.qtyBtn}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(item.cartItemId)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>
                        {t("cart.removeItem")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            );
          }}
        />
      )}
      {minOrderValue > 0 && isBelowMinimum && cart.length > 0 && (
        <View style={styles.minOrderWarning}>
          <Text style={styles.minOrderWarningText}>
            ⚠️ {t("cart.total")}: €{minOrderValue.toFixed(2)} • {t("cart.continueShopping")}
          </Text>
        </View>
      )}
      <Text style={[styles.total, { color: colors.primary }]}>
        {t("cart.total")}: €{total.toFixed(2)}
      </Text>
      <TouchableOpacity
        style={[
          styles.orderBtn,
          { backgroundColor: isBelowMinimum ? "#666" : colors.primary },
        ]}
        onPress={handleProceedToCheckout}
        disabled={cart.length === 0 || isBelowMinimum}
      >
        <Text
          style={{ color: colors.onPrimary, fontWeight: "bold", fontSize: 18 }}
        >
          {t("cart.checkout")}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#231a13" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
    color: "#fffbe8",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 24,
    overflow: "hidden",
  },
  cartImageHero: {
    width: "100%",
    height: 190,
    backgroundColor: "#3a2b1f",
    justifyContent: "flex-end",
  },
  cartImageHeroRadius: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  cartImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  cartImageTextBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartImageTitle: {
    color: "#fffbe8",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginRight: 12,
  },
  cartImagePrice: {
    color: "#fffbe8",
    fontSize: 18,
    fontWeight: "600",
  },
  cartImageFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  cartFallbackIcon: {
    fontSize: 42,
  },
  cartFallbackName: {
    color: "#fffbe8",
    fontSize: 20,
    fontWeight: "700",
  },
  cartFallbackPrice: {
    color: "#e0b97f",
    fontSize: 18,
    fontWeight: "600",
  },
  cartActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },
  modifiersContainer: {
    backgroundColor: "#1a120b",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  modifierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  modifierText: {
    color: "#b8a68a",
    fontSize: 14,
  },
  modifierPrice: {
    color: "#e0b97f",
    fontSize: 14,
    fontWeight: "500",
  },
  specialInstructionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#1a120b",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  specialInstructionsText: {
    flex: 1,
    color: "#b8a68a",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  itemSubtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
    marginTop: 4,
  },
  itemSubtotalLabel: {
    color: "#b8a68a",
    fontSize: 14,
  },
  itemSubtotalPrice: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "700",
  },
  quantityGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    backgroundColor: "#fffbe8",
    borderRadius: 8,
    padding: 6,
    marginHorizontal: 8,
  },
  qtyBtnText: { fontSize: 18, color: "#231a13", fontWeight: "bold" },
  qtyText: {
    fontSize: 18,
    color: "#fffbe8",
    minWidth: 24,
    textAlign: "center",
  },
  removeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removeBtnText: {
    color: "#ef5350",
    fontWeight: "700",
  },
  minOrderWarning: {
    backgroundColor: "#8b4513",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  minOrderWarningText: {
    color: "#fffbe8",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  total: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 16,
    alignSelf: "flex-end",
  },
  orderBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
});

export default CartScreen;


