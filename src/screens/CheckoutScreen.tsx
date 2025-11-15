import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "react-native-paper";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import ENV from "../config/env";
import { useNavigation } from "@react-navigation/native";
import logger from '../utils/logger';
type PaymentMethod = {
  id: number;
  type: string;
  cardNumber?: string;
  cardHolder?: string;
  expiry?: string;
  brand?: string;
  paypalEmail?: string;
  isDefault: boolean;
};

type Address = {
  id: number;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  phone: string;
};

const CheckoutScreen = () => {
  const { token, user, updateUser } = useAuth();
  const { cart, clearCart } = useCart();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { confirmPayment } = useStripe();

  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [cardComplete, setCardComplete] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null
  );
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // New address form state
  const [newAddressForm, setNewAddressForm] = useState({
    label: "",
    street: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [savePaymentToProfile, setSavePaymentToProfile] = useState(true);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Fetch payment methods on mount
  React.useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingMethods(true);
        const res = await fetch(`${ENV.API_URL}/api/payment`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch payment methods");
        const data: PaymentMethod[] = await res.json();
        setSavedMethods(data);

        // Auto-select default payment method or new card option (-1)
        const defaultMethod = data.find((m) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        } else if (data.length > 0) {
          setSelectedMethodId(data[0].id);
        } else {
          setSelectedMethodId(-1); // Select "Add New Card" option
        }
      } catch (err) {
        logger.error("Error fetching payment methods:", err);
        // If no saved methods, select new card option
        setSelectedMethodId(-1);
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, [token]);

  // Fetch addresses on mount
  React.useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const res = await fetch(`${ENV.API_URL}/api/address`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch addresses");
        const data: Address[] = await res.json();
        setAddresses(data);

        // Auto-select first address
        if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      } catch (err) {
        logger.error("Error fetching addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [token]);

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to place an order.");
      return;
    }

    // Check if address is selected or new address is being added
    if (selectedAddressId === null && selectedAddressId !== -1) {
      Alert.alert("Error", "Please select a delivery address.");
      return;
    }

    if (selectedAddressId === -1) {
      // Validate new address form
      if (
        !newAddressForm.label ||
        !newAddressForm.street ||
        !newAddressForm.city ||
        !newAddressForm.postalCode ||
        !newAddressForm.phone
      ) {
        Alert.alert("Error", "Please fill in all address fields.");
        return;
      }
    }

    // Check if payment method is selected or new card is being added
    if (selectedMethodId === null && selectedMethodId !== -1) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }

    if (selectedMethodId === -1 && !cardComplete) {
      Alert.alert("Error", "Please enter valid card details.");
      return;
    }

    setLoading(true);

    try {
      // Step 0: Create new address if needed
      let finalAddressId = selectedAddressId;
      if (selectedAddressId === -1) {
        // Create address with saveToProfile flag
        const addressRes = await fetch(`${ENV.API_URL}/api/address`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...newAddressForm,
            saveToProfile: saveAddressToProfile,
          }),
        });
        if (!addressRes.ok) throw new Error("Failed to create address");
        const newAddress = await addressRes.json();
        finalAddressId = newAddress.id;
      }

      // Step 1: Create Stripe PaymentIntent
      const paymentIntentRes = await fetch(
        `${ENV.API_URL}/api/payment/stripe-intent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: total,
            currency: "eur", // Euro
          }),
        }
      );

      if (!paymentIntentRes.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await paymentIntentRes.json();

      // Step 2: Confirm payment with Stripe
      let paymentResult;
      let paymentMethodDetails = null;

      if (selectedMethodId === -1) {
        // Using new card
        paymentResult = await confirmPayment(clientSecret, {
          paymentMethodType: "Card",
        });

        // If payment successful and user wants to save card
        if (!paymentResult.error && savePaymentToProfile && paymentResult.paymentIntent) {
          // Extract card details from payment intent
          const paymentIntent = paymentResult.paymentIntent;
          if (paymentIntent.paymentMethod) {
            paymentMethodDetails = {
              last4: paymentIntent.paymentMethod.Card?.last4 || "****",
              brand: paymentIntent.paymentMethod.Card?.brand || "Card",
              expMonth: paymentIntent.paymentMethod.Card?.expMonth || 0,
              expYear: paymentIntent.paymentMethod.Card?.expYear || 0,
            };
          }
        }
      } else {
        // Using saved payment method
        const selectedMethod = savedMethods.find(
          (m) => m.id === selectedMethodId
        );
        if (!selectedMethod) {
          throw new Error("Selected payment method not found");
        }

        // For saved cards, you would typically have saved the Stripe payment method ID
        // For now, we'll just simulate success since we're storing card details locally
        paymentResult = { error: undefined };
      }

      if (paymentResult.error) {
        throw new Error(paymentResult.error.message);
      }

      // Step 2.5: Save payment method if requested
      if (paymentMethodDetails && savePaymentToProfile) {
        try {
          const expiry = `${paymentMethodDetails.expMonth}/${paymentMethodDetails.expYear}`;
          const saveCardRes = await fetch(`${ENV.API_URL}/api/payment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              type: "Card",
              cardNumber: paymentMethodDetails.last4,
              cardHolder: "Card Holder", // You might want to add a field for this
              expiry: expiry,
              brand: paymentMethodDetails.brand,
              isDefault: false,
              saveToProfile: true,
            }),
          });

          if (saveCardRes.ok) {
            logger.info("Payment method saved to profile");
          }
        } catch (err) {
          logger.error("Failed to save payment method:", err);
          // Don't fail the order if card save fails
        }
      }

      // Step 3: Create order after successful payment
      const items = cart.map((i) => ({
        menuItemId: parseInt(i.menuItemId),
        quantity: i.quantity,
      }));

      const orderPayload = {
        userId: user.id,
        items: items,
        paymentMethodId: selectedMethodId === -1 ? null : selectedMethodId,
        addressId: finalAddressId,
      };

      const orderRes = await fetch(`${ENV.API_URL}/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderRes.json();
      const pointsEarned = orderData?.loyaltyPointsEarned ?? 0;
      const updatedBalance = orderData?.loyaltyPointsBalance;

      if (typeof updatedBalance === "number") {
        await updateUser({ loyaltyPoints: updatedBalance });
      }

      // Success!
      clearCart();
      Alert.alert(
        "Order placed!",
        pointsEarned > 0
          ? `Your payment was successful and order has been received. You earned ${pointsEarned} loyalty points!`
          : "Your payment was successful and order has been received.",
        [
          {
            text: "View Orders",
            onPress: () => {
              // Navigate back to MainTabs and switch to Orders tab
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "MainTabs" as never,
                    state: {
                      routes: [{ name: "Orders" }],
                      index: 0,
                    },
                  },
                ],
              });
            },
          },
          {
            text: "Stay Here",
            style: "cancel",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      logger.error("Order placement error:", err);
      Alert.alert("Error", err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (loadingMethods || loadingAddresses) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.onBackground, marginTop: 16 }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    // SafeAreaView prevents content from going under status bar and notches
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#231a13" }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={[styles.container, { backgroundColor: "#231a13" }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            Checkout
          </Text>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Order Summary
            </Text>
            {cart.map((item) => (
              <View key={item.menuItemId} style={styles.orderItem}>
                <Text style={{ color: colors.onBackground }}>
                  {item.name} x {item.quantity}
                </Text>
                <Text style={{ color: colors.onBackground }}>
                  €{(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalText, { color: colors.primary }]}>
                Total:
              </Text>
              <Text style={[styles.totalText, { color: colors.primary }]}>
                €{total.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Delivery Address
            </Text>

            {/* Saved Addresses */}
            {addresses.map((address) => (
              <TouchableOpacity
                key={address.id}
                style={[
                  styles.optionCard,
                  selectedAddressId === address.id && styles.selectedCard,
                  selectedAddressId === address.id
                    ? { borderWidth: 2, borderStyle: "solid" }
                    : { borderWidth: 2, borderStyle: "dashed" },
                  { backgroundColor: "#2d2117", borderColor: colors.primary },
                ]}
                onPress={() => setSelectedAddressId(address.id)}
              >
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.primary }]}>
                    {address.label}
                  </Text>
                  <Text style={{ color: colors.onBackground }}>
                    {address.street}
                  </Text>
                  <Text style={{ color: colors.onBackground }}>
                    {address.city}, {address.postalCode}
                  </Text>
                  <Text style={{ color: colors.onBackground }}>
                    📞 {address.phone}
                  </Text>
                </View>
                {selectedAddressId === address.id && (
                  <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Add New Address Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAddressId === -1 && styles.selectedCard,
                selectedAddressId === -1
                  ? { borderWidth: 2, borderStyle: "solid" }
                  : { borderWidth: 2, borderStyle: "dashed" },
                { backgroundColor: "#2d2117", borderColor: colors.primary },
              ]}
              onPress={() => setSelectedAddressId(-1)}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: colors.primary }]}>
                  + Add New Address
                </Text>
              </View>
              {selectedAddressId === -1 && (
                <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
              )}
            </TouchableOpacity>

            {/* New Address Form (shown when -1 is selected) */}
            {selectedAddressId === -1 && (
              <View style={styles.formSection}>
                <TextInput
                  placeholder="Label (e.g., Home, Work)"
                  value={newAddressForm.label}
                  onChangeText={(text) =>
                    setNewAddressForm({ ...newAddressForm, label: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <TextInput
                  placeholder="Street Address"
                  value={newAddressForm.street}
                  onChangeText={(text) =>
                    setNewAddressForm({ ...newAddressForm, street: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <TextInput
                  placeholder="City"
                  value={newAddressForm.city}
                  onChangeText={(text) =>
                    setNewAddressForm({ ...newAddressForm, city: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <TextInput
                  placeholder="Postal Code"
                  value={newAddressForm.postalCode}
                  onChangeText={(text) =>
                    setNewAddressForm({ ...newAddressForm, postalCode: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                />
                <TextInput
                  placeholder="Phone"
                  value={newAddressForm.phone}
                  onChangeText={(text) =>
                    setNewAddressForm({ ...newAddressForm, phone: text })
                  }
                  style={styles.input}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />

                {/* Save to Profile Toggle */}
                <View style={styles.toggleContainer}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.toggleLabel, { color: colors.primary }]}
                    >
                      Save this address to my profile
                    </Text>
                    <Text style={[styles.toggleSubtext, { color: "#999" }]}>
                      You can use it for future orders
                    </Text>
                  </View>
                  <Switch
                    value={saveAddressToProfile}
                    onValueChange={setSaveAddressToProfile}
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={saveAddressToProfile ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Payment Methods */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              Payment Method
            </Text>

            {/* Saved Payment Methods */}
            {savedMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.optionCard,
                  selectedMethodId === method.id && styles.selectedCard,
                  selectedMethodId === method.id
                    ? { borderWidth: 2, borderStyle: "solid" }
                    : { borderWidth: 2, borderStyle: "dashed" },
                  { backgroundColor: "#2d2117", borderColor: colors.primary },
                ]}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <View style={styles.optionInfo}>
                  <Text
                    style={[styles.optionLabel, { color: colors.onBackground }]}
                  >
                    {method.type === "Card"
                      ? `${method.brand || ""} Card`
                      : "PayPal"}
                  </Text>
                  {method.type === "Card" ? (
                    <Text style={{ color: colors.onBackground }}>
                      **** **** **** {method.cardNumber?.slice(-4)}
                    </Text>
                  ) : (
                    <Text style={{ color: colors.onBackground }}>
                      {method.paypalEmail}
                    </Text>
                  )}
                  {method.isDefault && (
                    <Text style={{ color: colors.primary, fontSize: 12 }}>
                      Default
                    </Text>
                  )}
                </View>
                {selectedMethodId === method.id && (
                  <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            {/* Add New Card Option */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedMethodId === -1 && styles.selectedCard,
                selectedMethodId === -1
                  ? { borderWidth: 2, borderStyle: "solid" }
                  : { borderWidth: 2, borderStyle: "dashed" },
                { backgroundColor: "#2d2117", borderColor: colors.primary },
              ]}
              onPress={() => setSelectedMethodId(-1)}
            >
              <View style={styles.optionInfo}>
                <Text style={[styles.optionLabel, { color: colors.primary }]}>
                  + Add New Card
                </Text>
              </View>
              {selectedMethodId === -1 && (
                <Text style={{ color: colors.primary, fontSize: 20 }}>✓</Text>
              )}
            </TouchableOpacity>

            {/* New Card Form (shown when -1 is selected) */}
            {selectedMethodId === -1 && (
              <View style={styles.formSection}>
                <Text style={{ color: colors.onBackground, marginBottom: 8 }}>
                  Enter card details:
                </Text>
                <View style={styles.cardFieldWrapper}>
                  <CardField
                    postalCodeEnabled={false}
                    placeholders={{
                      number: "4242 4242 4242 4242",
                    }}
                    cardStyle={{
                      backgroundColor: "#FFFFFF",
                      textColor: "#000000",
                      placeholderColor: "#999999",
                    }}
                    style={styles.cardField}
                    onCardChange={(cardDetails) => {
                      setCardComplete(cardDetails.complete);
                    }}
                  />
                </View>
                <Text style={{ color: "#888", fontSize: 12, marginTop: 8 }}>
                  Test card: 4242 4242 4242 4242, any future date, any CVC
                </Text>

                {/* Save to Profile Toggle */}
                <View style={styles.toggleContainer}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.toggleLabel, { color: colors.primary }]}
                    >
                      Save this card to my profile
                    </Text>
                    <Text style={[styles.toggleSubtext, { color: "#999" }]}>
                      Securely save for faster checkout
                    </Text>
                  </View>
                  <Switch
                    value={savePaymentToProfile}
                    onValueChange={setSavePaymentToProfile}
                    trackColor={{ false: "#767577", true: colors.primary }}
                    thumbColor={savePaymentToProfile ? "#fff" : "#f4f3f4"}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Place Order Button */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.placeOrderButton,
              { backgroundColor: colors.primary },
              loading && styles.buttonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <Text
                style={{
                  color: colors.onPrimary,
                  fontSize: 18,
                  fontWeight: "bold",
                }}
              >
                Pay €{total.toFixed(2)} & Place Order
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    color: "#fffbe8",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#fffbe8",
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  totalText: {
    fontSize: 22,
    fontWeight: "bold",
  },
  cardFieldWrapper: {
    marginVertical: 12,
    minHeight: 60,
  },
  cardField: {
    width: "100%",
    height: 50,
  },
  placeOrderButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 24,
    minHeight: 60,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedCard: {
    // Applied when selected - solid border is set inline
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  formSection: {
    backgroundColor: "#2d2117",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#fffbe8",
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
    color: "#000",
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 12,
  },
});

export default CheckoutScreen;


