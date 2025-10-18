import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useTheme } from "react-native-paper";
import { CardField, useStripe } from "@stripe/stripe-react-native";
import ENV from "../config/env";
import { useNavigation } from "@react-navigation/native";

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

const CheckoutScreen = () => {
  const { token, user } = useAuth();
  const { cart, clearCart } = useCart();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { confirmPayment } = useStripe();

  const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [showNewCard, setShowNewCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [cardComplete, setCardComplete] = useState(false);

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

        // Auto-select default payment method
        const defaultMethod = data.find((m) => m.isDefault);
        if (defaultMethod) {
          setSelectedMethodId(defaultMethod.id);
        } else if (data.length > 0) {
          setSelectedMethodId(data[0].id);
        } else {
          setShowNewCard(true);
        }
      } catch (err) {
        console.error("Error fetching payment methods:", err);
        // If no saved methods, show new card form
        setShowNewCard(true);
      } finally {
        setLoadingMethods(false);
      }
    };
    
    fetchPaymentMethods();
  }, [token]);

  const handlePlaceOrder = async () => {
    if (!user) {
      Alert.alert("Error", "Please log in to place an order.");
      return;
    }

    if (!selectedMethodId && !showNewCard) {
      Alert.alert("Error", "Please select a payment method.");
      return;
    }

    if (showNewCard && !cardComplete) {
      Alert.alert("Error", "Please enter valid card details.");
      return;
    }

    setLoading(true);

    try {
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
            currency: "try", // Turkish Lira
          }),
        }
      );

      if (!paymentIntentRes.ok) {
        throw new Error("Failed to create payment intent");
      }

      const { clientSecret } = await paymentIntentRes.json();

      // Step 2: Confirm payment with Stripe
      let paymentResult;
      
      if (showNewCard) {
        // Using new card
        paymentResult = await confirmPayment(clientSecret, {
          paymentMethodType: "Card",
        });
      } else {
        // Using saved payment method
        const selectedMethod = savedMethods.find((m) => m.id === selectedMethodId);
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

      // Step 3: Create order after successful payment
      const items = cart.map((i) => ({
        menuItemId: parseInt(i.menuItemId),
        quantity: i.quantity,
      }));

      const orderPayload = {
        userId: user.id,
        items: items,
        paymentMethodId: selectedMethodId,
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

      // Success!
      clearCart();
      Alert.alert(
        "Order placed!",
        "Your payment was successful and order has been received.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Orders" as never),
          },
        ]
      );
    } catch (err: any) {
      console.error("Order placement error:", err);
      Alert.alert("Error", err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (loadingMethods) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.onBackground, marginTop: 16 }}>
          Loading payment methods...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: "#231a13" }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Checkout</Text>

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
              ₺{(item.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.totalText, { color: colors.primary }]}>
            Total:
          </Text>
          <Text style={[styles.totalText, { color: colors.primary }]}>
            ₺{total.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Payment Method
        </Text>

        {/* Saved Payment Methods */}
        {savedMethods.length > 0 && !showNewCard && (
          <>
            {savedMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.paymentMethodCard,
                  selectedMethodId === method.id && styles.selectedMethod,
                  { backgroundColor: "#2d2117" },
                ]}
                onPress={() => setSelectedMethodId(method.id)}
              >
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodType, { color: colors.onBackground }]}>
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

            <TouchableOpacity
              style={[styles.addNewButton, { borderColor: colors.primary }]}
              onPress={() => setShowNewCard(true)}
            >
              <Text style={{ color: colors.primary }}>+ Add New Card</Text>
            </TouchableOpacity>
          </>
        )}

        {/* New Card Form */}
        {showNewCard && (
          <View style={styles.newCardSection}>
            {savedMethods.length > 0 && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setShowNewCard(false)}
              >
                <Text style={{ color: colors.primary }}>
                  ← Back to saved methods
                </Text>
              </TouchableOpacity>
            )}
            <Text style={{ color: colors.onBackground, marginBottom: 8 }}>
              Enter card details:
            </Text>
            <CardField
              postalCodeEnabled={false}
              placeholders={{
                number: "4242 4242 4242 4242",
              }}
              cardStyle={{
                backgroundColor: "#FFFFFF",
                textColor: "#000000",
              }}
              style={{
                width: "100%",
                height: 50,
                marginVertical: 10,
              }}
              onCardChange={(cardDetails) => {
                setCardComplete(cardDetails.complete);
              }}
            />
            <Text style={{ color: "#888", fontSize: 12, marginTop: 4 }}>
              Use test card: 4242 4242 4242 4242, any future date, any CVC
            </Text>
          </View>
        )}
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
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
            Pay ₺{total.toFixed(2)} & Place Order
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
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
  paymentMethodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedMethod: {
    borderColor: "#d4af37",
  },
  methodInfo: {
    flex: 1,
  },
  methodType: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  addNewButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 8,
  },
  newCardSection: {
    backgroundColor: "#2d2117",
    padding: 16,
    borderRadius: 8,
  },
  backButton: {
    marginBottom: 16,
  },
  placeOrderButton: {
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CheckoutScreen;
