import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "../contexts/CartContext";
import { useTheme, Card } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import axios from "axios";

const CartScreen = () => {
  const { cart, updateQuantity, removeFromCart } = useCart();
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
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
          console.log("Could not fetch minimum order value:", error);
        });
    }
  }, [isFocused]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isBelowMinimum = minOrderValue > 0 && total < minOrderValue;

  const handleProceedToCheckout = () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to place an order.");
      return;
    }
    if (cart.length === 0) {
      Alert.alert("Empty cart", "Please add items to your cart first.");
      return;
    }
    if (isBelowMinimum) {
      Alert.alert(
        "Minimum order not met",
        `Minimum order value is €${minOrderValue.toFixed(2)}. Please add €${(minOrderValue - total).toFixed(2)} more to your cart.`
      );
      return;
    }
    navigation.navigate("Checkout" as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Your Cart</Text>
      {cart.length === 0 ? (
        <Text style={{ color: colors.onBackground, fontSize: 18 }}>
          Cart is empty.
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
                      Remove
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
            ⚠️ Minimum order: €{minOrderValue.toFixed(2)} • Add €
            {(minOrderValue - total).toFixed(2)} more
          </Text>
        </View>
      )}
      <Text style={[styles.total, { color: colors.primary }]}>
        Total: €{total.toFixed(2)}
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
          Proceed to Checkout
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
