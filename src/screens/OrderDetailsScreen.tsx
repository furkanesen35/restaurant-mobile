import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Chip, Button, IconButton, Divider, Avatar } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../hooks/useTranslation";
import { Order, OrderItem, OrderStatus } from "../types";
import { formatCurrency, formatRelativeTime } from "../utils/validation";
import apiClient from "../utils/apiClient";
import logger from "../utils/logger";

interface OrderDetailsRouteParams {
  orderId: string | number;
}

const OrderDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { orderId } = route.params as OrderDetailsRouteParams;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(
    async (isRefresh = false) => {
      if (!token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<Order>(`/order/${orderId}`);
        setOrder(response.data || null);
      } catch (err: any) {
        logger.error("Error fetching order details:", err);
        setError(err?.message || t("errors.somethingWentWrong"));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, orderId, t]
  );

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleRefresh = () => fetchOrderDetails(true);

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: "#f0a500",
      confirmed: "#4caf50",
      preparing: "#2196f3",
      ready: "#9c27b0",
      out_for_delivery: "#ff5722",
      delivered: "#4caf50",
      cancelled: "#f44336",
    };
    return colors[status] || "#888";
  };

  const getStatusIcon = (status: OrderStatus) => {
    const icons: Record<OrderStatus, string> = {
      pending: "clock-outline",
      confirmed: "check-circle-outline",
      preparing: "chef-hat",
      ready: "package-variant",
      out_for_delivery: "truck-delivery",
      delivered: "check-all",
      cancelled: "close-circle-outline",
    };
    return icons[status] || "help-circle-outline";
  };

  const handleCallDriver = () => {
    if (order?.driverPhone) {
      Linking.openURL(`tel:${order.driverPhone}`);
    }
  };

  const handleTrackOrder = () => {
    if (order) {
      (navigation as any).navigate("OrderTracking", { orderId: order.id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#e0b97f"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t("orders.orderDetails")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>{t("common.loading")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            iconColor="#e0b97f"
            size={24}
            onPress={() => navigation.goBack()}
          />
          <Text style={styles.headerTitle}>{t("orders.orderDetails")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || t("errors.somethingWentWrong")}</Text>
          <Button mode="contained" onPress={() => fetchOrderDetails()} style={styles.retryButton}>
            {t("errors.tryAgain")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals
  const subtotal = order.items?.reduce((sum, item) => {
    const basePrice = (item.menuItem?.price || 0) * (item.quantity || 1);
    const modifiersTotal = item.modifiers?.reduce(
      (modSum, mod) => modSum + (mod.priceAtOrder || 0) * (mod.quantity || 1),
      0
    ) || 0;
    return sum + basePrice + modifiersTotal * (item.quantity || 1);
  }, 0) || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor="#e0b97f"
          size={24}
          onPress={() => navigation.goBack()}
        />
        <Text style={styles.headerTitle}>{t("orders.orderDetails")}</Text>
        <View style={{ width: 40 }} />
      </View>

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
      >
        {/* Order Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <Avatar.Icon
              size={60}
              icon={getStatusIcon(order.status)}
              style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) }]}
            />
            <Text style={styles.orderNumber}>#{order.id}</Text>
            <Chip
              mode="flat"
              style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) + "20" }]}
              textStyle={[styles.statusChipText, { color: getStatusColor(order.status) }]}
            >
              {t(`orders.status.${order.status}`) || order.status}
            </Chip>
            <Text style={styles.orderDate}>
              {order.createdAt && formatRelativeTime(order.createdAt)}
            </Text>
          </Card.Content>
        </Card>

        {/* Refund Status */}
        {order.status === "cancelled" && order.refundStatus && (
          <Card style={styles.refundCard}>
            <Card.Content>
              <View style={styles.refundRow}>
                <Avatar.Icon
                  size={40}
                  icon={order.refundStatus === "succeeded" ? "check-circle" : "clock-outline"}
                  style={[
                    styles.refundIcon,
                    {
                      backgroundColor:
                        order.refundStatus === "succeeded" ? "#4caf50" : "#f0a500",
                    },
                  ]}
                />
                <View style={styles.refundInfo}>
                  <Text style={styles.refundTitle}>
                    {order.refundStatus === "succeeded"
                      ? "Refund Completed"
                      : order.refundStatus === "pending"
                      ? "Refund Pending"
                      : "Refund Failed"}
                  </Text>
                  {order.refundAmount && (
                    <Text style={styles.refundAmount}>
                      {formatCurrency(order.refundAmount)}
                    </Text>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Driver Info (if out for delivery) */}
        {order.driverName && (order.status === "out_for_delivery" || order.status === "ready") && (
          <Card style={styles.driverCard}>
            <Card.Content>
              <Text style={styles.sectionTitle}>{t("orders.driver")}</Text>
              <View style={styles.driverRow}>
                <Avatar.Text
                  size={50}
                  label={order.driverName.charAt(0).toUpperCase()}
                  style={styles.driverAvatar}
                />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{order.driverName}</Text>
                  {order.driverPhone && (
                    <Text style={styles.driverPhone}>{order.driverPhone}</Text>
                  )}
                </View>
                <View style={styles.driverActions}>
                  {order.driverPhone && (
                    <IconButton
                      icon="phone"
                      iconColor="#4caf50"
                      size={24}
                      onPress={handleCallDriver}
                      style={styles.callButton}
                    />
                  )}
                  <Button
                    mode="contained"
                    onPress={handleTrackOrder}
                    compact
                    icon="map-marker"
                    style={styles.trackButton}
                  >
                    {t("orders.trackOrder")}
                  </Button>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Order Items */}
        <Card style={styles.itemsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("orders.items")}</Text>
            {order.items?.map((item: OrderItem, index: number) => (
              <View key={index}>
                <View style={styles.itemRow}>
                  <View style={styles.itemQuantity}>
                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.menuItem?.name || "Item"}</Text>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <View style={styles.modifiersList}>
                        {item.modifiers.map((mod, modIdx) => (
                          <Text key={modIdx} style={styles.modifierText}>
                            + {mod.modifier?.name || "Extra"} x{mod.quantity}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(
                      (item.menuItem?.price || 0) * (item.quantity || 1) +
                        (item.modifiers?.reduce(
                          (sum, mod) => sum + (mod.priceAtOrder || 0) * (mod.quantity || 1),
                          0
                        ) || 0) * (item.quantity || 1)
                    )}
                  </Text>
                </View>
                {index < (order.items?.length || 0) - 1 && <Divider style={styles.itemDivider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Order Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t("checkout.orderSummary")}</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("cart.subtotal")}</Text>
              <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t("cart.deliveryFee")}</Text>
              <Text style={styles.summaryValue}>{t("cart.free")}</Text>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t("cart.total")}</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.total || subtotal)}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Estimated Delivery */}
        {order.estimatedDeliveryTime && order.status !== "delivered" && order.status !== "cancelled" && (
          <Card style={styles.etaCard}>
            <Card.Content style={styles.etaContent}>
              <Avatar.Icon size={40} icon="clock-outline" style={styles.etaIcon} />
              <View>
                <Text style={styles.etaLabel}>{t("checkout.estimatedDelivery")}</Text>
                <Text style={styles.etaValue}>
                  {new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#2d2117",
    borderBottomWidth: 1,
    borderBottomColor: "#3d3127",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#f5f5f5",
    fontSize: 16,
  },
  errorText: {
    color: "#f44336",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#e0b97f",
  },
  statusCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  statusContent: {
    alignItems: "center",
    padding: 20,
  },
  statusIcon: {
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  statusChip: {
    marginBottom: 8,
  },
  statusChipText: {
    fontWeight: "600",
  },
  orderDate: {
    color: "#b8a68a",
    fontSize: 14,
  },
  refundCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  refundRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  refundIcon: {
    marginRight: 12,
  },
  refundInfo: {
    flex: 1,
  },
  refundTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  refundAmount: {
    color: "#4caf50",
    fontSize: 18,
    fontWeight: "bold",
  },
  driverCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#e0b97f",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    backgroundColor: "#e0b97f",
  },
  driverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  driverPhone: {
    color: "#b8a68a",
    fontSize: 14,
  },
  driverActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  callButton: {
    backgroundColor: "#4caf5020",
    marginRight: 8,
  },
  trackButton: {
    backgroundColor: "#e0b97f",
  },
  itemsCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  itemQuantity: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#e0b97f20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  quantityText: {
    color: "#e0b97f",
    fontWeight: "bold",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  modifiersList: {
    marginTop: 4,
  },
  modifierText: {
    color: "#b8a68a",
    fontSize: 13,
  },
  itemPrice: {
    color: "#e0b97f",
    fontSize: 16,
    fontWeight: "600",
  },
  itemDivider: {
    backgroundColor: "#3d3127",
  },
  summaryCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#b8a68a",
    fontSize: 14,
  },
  summaryValue: {
    color: "#f5f5f5",
    fontSize: 14,
  },
  summaryDivider: {
    backgroundColor: "#3d3127",
    marginVertical: 12,
  },
  totalLabel: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  totalValue: {
    color: "#e0b97f",
    fontSize: 18,
    fontWeight: "bold",
  },
  etaCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 16,
  },
  etaContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  etaIcon: {
    backgroundColor: "#e0b97f",
    marginRight: 12,
  },
  etaLabel: {
    color: "#b8a68a",
    fontSize: 14,
  },
  etaValue: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OrderDetailsScreen;
