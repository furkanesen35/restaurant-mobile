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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, useTheme, Button, FAB } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { useIsFocused } from "@react-navigation/native";
import ENV from "../config/env";
import QRTokenManagement from "../components/QRTokenManagement";

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
  const { token, user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "qr" | "settings">("orders");
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

  // Settings states
  const [minOrderValue, setMinOrderValue] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      console.log("Admin fetching orders with token:", token);
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
      console.log("Admin orders fetched:", data.length, "orders");
      setOrders(data);
    } catch (err: any) {
      console.error("Admin fetch error:", err);
      Alert.alert("Error", err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/menu/categories`);
      const data = await response.json();
      console.log("Categories fetched:", data);
      setCategories(data || []);
    } catch (err: any) {
      console.error("Failed to fetch categories:", err);
      Alert.alert("Error", "Failed to fetch categories");
      setCategories([]);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/menu`);
      const data = await response.json();
      console.log("Menu items fetched:", data);
      // The API returns { categories: [...], items: [...] }
      // We need to extract the items array
      const itemsArray = data.items || data || [];
      console.log("Extracted items array:", itemsArray);
      setMenuItems(itemsArray);
    } catch (err: any) {
      console.error("Failed to fetch menu items:", err);
      Alert.alert("Error", "Failed to fetch menu items");
      setMenuItems([]);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`${ENV.API_URL}/api/settings/minOrderValue`);
      if (response.ok) {
        const data = await response.json();
        setMinOrderValue(data.value || "0");
      }
    } catch (err: any) {
      console.error("Failed to fetch settings:", err);
    }
  }, []);

  const saveMinOrderValue = async () => {
    if (!token) return;
    setSavingSettings(true);
    try {
      const response = await fetch(`${ENV.API_URL}/api/settings/minOrderValue`, {
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

  useEffect(() => {
    if (isFocused && user && token) {
      if (activeTab === "orders") {
        fetchOrders();
      } else if (activeTab === "settings") {
        fetchSettings();
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
          "Success", 
          `Order #${orderId} cancelled.\n${data.loyaltyPointsDeducted} loyalty points deducted from customer.`
        );
      } else if (status === "cancelled") {
        Alert.alert(
          "Success",
          `Order #${orderId} cancelled. Loyalty points balance: ${
            data.loyaltyPointsBalance ?? "unchanged"
          }.`
        );
      } else {
        Alert.alert("Success", `Order #${orderId} status updated to ${status}`);
      }
      
      fetchOrders();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update order status");
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
              Orders
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
              Menu
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
              QR-Codes
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
              Settings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <>
            <Text style={[styles.title, { color: "#e0b97f" }]}>All Orders</Text>
            {loading ? (
              <Text style={{ color: colors.onBackground }}>
                Loading orders...
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
                  No orders found
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
                            📍 Delivery Address:
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
                      <Text style={{ color: colors.onBackground }}>Items:</Text>
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
                                  "Cancel Order",
                                  "Are you sure you want to cancel this order?",
                                  [
                                    { text: "No", style: "cancel" },
                                    {
                                      text: "Yes",
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
                                              "Order cancelled",
                                              `${data.loyaltyPointsDeducted} loyalty points deducted. New balance: ${data.loyaltyPointsBalance}.`
                                            );
                                          } else {
                                            Alert.alert("Order cancelled");
                                          }
                                          fetchOrders();
                                        } catch (err: any) {
                                          Alert.alert("Error", err.message);
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
              Menu Management
            </Text>

            {/* Categories Section */}
            <Text style={styles.sectionTitle}>Categories</Text>
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
                        console.log("Category clicked:", cat.id, cat.name);
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
                        <Text style={styles.btnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteCategory(cat.id)}
                      >
                        <Text style={styles.btnText}>Delete</Text>
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
                <Text style={styles.addBtnText}>+ Add Category</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Menu Items Section */}
            <Text style={styles.sectionTitle}>
              Menu Items
              {selectedCategoryId &&
                ` (${
                  categories.find((c) => c.id === selectedCategoryId)?.name ||
                  "Category"
                })`}
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
                    ? "No menu items in this category. Use the + button to add items."
                    : "No menu items yet. Select a category or use the + button to add items."}
                </Text>
              }
              renderItem={({ item }) => (
                <Card style={styles.menuItemCard}>
                  <Card.Content>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
                        <View style={styles.bonusPointsBadge}>
                          <Text style={styles.bonusPointsText}>
                            {item.loyaltyPointsMultiplier}x Points
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDesc}>{item.description}</Text>
                    <Text style={styles.itemPrice}>${item.price}</Text>
                    <Text style={styles.itemCategory}>
                      Category:{" "}
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
                        <Text style={styles.btnText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => deleteMenuItem(item.id)}
                      >
                        <Text style={styles.btnText}>Delete</Text>
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
                {editingCategory ? "Edit Category" : "New Category"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Category Name"
                placeholderTextColor="#999"
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({ name: text })}
              />
              <View style={styles.modalActions}>
                <Button onPress={() => setShowCategoryModal(false)}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveCategory}>
                  Save
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
                  {editingItem ? "Edit Menu Item" : "New Menu Item"}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Item Name"
                  placeholderTextColor="#999"
                  value={itemForm.name}
                  onChangeText={(text) =>
                    setItemForm({ ...itemForm, name: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  placeholderTextColor="#999"
                  value={itemForm.description}
                  onChangeText={(text) =>
                    setItemForm({ ...itemForm, description: text })
                  }
                  multiline
                />
                <TextInput
                  style={styles.input}
                  placeholder="Price"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={itemForm.price}
                  onChangeText={(text) =>
                    setItemForm({ ...itemForm, price: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Loyalty Points Multiplier (e.g., 1.5 = 150% points)"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={itemForm.loyaltyPointsMultiplier}
                  onChangeText={(text) =>
                    setItemForm({ ...itemForm, loyaltyPointsMultiplier: text })
                  }
                />
                <TextInput
                  style={styles.input}
                  placeholder="Image URL (optional)"
                  placeholderTextColor="#999"
                  value={itemForm.imageUrl}
                  onChangeText={(text) =>
                    setItemForm({ ...itemForm, imageUrl: text })
                  }
                />
                <Text style={styles.label}>Category:</Text>
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
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={saveMenuItem}>
                    Save
                  </Button>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* QR Codes Tab */}
        {activeTab === "qr" && <QRTokenManagement />}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <ScrollView>
            <Card style={styles.card}>
              <Card.Title title="Minimum Order Value" />
              <Card.Content>
                <Text style={styles.settingDescription}>
                  Set the minimum order value in EUR. Orders below this amount will be rejected.
                </Text>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Minimum Value (€):</Text>
                  <TextInput
                    style={styles.settingInput}
                    keyboardType="numeric"
                    value={minOrderValue}
                    onChangeText={setMinOrderValue}
                    placeholder="15.00"
                    placeholderTextColor="#999"
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveMinOrderValue}
                  disabled={savingSettings}
                >
                  <Text style={styles.saveButtonText}>
                    {savingSettings ? "Saving..." : "Save Setting"}
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
  addBtnText: {
    color: "#231a13",
    fontWeight: "bold",
    fontSize: 16,
  },
  menuItemCard: {
    backgroundColor: "#2d2117",
    marginBottom: 12,
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
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
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
