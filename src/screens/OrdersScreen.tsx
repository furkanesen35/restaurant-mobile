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
import { Card, Chip, useTheme, Button } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";

import { Order, OrderItem, OrderStatus } from "../types";
import {
  formatCurrency,
  formatRelativeTime,
  parseErrorMessage,
} from "../utils/validation";
import apiClient from "../utils/apiClient";
import ErrorMessage from "../components/common/ErrorMessage";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';

const OrdersScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user, token, updateUser } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFocused = useIsFocused();

  const fetchOrders = useCallback(
    async (isRefresh = false) => {
      if (!user || !token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Order[]>(`/order/user/${user.id}`);
        setOrders(response.data || []);
      } catch (err: any) {
        const errorMessage = parseErrorMessage(err);
        setError(errorMessage);
        // Don't log 401 errors as they're expected when not logged in
        if (err?.statusCode !== 401) {
          logger.error("Error fetching orders:", err);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, token]
  );

  const cancelOrder = async (orderId: string | number) => {
    try {
      const response = await apiClient.patch<{
        loyaltyPointsBalance?: number;
        loyaltyPointsDeducted?: number;
        refund?: {
          refundId?: string;
          refundStatus?: string;
          refundAmount?: number;
          error?: string;
        };
      }>(`/order/${orderId}/status`, {
        status: "cancelled",
      });
      
      // Update user's loyalty points if they were deducted
      if (response.data?.loyaltyPointsBalance !== undefined) {
        await updateUser({ loyaltyPoints: response.data.loyaltyPointsBalance });
      }
      
      // Show appropriate message based on refund status
      const refund = response.data?.refund;
      if (refund?.refundStatus === "succeeded") {
        Alert.alert(
          t("common.success"), 
          `${t("orders.cancelled")}. €${refund.refundAmount?.toFixed(2)} will be refunded to your payment method.`
        );
      } else if (refund?.refundStatus === "pending") {
        Alert.alert(
          t("common.success"), 
          `${t("orders.cancelled")}. Your refund is being processed.`
        );
      } else if (refund?.error) {
        Alert.alert(
          t("orders.cancelled"),
          `Order cancelled but refund could not be processed automatically. Please contact support.`
        );
      } else {
        Alert.alert(t("common.success"), t("orders.cancelled"));
      }
      
      fetchOrders(); // Refresh orders
    } catch (err: any) {
      logger.error("Error cancelling order:", err);
      Alert.alert(t("common.error"), t("errors.somethingWentWrong"));
    }
  };

  const handleCancelOrder = (order: Order) => {
    Alert.alert(
      t("orders.cancelOrder"),
      `${t("common.confirm")} #${order.id}?`,
      [
        { text: t("common.no"), style: "cancel" },
        {
          text: t("common.yes"),
          style: "destructive",
          onPress: () => cancelOrder(order.id),
        },
      ]
    );
  };

  useEffect(() => {
    if (isFocused) {
      fetchOrders();

      // Auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(() => {
        fetchOrders();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [isFocused, fetchOrders]);

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
    // Calculate total from items including modifiers
    const total =
      order.items && Array.isArray(order.items)
        ? order.items.reduce(
            (sum: number, oi: OrderItem) => {
              const basePrice = (oi.menuItem?.price || 0) * (oi.quantity || 1);
              
              // Calculate modifiers total for this item
              const modifiersTotal = oi.modifiers && Array.isArray(oi.modifiers)
                ? oi.modifiers.reduce(
                    (modSum: number, mod) => 
                      modSum + (mod.priceAtOrder || 0) * (mod.quantity || 1),
                    0
                  ) * (oi.quantity || 1)
                : 0;
              
              return sum + basePrice + modifiersTotal;
            },
            0
          )
        : order.total || 0;

    // Calculate progress based on status
    const getProgress = (status: OrderStatus) => {
      const statusProgress: Record<OrderStatus, number> = {
        pending: 0.2,
        confirmed: 0.4,
        preparing: 0.6,
        ready: 0.8,
        out_for_delivery: 0.9,
        delivered: 1.0,
        cancelled: 0,
      };
      return statusProgress[status] || 0;
    };

    // Get estimated time remaining
    const getTimeRemaining = () => {
      if (!order.estimatedDeliveryTime) return null;
      const now = new Date();
      const eta = new Date(order.estimatedDeliveryTime);
      const diffMs = eta.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins <= 0) return "Soon";
      if (diffMins < 60) return `${diffMins} min`;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    };

    const progress = getProgress(order.status);
    const timeRemaining = getTimeRemaining();

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
          <Chip mode="outlined" style={styles.statusChip}>
            {order.status}
          </Chip>

          {/* Refund Status for cancelled orders */}
          {order.status === "cancelled" && order.refundStatus && (
            <View style={styles.refundSection}>
              <Chip 
                mode="flat" 
                style={[
                  styles.refundChip,
                  order.refundStatus === "succeeded" && styles.refundSuccessChip,
                  order.refundStatus === "pending" && styles.refundPendingChip,
                  order.refundStatus === "failed" && styles.refundFailedChip,
                ]}
                textStyle={styles.refundChipText}
              >
                {order.refundStatus === "succeeded" 
                  ? `✓ Refunded €${order.refundAmount?.toFixed(2) || '0.00'}`
                  : order.refundStatus === "pending"
                  ? "⏳ Refund pending"
                  : "⚠ Refund failed"}
              </Chip>
            </View>
          )}

          {/* Progress Bar for active orders */}
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progress * 100}%` },
                  ]}
                />
              </View>
              {timeRemaining && (
                <Text style={styles.estimatedTime}>
                  Estimated: {timeRemaining}
                </Text>
              )}
            </View>
          )}

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
              {t("cart.total")}: {formatCurrency(total)}
            </Text>
            <View style={styles.orderActions}>
              {order.status === "pending" && (
                <Button
                  mode="outlined"
                  onPress={() => handleCancelOrder(order)}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonLabel}
                  compact
                >
                  {t("common.cancel")}
                </Button>
              )}
              {(order.status === "out_for_delivery" || (order.status === "ready" && order.driverName)) && (
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate("OrderTracking", { orderId: order.id })}
                  style={styles.trackButton}
                  compact
                  icon="map-marker-outline"
                >
                  {t("orders.trackOrder")}
                </Button>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Text style={styles.title}>{t("orders.myOrders")}</Text>

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
            {t("orders.myOrders")}
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
            {t("orders.orderHistory")}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.ordersContainer}
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
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to load orders</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => fetchOrders()}
            >
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
              <Text style={styles.emptyText}>{t("orders.noOrders")}</Text>
              <Text style={styles.emptySubText}>
                {t("menu.title")}
              </Text>
            </View>
          )
        ) : orderHistory.length > 0 ? (
          orderHistory.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t("orders.noOrders")}</Text>
            <Text style={styles.emptySubText}>
              {t("orders.orderHistory")}
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
  // MAIN CONTAINER - The entire Orders screen wrapper
  // Used by: Root View component wrapping all orders content
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    padding: 16, // 16px padding on all sides (top, right, bottom, left)
  },

  // ============================================================================
  // SCREEN TITLE - "My Orders" heading at top
  // Used by: Text component showing screen title
  // ============================================================================
  title: {
    fontSize: 28, // Large text for main heading
    fontWeight: "bold", // Bold for emphasis
    color: "#fffbe8", // Light cream color
    textAlign: "center", // Centers text horizontally
    marginBottom: 24, // 24px space before tabs below
  },

  // ============================================================================
  // TAB CONTAINER - Wrapper for "Current Orders" and "History" tabs
  // Used by: View containing both tab buttons
  // ============================================================================
  tabContainer: {
    flexDirection: "row", // Arranges tabs horizontally side by side
    backgroundColor: "#2d2117", // Dark brown background for tab bar
    borderRadius: 12, // Rounded corners for pill-shaped tab bar
    padding: 4, // 4px padding around tabs (creates gap from edges)
    marginBottom: 16, // 16px space between tabs and orders list
  },

  // ============================================================================
  // TAB BUTTON - Individual tab (Current Orders / History) - UNSELECTED
  // Used by: TouchableOpacity for each tab button
  // ============================================================================
  tab: {
    flex: 1, // Each tab takes equal width (50% each for 2 tabs)
    paddingVertical: 12, // 12px padding top/bottom for touch target
    alignItems: "center", // Centers tab text horizontally
    borderRadius: 8, // Rounded corners for active tab highlight
  },

  // ============================================================================
  // ACTIVE TAB - Styling applied to currently selected tab
  // Used by: Combined with tab style when tab is active
  // ============================================================================
  activeTab: {
    backgroundColor: "#e0b97f", // Gold background highlights active tab
  },

  // ============================================================================
  // TAB TEXT - Text inside tab buttons - UNSELECTED
  // Used by: Text component inside tab TouchableOpacity
  // ============================================================================
  tabText: {
    color: "#fffbe8", // Light cream text for inactive tabs
    fontWeight: "bold", // Bold text for all tabs
  },

  // ============================================================================
  // ACTIVE TAB TEXT - Text color when tab is selected
  // Used by: Combined with tabText when tab is active
  // ============================================================================
  activeTabText: {
    color: "#231a13", // Dark text on gold background for high contrast
  },

  // ============================================================================
  // ORDERS CONTAINER - ScrollView content wrapper for order cards
  // Used by: ScrollView contentContainerStyle holding all order cards
  // ============================================================================
  ordersContainer: {
    paddingBottom: 20, // 20px bottom padding for scroll overrun
  },

  // ============================================================================
  // ORDER CARD - Individual order card showing one order's details
  // Used by: Card component for each order in the list
  // ============================================================================
  orderCard: {
    marginBottom: 16, // 16px space between order cards
    backgroundColor: "#2d2117", // Dark brown card background
    borderRadius: 16, // Rounded corners for modern look
  },

  // ============================================================================
  // ORDER HEADER - Top row with order ID and timestamp
  // Used by: View at top of each order card
  // ============================================================================
  orderHeader: {
    flexDirection: "row", // Arranges ID and time horizontally
    justifyContent: "space-between", // Pushes ID left and time right
    alignItems: "center", // Vertically aligns ID and time
    marginBottom: 12, // 12px space before status chip
  },

  // ============================================================================
  // ORDER ID - "#123" text showing order number
  // Used by: Text component displaying order ID
  // ============================================================================
  orderId: {
    fontSize: 18, // Large text for visibility
    fontWeight: "bold", // Bold for emphasis
    color: "#fffbe8", // Light cream color
  },

  // ============================================================================
  // ORDER TIME - "2 hours ago" relative timestamp
  // Used by: Text component showing when order was placed
  // ============================================================================
  orderTime: {
    fontSize: 14, // Smaller than order ID (secondary info)
    color: "#e0b97f", // Gold accent color
  },

  // ============================================================================
  // STATUS CHIP - Pill showing order status (preparing, cooking, etc.)
  // Used by: Chip component displaying current order status
  // ============================================================================
  statusChip: {
    alignSelf: "flex-start", // Aligns chip to left edge (not stretched)
    marginBottom: 12, // 12px space before progress bar
    backgroundColor: "transparent", // No background (uses outline mode)
  },

  // ============================================================================
  // PROGRESS SECTION - Container for progress bar and ETA
  // Used by: View wrapping progress bar and estimated time text
  // ============================================================================
  progressSection: {
    marginBottom: 16, // 16px space before items list
  },

  // ============================================================================
  // PROGRESS BAR - Background track for progress indicator
  // Used by: View component that contains the filled progress
  // ============================================================================
  progressBar: {
    height: 6, // 6px tall progress track
    borderRadius: 3, // Rounded ends (half of height for pill shape)
    backgroundColor: "#231a13", // Very dark brown background (empty track)
    marginBottom: 8, // 8px space before estimated time text
    overflow: "hidden", // Clips progress fill to rounded corners
  },

  // ============================================================================
  // PROGRESS FILL - Colored bar showing order completion percentage
  // Used by: Animated View inside progressBar (width set dynamically)
  // ============================================================================
  progressFill: {
    height: "100%", // Fills full height of progress bar (6px)
    backgroundColor: "#e0b97f", // Gold color shows progress
    borderRadius: 3, // Matches parent for smooth appearance
    // width is set dynamically based on order status (e.g., "40%" for cooking)
  },

  // ============================================================================
  // ESTIMATED TIME - "Estimated: 25 min" text below progress bar
  // Used by: Text showing remaining delivery time
  // ============================================================================
  estimatedTime: {
    fontSize: 12, // Small text
    color: "#e0b97f", // Gold accent color
    textAlign: "center", // Centers text horizontally
  },

  // ============================================================================
  // ITEMS LIST - Container for order items ("• Pizza x2")
  // Used by: View wrapping all order item Text components
  // ============================================================================
  itemsList: {
    marginBottom: 12, // 12px space before total/cancel section
  },

  // ============================================================================
  // ORDER ITEM - Single menu item line in order ("• Burger x1")
  // Used by: Text component for each item in the order
  // ============================================================================
  orderItem: {
    color: "#fffbe8", // Light cream text
    fontSize: 14, // Standard readable size
    marginBottom: 4, // 4px space between items
  },

  // ============================================================================
  // ORDER TOTAL - "Total: €25.50" text
  // Used by: Text component showing order total price
  // ============================================================================
  orderTotal: {
    fontSize: 16, // Medium-large for emphasis
    fontWeight: "bold", // Bold for importance
    color: "#e0b97f", // Gold accent color
    flex: 1, // Takes remaining space (pushes buttons right)
  },

  // ============================================================================
  // ORDER ACTIONS - Container for action buttons
  // Used by: View wrapping cancel/track buttons
  // ============================================================================
  orderActions: {
    flexDirection: "row",
    gap: 8,
  },

  // ============================================================================
  // CANCEL BUTTON - Red outlined button to cancel order
  // Used by: Button component for cancelling pending orders
  // ============================================================================
  cancelButton: {
    borderColor: "#d32f2f", // Red border for warning/destructive action
  },

  // ============================================================================
  // TRACK BUTTON - Primary button to track delivery
  // Used by: Button component for tracking out_for_delivery orders
  // ============================================================================
  trackButton: {
    backgroundColor: "#4CAF50", // Green for active tracking
  },

  // ============================================================================
  // CANCEL BUTTON LABEL - Text inside cancel button
  // Used by: labelStyle prop of cancel Button
  // ============================================================================
  cancelButtonLabel: {
    color: "#d32f2f", // Red text matching border
    fontSize: 12, // Small compact text
  },

  // ============================================================================
  // EMPTY STATE - Container shown when no orders exist
  // Used by: View displayed when orders list is empty
  // ============================================================================
  emptyState: {
    alignItems: "center", // Centers content horizontally
    paddingVertical: 40, // 40px padding top/bottom for breathing room
  },

  // ============================================================================
  // EMPTY TEXT - "No orders yet" main message
  // Used by: Text component in empty state
  // ============================================================================
  emptyText: {
    fontSize: 18, // Medium-large text
    color: "#fffbe8", // Light cream color
    fontWeight: "bold", // Bold for visibility
    marginBottom: 8, // 8px space before subtitle
  },

  // ============================================================================
  // EMPTY SUB TEXT - "Your order history will appear here" subtitle
  // Used by: Text component below emptyText
  // ============================================================================
  emptySubText: {
    fontSize: 14, // Smaller than main text
    color: "#e0b97f", // Gold accent color
    textAlign: "center", // Centers text for multi-line messages
  },

  // ============================================================================
  // LOADING CONTAINER - Wrapper shown while fetching orders
  // Used by: View displayed during API loading state
  // ============================================================================
  loadingContainer: {
    flex: 1, // Takes full available space
    justifyContent: "center", // Centers spinner vertically
    alignItems: "center", // Centers spinner horizontally
    paddingVertical: 40, // 40px padding top/bottom
  },

  // ============================================================================
  // LOADING TEXT - "Loading orders..." text
  // Used by: Text shown during loading state
  // ============================================================================
  loadingText: {
    color: "#fffbe8", // Light cream color
    fontSize: 16, // Standard readable size
  },

  // ============================================================================
  // ERROR CONTAINER - Wrapper shown when order fetch fails
  // Used by: View displayed on API error
  // ============================================================================
  errorContainer: {
    flex: 1, // Takes full available space
    justifyContent: "center", // Centers error message vertically
    alignItems: "center", // Centers error message horizontally
    paddingVertical: 40, // 40px padding top/bottom
    paddingHorizontal: 20, // 20px padding left/right
  },

  // ============================================================================
  // ERROR TITLE - "Failed to load orders" heading
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
  // Used by: TouchableOpacity to refresh orders after error
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

  // ============================================================================
  // ORDER FOOTER - Bottom section with total and cancel button
  // Used by: View at bottom of order card
  // ============================================================================
  orderFooter: {
    marginTop: 8, // 8px space from items list above
  },

  // ============================================================================
  // REFUND SECTION - Container for refund status chip
  // Used by: View wrapping refund chip for cancelled orders
  // ============================================================================
  refundSection: {
    marginTop: 8,
    marginBottom: 4,
  },

  // ============================================================================
  // REFUND CHIP - Base style for refund status chip
  // Used by: Chip showing refund status
  // ============================================================================
  refundChip: {
    alignSelf: "flex-start",
  },

  // ============================================================================
  // REFUND SUCCESS CHIP - Green chip for successful refunds
  // Used by: Chip when refundStatus === "succeeded"
  // ============================================================================
  refundSuccessChip: {
    backgroundColor: "#2d5a27", // Dark green background
  },

  // ============================================================================
  // REFUND PENDING CHIP - Orange chip for pending refunds
  // Used by: Chip when refundStatus === "pending"
  // ============================================================================
  refundPendingChip: {
    backgroundColor: "#6b5a00", // Dark gold/yellow background
  },

  // ============================================================================
  // REFUND FAILED CHIP - Red chip for failed refunds
  // Used by: Chip when refundStatus === "failed"
  // ============================================================================
  refundFailedChip: {
    backgroundColor: "#6b2727", // Dark red background
  },

  // ============================================================================
  // REFUND CHIP TEXT - Text styling for refund chips
  // Used by: Chip textStyle prop
  // ============================================================================
  refundChipText: {
    color: "#fffbe8", // Light cream text
    fontSize: 12,
  },
});

export default OrdersScreen;


