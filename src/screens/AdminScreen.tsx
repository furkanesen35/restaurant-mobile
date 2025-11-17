import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, useTheme, Button, FAB } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import ENV from "../config/env";
import QRTokenManagement from "../components/QRTokenManagement";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';
import { AllowedPostalCode } from "../types";
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
  const { t } = useTranslation();
  const { token, user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "orders" | "menu" | "qr" | "settings" | "delivery"
  >("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    nameDe: "",
    nameEn: "",
    descriptionDe: "",
    descriptionEn: "",
    price: "",
    categoryId: "",
    imageUrl: "",
    available: true,
    loyaltyPointsMultiplier: "1.0",
  });

  // Selected category for viewing menu items
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  // Delivery postal code management
  const [postalCodes, setPostalCodes] = useState<AllowedPostalCode[]>([]);
  const [postalCodesLoading, setPostalCodesLoading] = useState(false);
  const [postalCodeModalVisible, setPostalCodeModalVisible] = useState(false);
  const [editingPostalCode, setEditingPostalCode] = useState<AllowedPostalCode | null>(null);
  const [postalCodeForm, setPostalCodeForm] = useState({
    postalCode: "",
    city: "Bremerhaven",
    district: "",
    radiusKm: "",
    sortOrder: "",
    isActive: true,
  });
  const [savingPostalCode, setSavingPostalCode] = useState(false);

  // Settings states
  const [minOrderValue, setMinOrderValue] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [resettingPoints, setResettingPoints] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      logger.info("Admin fetching orders");
      const response = await fetch(`${ENV.API_URL}/order/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch orders: ${response.status} - ${errorText}`
        );
      }
      const data = await response.json();
      logger.info(`Admin orders fetched: ${data.length} orders`);
      setOrders(data);
    } catch (err: any) {
      logger.error("Admin fetch error:", err);
      Alert.alert("Error", err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/menu/categories`);
      const data = await response.json();
      setCategories(data || []);
      logger.info(`Categories fetched: ${(data || []).length}`);
    } catch (err: any) {
      logger.error("Failed to fetch categories:", err);
      Alert.alert("Error", "Failed to fetch categories");
      setCategories([]);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/menu`);
      const data = await response.json();
      // The API returns { categories: [...], items: [...] }
      // We need to extract the items array
      const itemsArray = data.items || data || [];
      setMenuItems(itemsArray);
      logger.info(`Menu items fetched: ${itemsArray.length}`);
    } catch (err: any) {
      logger.error("Failed to fetch menu items:", err);
      Alert.alert("Error", "Failed to fetch menu items");
      setMenuItems([]);
    }
  }, []);

  const fetchPostalCodes = useCallback(async () => {
    if (!token) return;
    try {
      setPostalCodesLoading(true);
      const response = await fetch(`${ENV.API_URL}/api/postal-codes/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to load postal codes");
      }
      const data: AllowedPostalCode[] = await response.json();
      setPostalCodes(data || []);
    } catch (err: any) {
      logger.error("Failed to fetch postal codes:", err);
      Alert.alert(
        t("common.error"),
        err.message || t("admin.delivery.loadError")
      );
    } finally {
      setPostalCodesLoading(false);
    }
  }, [token, t]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/settings/minOrderValue`);
      if (response.ok) {
        const data = await response.json();
        setMinOrderValue(data.value || "0");
      }
    } catch (err: any) {
      logger.error("Failed to fetch settings:", err);
    }
  }, []);

  const saveMinOrderValue = async () => {
    if (!token) return;
    setSavingSettings(true);
    try {
      const response = await fetch(`${ENV.API_URL}/settings/minOrderValue`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: minOrderValue,
          description: "Minimum order value in EUR",
        }),
      });
      if (!response.ok) throw new Error("Failed to save setting");
      Alert.alert("Success", "Minimum order value updated successfully");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save setting");
    } finally {
      setSavingSettings(false);
    }
  };

  const resetAllLoyaltyPoints = async () => {
    if (!token) return;
    setResettingPoints(true);
    try {
  const response = await fetch(`${ENV.API_URL}/api/loyalty/reset`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to reset loyalty points");
      }

      const data = await response.json();
      Alert.alert(
        t("common.success"),
        t("admin.settings.resetSuccess", {
          count: data.usersUpdated ?? 0,
        })
      );

      await updateUser({ loyaltyPoints: 0 });
    } catch (err: any) {
      logger.error("Failed to reset loyalty points", err);
      Alert.alert(
        t("common.error"),
        err.message || t("admin.settings.resetError")
      );
    } finally {
      setResettingPoints(false);
    }
  };

  const confirmResetLoyaltyPoints = () => {
    Alert.alert(
      t("admin.settings.resetConfirmTitle"),
      t("admin.settings.resetConfirmDescription"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("admin.settings.resetConfirmButton"),
          style: "destructive",
          onPress: resetAllLoyaltyPoints,
        },
      ]
    );
  };

  useEffect(() => {
    if (isFocused && user && token) {
      if (activeTab === "orders") {
        fetchOrders();
      } else if (activeTab === "settings") {
        fetchSettings();
      } else if (activeTab === "delivery") {
        fetchPostalCodes();
      } else {
        fetchCategories();
        fetchMenuItems();
      }
    }
  }, [
    isFocused,
    user,
    token,
    activeTab,
    fetchOrders,
    fetchCategories,
    fetchMenuItems,
    fetchSettings,
    fetchPostalCodes,
  ]);

  const updateStatus = async (
    orderId: number,
    status: string,
    orderUserId?: number
  ) => {
    if (!token) return;
    try {
      const response = await fetch(`${ENV.API_URL}/order/${orderId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");

      const data = await response.json();

      if (
        status === "cancelled" &&
        typeof data.loyaltyPointsBalance === "number" &&
        orderUserId === user?.id
      ) {
        await updateUser({ loyaltyPoints: data.loyaltyPointsBalance });
      }

      // Show message with loyalty points info if order was cancelled
      if (status === "cancelled" && data.loyaltyPointsDeducted > 0) {
        Alert.alert(
          t("common.success"), 
          `Order #${orderId} cancelled.\n${data.loyaltyPointsDeducted} loyalty points deducted from customer.`
        );
      } else if (status === "cancelled") {
        Alert.alert(
          t("common.success"),
          `Order #${orderId} cancelled. Loyalty points balance: ${
            data.loyaltyPointsBalance ?? "unchanged"
          }.`
        );
      } else {
        Alert.alert(t("common.success"), `Order #${orderId} status updated to ${status}`);
      }
      
      fetchOrders();
    } catch (err: any) {
      Alert.alert(t("common.error"), err.message || t("admin.orders.statusUpdateFailed"));
    }
  };

  // Category management
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }

    try {
      const url = editingCategory
        ? `${ENV.API_URL}/menu/categories/${editingCategory.id}`
        : `${ENV.API_URL}/menu/categories`;
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryForm),
      });

      if (!response.ok) throw new Error("Failed to save category");
      Alert.alert(
        "Success",
        `Category ${editingCategory ? "updated" : "created"}`
      );
      setShowCategoryModal(false);
      setCategoryForm({ name: "" });
      setEditingCategory(null);
      fetchCategories();
      fetchMenuItems();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save category");
    }
  };

  const deleteCategory = async (id: number) => {
    Alert.alert(
      "Delete Category",
      "Are you sure? This will also delete all items in this category.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${ENV.API_URL}/menu/categories/${id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!response.ok) throw new Error("Failed to delete");
              Alert.alert("Success", "Category deleted");
              fetchCategories();
              fetchMenuItems();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete category");
            }
          },
        },
      ]
    );
  };

  // Menu item management
  const saveMenuItem = async () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.categoryId) {
      Alert.alert("Error", "Name, price, and category are required");
      return;
    }

    try {
      const url = editingItem
        ? `${ENV.API_URL}/menu/${editingItem.id}`
        : `${ENV.API_URL}/menu`;
      const method = editingItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...itemForm,
          price: parseFloat(itemForm.price),
          categoryId: parseInt(itemForm.categoryId),
          loyaltyPointsMultiplier: parseFloat(itemForm.loyaltyPointsMultiplier),
        }),
      });

      if (!response.ok) throw new Error("Failed to save menu item");
      Alert.alert(
        "Success",
        `Menu item ${editingItem ? "updated" : "created"}`
      );
      setShowItemModal(false);
      setItemForm({
        name: "",
        description: "",
        nameDe: "",
        nameEn: "",
        descriptionDe: "",
        descriptionEn: "",
        price: "",
        categoryId: "",
        imageUrl: "",
        available: true,
        loyaltyPointsMultiplier: "1.0",
      });
      setEditingItem(null);
      fetchMenuItems();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save menu item");
    }
  };

  const deleteMenuItem = async (id: number) => {
    Alert.alert("Delete Item", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${ENV.API_URL}/menu/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("Failed to delete");
            Alert.alert("Success", "Item deleted");
            fetchMenuItems();
          } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to delete item");
          }
        },
      },
    ]);
  };

  const resetPostalCodeForm = () => {
    setPostalCodeForm({
      postalCode: "",
      city: "Bremerhaven",
      district: "",
      radiusKm: "",
      sortOrder: "",
      isActive: true,
    });
    setEditingPostalCode(null);
  };

  const openPostalCodeModal = (entry?: AllowedPostalCode) => {
    if (entry) {
      setEditingPostalCode(entry);
      setPostalCodeForm({
        postalCode: entry.postalCode,
        city: entry.city,
        district: entry.district || "",
        radiusKm: entry.radiusKm ? entry.radiusKm.toString() : "",
        sortOrder:
          entry.sortOrder === undefined ? "" : entry.sortOrder.toString(),
        isActive: entry.isActive !== false,
      });
    } else {
      resetPostalCodeForm();
    }
    setPostalCodeModalVisible(true);
  };

  const closePostalCodeModal = () => {
    setPostalCodeModalVisible(false);
    resetPostalCodeForm();
  };

  const savePostalCodeEntry = async () => {
    if (!postalCodeForm.postalCode.trim() || !postalCodeForm.city.trim()) {
      Alert.alert(t("common.error"), t("admin.delivery.formRequired"));
      return;
    }

    try {
      setSavingPostalCode(true);
      const parsedRadius = postalCodeForm.radiusKm
        ? parseFloat(postalCodeForm.radiusKm)
        : null;
      const parsedSortOrder = postalCodeForm.sortOrder
        ? parseInt(postalCodeForm.sortOrder, 10)
        : 0;
      const payload = {
        postalCode: postalCodeForm.postalCode.trim(),
        city: postalCodeForm.city.trim(),
        district: (postalCodeForm.district || "").trim() || null,
        radiusKm:
          parsedRadius !== null && !Number.isNaN(parsedRadius)
            ? parsedRadius
            : null,
        sortOrder: Number.isNaN(parsedSortOrder) ? 0 : parsedSortOrder,
        isActive: postalCodeForm.isActive,
      };

      const method = editingPostalCode ? "PUT" : "POST";
      const url = editingPostalCode
        ? `${ENV.API_URL}/api/postal-codes/${editingPostalCode.id}`
        : `${ENV.API_URL}/api/postal-codes`;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to save postal code");
      }

      Alert.alert(t("common.success"), t("admin.delivery.saveSuccess"));
      setPostalCodeModalVisible(false);
      resetPostalCodeForm();
      fetchPostalCodes();
    } catch (err: any) {
      logger.error("Failed to save postal code", err);
      Alert.alert(
        t("common.error"),
        err.message || t("admin.delivery.saveError")
      );
    } finally {
      setSavingPostalCode(false);
    }
  };

  const confirmDeletePostalCode = (entry: AllowedPostalCode) => {
    if (!entry.id) return;
    Alert.alert(
      t("admin.delivery.deleteConfirmTitle"),
      t("admin.delivery.deleteConfirmMessage", { postalCode: entry.postalCode }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${ENV.API_URL}/api/postal-codes/${entry.id}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to delete postal code");
              }
              Alert.alert(
                t("common.success"),
                t("admin.delivery.deleteSuccess")
              );
              fetchPostalCodes();
            } catch (err: any) {
              logger.error("Failed to delete postal code", err);
              Alert.alert(
                t("common.error"),
                err.message || t("admin.delivery.deleteError")
              );
            }
          },
        },
      ]
    );
  };

  if (!user || user.role !== "admin") {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={{ color: colors.error }}>Access denied.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "orders" && styles.activeTab]}
            onPress={() => setActiveTab("orders")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "orders" && styles.activeTabText,
              ]}
            >
              {t("admin.tabs.orders")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "menu" && styles.activeTab]}
            onPress={() => setActiveTab("menu")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "menu" && styles.activeTabText,
              ]}
            >
              {t("admin.tabs.menu")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "qr" && styles.activeTab]}
            onPress={() => setActiveTab("qr")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "qr" && styles.activeTabText,
              ]}
            >
              {t("admin.tabs.qr")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "delivery" && styles.activeTab]}
            onPress={() => setActiveTab("delivery")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "delivery" && styles.activeTabText,
              ]}
            >
              {t("admin.tabs.delivery")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "settings" && styles.activeTab]}
            onPress={() => setActiveTab("settings")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "settings" && styles.activeTabText,
              ]}
            >
              {t("admin.tabs.settings")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            <Text style={[styles.title, { color: "#e0b97f" }]}>{t("admin.orders.title")}</Text>
            {loading ? (
              <Text style={{ color: colors.onBackground }}>
                {t("admin.orders.loadingOrders")}
              </Text>
            ) : orders.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: colors.onBackground, fontSize: 16 }}>
                  {t("admin.orders.noOrders")}
                </Text>
              </View>
            ) : (
              <FlatList
                data={orders}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <Card style={styles.card}>
                    <Card.Title
                      title={t("admin.orders.orderNumber", { id: item.id })}
                      subtitle={`${t("admin.orders.status")}: ${item.status}`}
                    />
                    <Card.Content>
                      <Text style={{ color: colors.onBackground }}>
                        {t("admin.orders.user")}: {item.userId}
                      </Text>
                      {item.address && (
                        <View
                          style={{
                            marginTop: 8,
                            marginBottom: 8,
                            padding: 8,
                            backgroundColor: "#2d2117",
                            borderRadius: 4,
                          }}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontWeight: "bold",
                              marginBottom: 4,
                            }}
                          >
                            📍 {t("admin.orders.deliveryAddress")}:
                          </Text>
                          <Text style={{ color: colors.onBackground }}>
                            {item.address.street}
                          </Text>
                          <Text style={{ color: colors.onBackground }}>
                            {item.address.city}, {item.address.postalCode}
                          </Text>
                          <Text style={{ color: colors.onBackground }}>
                            📞 {item.address.phone}
                          </Text>
                        </View>
                      )}
                      <Text style={{ color: colors.onBackground }}>{t("admin.orders.items")}:</Text>
                      {item.items.map((orderItem: any) => (
                        <Text
                          key={orderItem.id}
                          style={{ color: colors.onBackground, marginLeft: 8 }}
                        >
                          - {orderItem.menuItem?.name || "Item"} x
                          {orderItem.quantity}
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
                                      ? "#e0b97f"
                                      : "#fffbe8",
                                },
                              ]}
                              onPress={() => {
                                Alert.alert(
                                  t("admin.orders.cancelOrderTitle"),
                                  t("admin.orders.cancelOrderMessage"),
                                  [
                                    { text: t("common.no"), style: "cancel" },
                                    {
                                      text: t("common.yes"),
                                      style: "destructive",
                                      onPress: async () => {
                                        try {
                                          const response = await fetch(
                                            `${ENV.API_URL}/order/${item.id}`,
                                            {
                                              method: "DELETE",
                                              headers: {
                                                Authorization: `Bearer ${token}`,
                                              },
                                            }
                                          );
                                          if (!response.ok)
                                            throw new Error("Failed");
                                          const data = await response.json();

                                          if (
                                            typeof data.loyaltyPointsBalance ===
                                              "number" &&
                                            item.userId === user?.id
                                          ) {
                                            await updateUser({
                                              loyaltyPoints:
                                                data.loyaltyPointsBalance,
                                            });
                                          }

                                          if (
                                            data.loyaltyPointsDeducted &&
                                            data.loyaltyPointsDeducted > 0
                                          ) {
                                            Alert.alert(
                                              t("admin.orders.orderCancelled"),
                                              `${data.loyaltyPointsDeducted} loyalty points deducted. New balance: ${data.loyaltyPointsBalance}.`
                                            );
                                          } else {
                                            Alert.alert(t("admin.orders.orderCancelled"));
                                          }
                                          fetchOrders();
                                        } catch (err: any) {
                                          Alert.alert(t("admin.orders.orderCancelFailed"), err.message);
                                        }
                                      },
                                    },
                                  ]
                                );
                              }}
                              disabled={item.status === status}
                            >
                              <Text
                                style={{
                                  color:
                                    item.status === status ? "#231a13" : "red",
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
                                      ? "#e0b97f"
                                      : "#fffbe8",
                                },
                              ]}
                              onPress={() =>
                                updateStatus(item.id, status, item.userId)
                              }
                              disabled={item.status === status}
                            >
                              <Text
                                style={{
                                  color:
                                    item.status === status
                                      ? "#231a13"
                                      : "#231a13",
                                }}
                              >
                                {status}
                              </Text>
                            </TouchableOpacity>
                          )
                        )}
                      </ScrollView>
                    </Card.Content>
                  </Card>
                )}
              />
            )}
          </>
        )}

        {/* Menu Tab */}
        {activeTab === "menu" && (
          <>
            <Text style={[styles.title, { color: "#e0b97f" }]}>
              {t("admin.menu.title")}
            </Text>

            {/* Categories Section */}
            <Text style={styles.sectionTitle}>{t("admin.menu.categories")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    selectedCategoryId === cat.id && {
                      borderColor: "#e0b97f",
                      borderWidth: 2,
                    },
                  ]}
                >
                  <Card.Content style={{ paddingBottom: 12 }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedCategoryId(
                          selectedCategoryId === cat.id ? null : cat.id
                        );
                      }}
                    >
                      <Text style={styles.categoryName}>{cat.name}</Text>
                    </TouchableOpacity>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditingCategory(cat);
                          setCategoryForm({ name: cat.name });
                          setShowCategoryModal(true);
                        }}
                      >
                        <Text style={styles.btnText}>{t("common.edit")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteCategory(cat.id)}
                      >
                        <Text style={styles.btnText}>{t("common.delete")}</Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              ))}
              <TouchableOpacity
                style={styles.addCategoryBtn}
                onPress={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: "" });
                  setShowCategoryModal(true);
                }}
              >
                <Text style={styles.addBtnText}>{t("admin.menu.addCategory")}</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Menu Items Section */}
            <Text style={styles.sectionTitle}>
              {selectedCategoryId
                ? t("admin.menu.categoryFilter", {
                    categoryName:
                      categories.find((c) => c.id === selectedCategoryId)
                        ?.name || "Category",
                  })
                : t("admin.menu.menuItems")}
            </Text>
            <FlatList
              data={
                selectedCategoryId
                  ? (menuItems || []).filter((item) => {
                      // Handle both categoryId (number) and category (string) properties
                      const itemCategoryId =
                        item.categoryId || parseInt(item.category);
                      return itemCategoryId === selectedCategoryId;
                    })
                  : menuItems || []
              }
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text
                  style={{
                    color: "#fffbe8",
                    textAlign: "center",
                    marginTop: 16,
                  }}
                >
                  {selectedCategoryId
                    ? t("admin.menu.noItemsInCategory")
                    : t("admin.menu.noItems")}
                </Text>
              }
              renderItem={({ item }) => (
                <Card style={styles.menuItemCard}>
                  <Card.Content>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.menuItemImage}
                      />
                    ) : null}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
                        <View style={styles.bonusPointsBadge}>
                          <Text style={styles.bonusPointsText}>
                            {t("admin.menu.bonusPoints", { multiplier: item.loyaltyPointsMultiplier })}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemPrice}>${item.price}</Text>
                    <Text style={styles.itemCategory}>
                      {t("admin.menu.categoryLabel")}:{" "}
                      {
                        categories.find(
                          (c) =>
                            c.id ===
                            (item.categoryId || parseInt(item.category))
                        )?.name
                      }
                    </Text>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => {
                          setEditingItem(item);
                          setItemForm({
                            name: item.name,
                            description: item.description || "",
                            nameDe: item.nameDe || item.name,
                            nameEn: item.nameEn || "",
                            descriptionDe: item.descriptionDe || item.description || "",
                            descriptionEn: item.descriptionEn || "",
                            price: item.price.toString(),
                            categoryId: (
                              item.categoryId || item.category
                            ).toString(),
                            imageUrl: item.imageUrl || "",
                            available: item.available !== false,
                            loyaltyPointsMultiplier: (item.loyaltyPointsMultiplier || 1.0).toString(),
                          });
                          setShowItemModal(true);
                        }}
                      >
                        <Text style={styles.btnText}>{t("common.edit")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteMenuItem(item.id)}
                      >
                        <Text style={styles.btnText}>{t("common.delete")}</Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              )}
            />

            {/* FAB for adding menu item */}
            <FAB
              style={styles.fab}
              icon="plus"
              onPress={() => {
                setEditingItem(null);
                setItemForm({
                  name: "",
                  description: "",
                  nameDe: "",
                  nameEn: "",
                  descriptionDe: "",
                  descriptionEn: "",
                  price: "",
                  categoryId: categories[0]?.id?.toString() || "",
                  imageUrl: "",
                  available: true,
                  loyaltyPointsMultiplier: "1.0",
                });
                setShowItemModal(true);
              }}
            />
          </>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <ScrollView>
            <Text style={[styles.title, { color: "#e0b97f" }]}>
              {t("admin.delivery.title")}
            </Text>
            <Text style={styles.settingDescription}>
              {t("admin.delivery.description")}
            </Text>

            <TouchableOpacity
              style={styles.addPostalButton}
              onPress={() => openPostalCodeModal()}
            >
              <Text style={styles.addBtnText}>{t("admin.delivery.addButton")}</Text>
            </TouchableOpacity>

            {postalCodesLoading ? (
              <Text style={{ color: colors.onBackground, marginTop: 16 }}>
                {t("common.loading")}
              </Text>
            ) : postalCodes.length === 0 ? (
              <Text
                style={{
                  color: colors.onBackground,
                  textAlign: "center",
                  marginTop: 24,
                }}
              >
                {t("admin.delivery.empty")}
              </Text>
            ) : (
              postalCodes.map((code) => (
                <Card key={code.id || code.postalCode} style={styles.card}>
                  <Card.Content>
                    <View style={styles.postalHeader}>
                      <Text style={styles.postalCodeValue}>{code.postalCode}</Text>
                      <View
                        style={[
                          styles.statusPill,
                          code.isActive !== false
                            ? styles.statusActive
                            : styles.statusInactive,
                        ]}
                      >
                        <Text style={styles.statusPillText}>
                          {code.isActive !== false
                            ? t("common.active")
                            : t("common.inactive")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.postalMeta}>
                      {[code.city, code.district].filter(Boolean).join(" • ") ||
                        code.city}
                    </Text>
                    {code.radiusKm ? (
                      <Text style={styles.postalMeta}>
                        {t("admin.delivery.radiusLabel", {
                          radius: code.radiusKm,
                        })}
                      </Text>
                    ) : null}
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={styles.editBtn}
                        onPress={() => openPostalCodeModal(code)}
                      >
                        <Text style={styles.btnText}>{t("common.edit")}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => confirmDeletePostalCode(code)}
                      >
                        <Text style={styles.btnText}>{t("common.delete")}</Text>
                      </TouchableOpacity>
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </ScrollView>
        )}

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingCategory ? t("admin.modals.editCategory") : t("admin.modals.newCategory")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("admin.modals.categoryNamePlaceholder")}
                placeholderTextColor="#999"
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({ name: text })}
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setShowCategoryModal(false)}>
                  {t("common.cancel")}
                </Button>
                <Button mode="contained" onPress={saveCategory}>
                  {t("common.save")}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* Menu Item Modal */}
        <Modal
          visible={showItemModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowItemModal(false)}
        >
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={styles.modalScrollContent}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingItem ? t("admin.modals.editItem") : t("admin.modals.newItem")}
                </Text>
                
                <Text style={styles.sectionLabel}>German (Deutsch) - Required</Text>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.nameDe")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name (DE) *"
                    placeholderTextColor="#999"
                    value={itemForm.nameDe || itemForm.name}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, nameDe: text, name: text })
                    }
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.descriptionDe")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Description (DE) *"
                    placeholderTextColor="#999"
                    value={itemForm.descriptionDe || itemForm.description}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, descriptionDe: text, description: text })
                    }
                    multiline
                  />
                </View>

                <Text style={styles.sectionLabel}>English - Optional</Text>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.nameEn")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Name (EN) - Optional"
                    placeholderTextColor="#999"
                    value={itemForm.nameEn}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, nameEn: text })
                    }
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.descriptionEn")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Description (EN) - Optional"
                    placeholderTextColor="#999"
                    value={itemForm.descriptionEn}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, descriptionEn: text })
                    }
                    multiline
                  />
                </View>

                <Text style={styles.sectionLabel}>Common Fields</Text>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.price")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("admin.modals.pricePlaceholder")}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={itemForm.price}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, price: text })
                    }
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.loyaltyMultiplier")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("admin.modals.loyaltyMultiplierPlaceholder")}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={itemForm.loyaltyPointsMultiplier}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, loyaltyPointsMultiplier: text })
                    }
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.formFieldLabel}>
                    {t("admin.modals.labels.imageUrl")}
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("admin.modals.imageUrlPlaceholder")}
                    placeholderTextColor="#999"
                    value={itemForm.imageUrl}
                    onChangeText={(text) =>
                      setItemForm({ ...itemForm, imageUrl: text })
                    }
                  />
                </View>
                {itemForm.imageUrl ? (
                  <Image
                    source={{ uri: itemForm.imageUrl }}
                    style={styles.modalImagePreview}
                  />
                ) : (
                  <View style={styles.modalImagePlaceholder}>
                    <Text style={styles.modalImagePlaceholderText}>
                      {t("admin.modals.imagePreviewPlaceholder")}
                    </Text>
                  </View>
                )}
                <Text style={styles.label}>{t("admin.menu.categoryLabel")}:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryPicker}
                >
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOption,
                        itemForm.categoryId === cat.id.toString() &&
                          styles.categoryOptionSelected,
                      ]}
                      onPress={() =>
                        setItemForm({
                          ...itemForm,
                          categoryId: cat.id.toString(),
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          itemForm.categoryId === cat.id.toString() &&
                            styles.categoryOptionTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <Button onPress={() => setShowItemModal(false)}>
                    {t("common.cancel")}
                  </Button>
                  <Button mode="contained" onPress={saveMenuItem}>
                    {t("common.save")}
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Postal Code Modal */}
        <Modal
          visible={postalCodeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closePostalCodeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingPostalCode
                  ? t("admin.delivery.editTitle")
                  : t("admin.delivery.addTitle")}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={t("admin.delivery.postalPlaceholder")}
                placeholderTextColor="#999"
                value={postalCodeForm.postalCode}
                onChangeText={(text) =>
                  setPostalCodeForm((prev) => ({ ...prev, postalCode: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder={t("admin.delivery.cityPlaceholder")}
                placeholderTextColor="#999"
                value={postalCodeForm.city}
                onChangeText={(text) =>
                  setPostalCodeForm((prev) => ({ ...prev, city: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder={t("admin.delivery.districtPlaceholder")}
                placeholderTextColor="#999"
                value={postalCodeForm.district}
                onChangeText={(text) =>
                  setPostalCodeForm((prev) => ({ ...prev, district: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder={t("admin.delivery.radiusPlaceholder")}
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={postalCodeForm.radiusKm}
                onChangeText={(text) =>
                  setPostalCodeForm((prev) => ({ ...prev, radiusKm: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder={t("admin.delivery.sortPlaceholder")}
                placeholderTextColor="#999"
                keyboardType="number-pad"
                value={postalCodeForm.sortOrder}
                onChangeText={(text) =>
                  setPostalCodeForm((prev) => ({ ...prev, sortOrder: text }))
                }
              />
              <View style={styles.toggleContainer}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>
                    {t("admin.delivery.activeLabel")}
                  </Text>
                  <Text style={[styles.toggleSubtext, { color: "#b8a68a" }]}>
                    {t("admin.delivery.activeHint")}
                  </Text>
                </View>
                <Switch
                  value={postalCodeForm.isActive}
                  onValueChange={(value) =>
                    setPostalCodeForm((prev) => ({ ...prev, isActive: value }))
                  }
                  trackColor={{ false: "#767577", true: "#4caf50" }}
                  thumbColor={postalCodeForm.isActive ? "#fff" : "#f4f3f4"}
                />
              </View>
              <View style={styles.modalActions}>
                <Button onPress={closePostalCodeModal}>{t("common.cancel")}</Button>
                <Button
                  mode="contained"
                  onPress={savePostalCodeEntry}
                  disabled={savingPostalCode}
                >
                  {savingPostalCode ? t("common.loading") : t("common.save")}
                </Button>
              </View>
            </View>
          </View>
        </Modal>

        {/* QR Codes Tab */}
        {activeTab === "qr" && <QRTokenManagement />}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <ScrollView>
            <Card style={styles.card}>
              <Card.Title title={t("admin.settings.minOrderTitle")} />
              <Card.Content>
                <Text style={styles.settingDescription}>
                  {t("admin.settings.minOrderDescription")}
                </Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>{t("admin.settings.minOrderLabel")}</Text>
                  <TextInput
                    style={styles.settingInput}
                    keyboardType="numeric"
                    value={minOrderValue}
                    onChangeText={setMinOrderValue}
                    placeholder={t("admin.settings.minOrderPlaceholder")}
                    placeholderTextColor="#999"
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveMinOrderValue}
                  disabled={savingSettings}
                >
                  <Text style={styles.saveButtonText}>
                    {savingSettings ? t("admin.settings.saving") : t("admin.settings.saveSetting")}
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Title title={t("admin.settings.loyaltyResetTitle")} />
              <Card.Content>
                <Text style={styles.settingDescription}>
                  {t("admin.settings.loyaltyResetDescription")}
                </Text>
                <TouchableOpacity
                  style={[styles.resetButton, resettingPoints && styles.resetButtonDisabled]}
                  onPress={confirmResetLoyaltyPoints}
                  disabled={resettingPoints}
                >
                  <Text style={styles.resetButtonText}>
                    {resettingPoints
                      ? t("admin.settings.resetting")
                      : t("admin.settings.resetButton")}
                  </Text>
                </TouchableOpacity>
              </Card.Content>
            </Card>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  container: { flex: 1, padding: 16, backgroundColor: "#231a13" },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: "#e0b97f",
  },
  tabText: {
    fontSize: 16,
    color: "#fffbe8",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#231a13",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 16,
    alignSelf: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fffbe8",
    marginTop: 16,
    marginBottom: 8,
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
  categoryScroll: {
    maxHeight: 160,
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: "#2d2117",
    marginRight: 12,
    minWidth: 160,
    minHeight: 140,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fffbe8",
    marginBottom: 8,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 8,
  },
  addCategoryBtn: {
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    width: 150,
  },
  addPostalButton: {
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  addBtnText: {
    color: "#231a13",
    fontWeight: "bold",
    fontSize: 16,
  },
  menuItemCard: {
    backgroundColor: "#2d2117",
    marginBottom: 12,
  },
  menuItemImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#1f160f",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fffbe8",
  },
  itemDesc: {
    fontSize: 14,
    color: "#e0b97f",
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e0b97f",
    marginTop: 8,
  },
  itemCategory: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  postalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  postalCodeValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fffbe8",
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusActive: {
    borderColor: "#4caf50",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },
  statusInactive: {
    borderColor: "#d32f2f",
    backgroundColor: "rgba(211, 47, 47, 0.15)",
  },
  statusPillText: {
    color: "#fffbe8",
    fontWeight: "600",
    fontSize: 12,
  },
  postalMeta: {
    color: "#b8a68a",
    fontSize: 14,
    marginBottom: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#3a2c1f",
  },
  toggleLabel: {
    color: "#fffbe8",
    fontWeight: "600",
    fontSize: 16,
  },
  toggleSubtext: {
    color: "#b8a68a",
    fontSize: 12,
  },
  itemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  editBtn: {
    backgroundColor: "#4a90e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "#d32f2f",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    backgroundColor: "#e0b97f",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2d2117",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fffbe8",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#231a13",
    color: "#fffbe8",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  label: {
    fontSize: 16,
    color: "#fffbe8",
    marginBottom: 8,
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 18,
    color: "#e0b97f",
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  categoryPicker: {
    marginBottom: 16,
  },
  categoryOption: {
    backgroundColor: "#231a13",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  categoryOptionSelected: {
    backgroundColor: "#e0b97f",
  },
  categoryOptionText: {
    color: "#fffbe8",
    fontWeight: "600",
  },
  categoryOptionTextSelected: {
    color: "#231a13",
  },
  modalImagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#1f160f",
  },
  modalImagePlaceholder: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4b3a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  modalImagePlaceholderText: {
    color: "#b8a68a",
    fontStyle: "italic",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  formField: {
    marginBottom: 12,
    gap: 6,
  },
  formFieldLabel: {
    color: "#fffbe8",
    fontWeight: "600",
    fontSize: 14,
  },
  settingDescription: {
    color: "#b8a68a",
    fontSize: 14,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  settingLabel: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  settingInput: {
    backgroundColor: "#231a13",
    color: "#fffbe8",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0b97f",
    width: 120,
    textAlign: "center",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bonusPointsBadge: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusPointsText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default AdminScreen;


