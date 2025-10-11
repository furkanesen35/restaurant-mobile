import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useCart } from "../contexts/CartContext";
import { useTheme, Card } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";

const CartScreen = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { colors } = useTheme();
  const { user } = useAuth();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleOrder = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to place an order.");
      return;
    }
    try {
      const items = cart.map((i) => ({
        menuItemId: parseInt(i.menuItemId),
        quantity: i.quantity,
      }));
      const payload = {
        userId: user.id,
        items: Array.from(items), // ensure it's a proper array
      };
      console.log("Order payload before stringify:", payload);
      console.log(
        "Items type check:",
        Array.isArray(payload.items),
        payload.items,
      );

      const bodyString = JSON.stringify(payload);
      console.log("Stringified body:", bodyString);

      const response = await fetch("http://192.168.1.110:3000/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: bodyString,
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Order failed with status:",
          response.status,
          "Error:",
          errorText,
        );
        throw new Error(`Order failed: ${response.status}`);
      }
      clearCart();
      Alert.alert("Order placed!", "Your order has been received.");
    } catch (err: any) {
      console.error("Order placement error:", err);
      Alert.alert("Error", err.message || "Failed to place order");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.primary }]}>Your Cart</Text>
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
                subtitle={`₺${item.price.toFixed(2)}`}
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
      <Text style={[styles.total, { color: colors.primary }]}>
        Total: ₺{total.toFixed(2)}
      </Text>
      <TouchableOpacity
        style={[styles.orderBtn, { backgroundColor: colors.primary }]}
        onPress={handleOrder}
        disabled={cart.length === 0}
      >
        <Text
          style={{ color: colors.onPrimary, fontWeight: "bold", fontSize: 18 }}
        >
          Place Order
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#231a13" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
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
