import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Card, Chip, useTheme, ProgressBar } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";

import { OrderStatus, Order, OrderItem } from "../types";
import { formatCurrency, formatRelativeTime, parseErrorMessage } from "../utils/validation";
import apiClient from "../utils/apiClient";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingOverlay from "../components/common/LoadingOverlay";

const OrdersScreen = () => {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const fetchOrders = async (isRefresh = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await apiClient.get<Order[]>(`/order/user/${user.id}`);
      setOrders(response.data || []);
    } catch (err: any) {
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [user, token, isFocused]);

  const handleRefresh = () => {
    fetchOrders(true);
  };

  // Split orders into current and history
  const currentOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );
  const orderHistory = orders.filter(
    (o) => o.status === "delivered" || o.status === "cancelled"
  );


  const OrderCard = React.memo(({ order }: { order: Order }) => {
    // Calculate total from items
    const total =
      order.items && Array.isArray(order.items)
        ? order.items.reduce(
            (sum: number, oi: OrderItem) => sum + (oi.menuItem?.price || 0) * (oi.quantity || 1),
            0
          )
        : order.total || 0;

    return (
      <Card style={styles.orderCard}>
        <Card.Content>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{order.id}</Text>
            {order.createdAt && (
              <Text style={styles.orderTime}>
                {formatRelativeTime(order.createdAt)}
              </Text>
            )}
          </View>
          <Chip
            mode="outlined"
            style={styles.statusChip}
          >
            {order.status}
          </Chip>
          {/* Items */}
          <View style={styles.itemsList}>
            {order.items && order.items.length > 0 ? (
              order.items.map((oi: OrderItem, idx: number) => (
                <Text key={idx} style={styles.orderItem}>
                  • {oi.menuItem?.name || "Item"} x{oi.quantity}
                </Text>
              ))
            ) : (
              <Text style={styles.orderItem}>No items available</Text>
            )}
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.orderTotal}>
              Total: {formatCurrency(total)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  });


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.title}>My Orders</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "current" && styles.activeTab]}
          onPress={() => setActiveTab("current")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "current" && styles.activeTabText,
            ]}
          >
            Current Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "history" && styles.activeTabText,
            ]}
          >
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.ordersContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#e0b97f']}
            tintColor="#e0b97f"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load orders</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === "current" ? (
          currentOrders.length > 0 ? (
            currentOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No current orders</Text>
              <Text style={styles.emptySubText}>
                Place an order from our menu to get started!
              </Text>
            </View>
          )
        ) : orderHistory.length > 0 ? (
          orderHistory.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No order history</Text>
            <Text style={styles.emptySubText}>
              Your completed orders will appear here.
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fffbe8",
    textAlign: "center",
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#2d2117",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#e0b97f",
  },
  tabText: {
    color: "#fffbe8",
    fontWeight: "bold",
  },
  activeTabText: {
    color: "#231a13",
  },
  ordersContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fffbe8",
  },
  orderTime: {
    fontSize: 14,
    color: "#e0b97f",
  },
  statusChip: {
    alignSelf: "flex-start",
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#231a13",
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 12,
    color: "#e0b97f",
    textAlign: "center",
  },
  itemsList: {
    marginBottom: 12,
  },
  orderItem: {
    color: "#fffbe8",
    fontSize: 14,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e0b97f",
    textAlign: "right",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#fffbe8',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#ff6b6b',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#fffbe8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: '#e0b97f',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#231a13',
    fontSize: 14,
    fontWeight: '600',
  },
  orderFooter: {
    marginTop: 8,
  },
});

export default OrdersScreen;
