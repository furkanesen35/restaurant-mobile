import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Card, useTheme } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

const AdminScreen = () => {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      console.log("Admin fetching orders with token:", token);
      const response = await fetch("http://192.168.1.110:3000/order/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch orders: ${response.status} - ${errorText}`,
        );
      }
      const data = await response.json();
      console.log("Admin orders fetched:", data.length, "orders");
      setOrders(data);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      Alert.alert("Error", err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isFocused && user && token) {
      fetchOrders();
    }
  }, [isFocused, user, token, fetchOrders]);

  const updateStatus = async (orderId: number, status: string) => {
    if (!token) return;
    try {
      const response = await fetch(
        `http://192.168.1.110:3000/order/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) throw new Error("Failed to update status");
      Alert.alert("Success", `Order #${orderId} status updated to ${status}`);
      fetchOrders(); // Refresh orders after update
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update order status");
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.error }}>Access denied.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.primary }]}>All Orders</Text>
      {loading ? (
        <Text style={{ color: colors.onBackground }}>Loading orders...</Text>
      ) : orders.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: colors.onBackground, fontSize: 16 }}>
            No orders found
          </Text>
          <Text
            style={{ color: colors.onBackground, fontSize: 14, marginTop: 8 }}
          >
            Orders will appear here when customers place them
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Title
                title={`Order #${item.id}`}
                subtitle={`Status: ${item.status}`}
              />
              <Card.Content>
                <Text style={{ color: colors.onBackground }}>
                  User: {item.userId}
                </Text>
                <Text style={{ color: colors.onBackground }}>Items:</Text>
                {item.items.map((orderItem: any) => (
                  <Text
                    key={orderItem.id}
                    style={{ color: colors.onBackground, marginLeft: 8 }}
                  >
                    - {orderItem.menuItem?.name || "Item"} x{orderItem.quantity}
                  </Text>
                ))}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ flexDirection: "row", marginTop: 8 }}
                >
                  {STATUS_OPTIONS.map((status) =>
                    status === "cancelled" ? (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusBtn,
                          {
                            backgroundColor:
                              item.status === status
                                ? colors.primary
                                : "#fffbe8",
                          },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Cancel Order",
                            "Are you sure you want to cancel this order? This action cannot be undone.",
                            [
                              { text: "No", style: "cancel" },
                              {
                                text: "Yes",
                                style: "destructive",
                                onPress: async () => {
                                  try {
                                    const response = await fetch(
                                      `http://192.168.1.110:3000/order/${item.id}`,
                                      {
                                        method: "DELETE",
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                          "Content-Type": "application/json",
                                        },
                                      },
                                    );
                                    if (!response.ok)
                                      throw new Error("Failed to delete order");
                                    Alert.alert("Order cancelled and deleted");
                                    fetchOrders();
                                  } catch (err: any) {
                                    Alert.alert(
                                      "Error",
                                      err.message || "Failed to delete order",
                                    );
                                  }
                                },
                              },
                            ],
                          );
                        }}
                        disabled={item.status === status}
                      >
                        <Text
                          style={{
                            color:
                              item.status === status ? colors.onPrimary : "red",
                            fontWeight: "bold",
                          }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.statusBtn,
                          {
                            backgroundColor:
                              item.status === status
                                ? colors.primary
                                : "#fffbe8",
                          },
                        ]}
                        onPress={() => updateStatus(item.id, status)}
                        disabled={item.status === status}
                      >
                        <Text
                          style={{
                            color:
                              item.status === status
                                ? colors.onPrimary
                                : "#231a13",
                          }}
                        >
                          {status}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              </Card.Content>
            </Card>
          )}
        />
      )}
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
  statusBtn: {
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 4,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default AdminScreen;
