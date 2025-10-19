import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Switch,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { CardField } from "@stripe/stripe-react-native";
import ENV from "../config/env";

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

const PaymentMethodsScreen = () => {
  const { token } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [cardHolderName, setCardHolderName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      const res = await fetch(`${ENV.API_URL}/api/payment`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: PaymentMethod[] = await res.json();
      setMethods(data);
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  }, [token]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleSaveCard = async () => {
    if (!cardComplete) {
      Alert.alert("Error", "Please enter valid card details");
      return;
    }
    if (!cardHolderName.trim()) {
      Alert.alert("Error", "Please enter cardholder name");
      return;
    }

    setSaving(true);
    try {
      const last4 = cardDetails?.last4 || "****";
      const brand = cardDetails?.brand || "Card";
      const expiryMonth = cardDetails?.expiryMonth || "";
      const expiryYear = cardDetails?.expiryYear || "";
      const expiry = `${expiryMonth}/${expiryYear}`;

      const payload = {
        type: "Card",
        cardNumber: last4,
        cardHolder: cardHolderName,
        expiry: expiry,
        brand: brand,
        isDefault: isDefault,
      };

      const res = await fetch(`${ENV.API_URL}/api/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save payment method");

      setCardHolderName("");
      setIsDefault(false);
      setCardComplete(false);
      setCardDetails(null);
      setShowAddCard(false);
      fetchMethods();
      Alert.alert("Success", "Payment method saved successfully");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Payment Method",
      "Are you sure you want to delete this payment method?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`${ENV.API_URL}/api/payment/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchMethods();
            } catch (err) {
              Alert.alert("Error", (err as Error).message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Payment Methods</Text>

      <FlatList
        data={methods}
        keyExtractor={(item: PaymentMethod) => item.id.toString()}
        renderItem={({ item }: { item: PaymentMethod }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardBrand}>{item.brand} Card</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardInfo}>{item.cardHolder}</Text>
            <Text style={styles.cardNumber}>{item.cardNumber?.slice(-4)}</Text>
            <Text style={styles.cardExpiry}>Expires: {item.expiry}</Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No payment methods saved. Add one below.
          </Text>
        }
      />

      {!showAddCard ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddCard(true)}
        >
          <Text style={styles.addButtonText}>+ Add New Card</Text>
        </TouchableOpacity>
      ) : (
        <ScrollView style={styles.form}>
          <Text style={styles.formTitle}>Add New Card</Text>

          <Text style={styles.label}>Cardholder Name</Text>
          <TextInput
            placeholder="John Doe"
            value={cardHolderName}
            onChangeText={setCardHolderName}
            style={styles.input}
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Card Details</Text>
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
              onCardChange={(details) => {
                setCardComplete(details.complete);
                setCardDetails(details);
              }}
            />
          </View>
          <Text style={styles.helperText}>
            Test card: 4242 4242 4242 4242, any future date, any CVC
          </Text>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set as Default</Text>
            <Switch value={isDefault} onValueChange={setIsDefault} />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSaveCard}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Card</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setShowAddCard(false);
              setCardHolderName("");
              setIsDefault(false);
              setCardComplete(false);
              setCardDetails(null);
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#231a13",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#d4af37",
  },
  card: {
    backgroundColor: "#2d2117",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3d3127",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d4af37",
  },
  defaultBadge: {
    backgroundColor: "#d4af37",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  defaultText: {
    color: "#231a13",
    fontSize: 12,
    fontWeight: "bold",
  },
  cardInfo: {
    color: "#fffbe8",
    fontSize: 14,
    marginBottom: 4,
  },
  cardNumber: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  cardExpiry: {
    color: "#999",
    fontSize: 12,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: "#8b0000",
    padding: 8,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  deleteText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
  addButton: {
    backgroundColor: "#d4af37",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
  form: {
    marginTop: 16,
    backgroundColor: "#2d2117",
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    color: "#d4af37",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    color: "#fffbe8",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#fffbe8",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    color: "#000",
  },
  cardFieldWrapper: {
    marginBottom: 8,
  },
  cardField: {
    width: "100%",
    height: 50,
  },
  helperText: {
    color: "#999",
    fontSize: 12,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 8,
  },
  switchLabel: {
    color: "#fffbe8",
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: "#d4af37",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "transparent",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d4af37",
  },
  cancelButtonText: {
    color: "#d4af37",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default PaymentMethodsScreen;
