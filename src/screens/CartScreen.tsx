import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { useTheme, Card } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';
const CartScreen = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { t } = useTranslation();
  const [minOrderValue, setMinOrderValue] = useState<number>(0);

  useEffect(() => {
    // Fetch minimum order value setting when screen is focused
    if (isFocused) {
      axios
        .get("http://192.168.1.110:3000/api/settings/minOrderValue")
        .then((response: any) => {
          setMinOrderValue(parseFloat(response.data.value));
        })
        .catch((error: any) => {
          logger.warn("Could not fetch minimum order value:", error);
        });
    }
  }, [isFocused]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
          keyExtractor={(item) => item.menuItemId}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={item.name}
                subtitle={`€${item.price.toFixed(2)}`}
                left={() =>
                  item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.cartImage}
                    />
                  ) : (
                    <View style={styles.cartImagePlaceholder}>
                      <Text style={{ fontSize: 20 }}>🍽️</Text>
                    </View>
                  )
                }
              />
              <Card.Content>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.menuItemId, item.quantity - 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      updateQuantity(item.menuItemId, item.quantity + 1)
                    }
                    style={styles.qtyBtn}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.menuItemId)}
                    style={styles.removeBtn}
                  >
                    <Text style={{ color: "red", fontWeight: "bold" }}>
                      {t("cart.removeItem")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </Card>
          )}
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
  card: { marginBottom: 12, backgroundColor: "#2d2117" },
  cartImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  cartImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3a2b1f",
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
  removeBtn: { marginLeft: 16 },
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


