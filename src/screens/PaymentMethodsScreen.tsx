import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import ENV from "../config/env";

// PaymentMethod type
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
  const [form, setForm] = useState<Omit<PaymentMethod, "id">>({
    type: "Card",
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    brand: "",
    paypalEmail: "",
    isDefault: false,
  });
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const handleSave = async () => {
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${ENV.API_URL}/api/payment/${editingId}` : `${ENV.API_URL}/api/payment`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save payment method");
      setForm({
        type: "Card",
        cardNumber: "",
        cardHolder: "",
        expiry: "",
        brand: "",
        paypalEmail: "",
        isDefault: false,
      });
      setEditingId(null);
      fetchMethods();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleEdit = (pm: PaymentMethod) => {
    setForm(pm);
    setEditingId(pm.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${ENV.API_URL}/api/payment/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMethods();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Payment Methods</Text>
      <FlatList
        data={methods}
        keyExtractor={(item: PaymentMethod) => item.id.toString()}
        renderItem={({ item }: { item: PaymentMethod }) => (
          <View style={styles.card}>
            <Text style={styles.label}>
              {item.type === "Card" ? `${item.brand} Card` : "PayPal"}
            </Text>
            {item.type === "Card" ? (
              <Text>
                {item.cardHolder} - **** **** **** {item.cardNumber?.slice(-4)}
              </Text>
            ) : (
              <Text>{item.paypalEmail}</Text>
            )}
            <Text>{item.isDefault ? "Default" : ""}</Text>
            <View style={styles.actions}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button
                title="Delete"
                color="red"
                onPress={() => handleDelete(item.id)}
              />
            </View>
          </View>
        )}
      />
      <View style={styles.form}>
        <Text style={styles.formTitle}>
          {editingId ? "Edit Payment Method" : "Add Payment Method"}
        </Text>
        <TextInput
          placeholder="Type (Card/PayPal)"
          value={form.type}
          onChangeText={(v) => setForm((f) => ({ ...f, type: v }))}
          style={styles.input}
        />
        {form.type === "Card" ? (
          <>
            <TextInput
              placeholder="Card Number"
              value={form.cardNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, cardNumber: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Card Holder"
              value={form.cardHolder}
              onChangeText={(v) => setForm((f) => ({ ...f, cardHolder: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Expiry"
              value={form.expiry}
              onChangeText={(v) => setForm((f) => ({ ...f, expiry: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Brand"
              value={form.brand}
              onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))}
              style={styles.input}
            />
          </>
        ) : (
          <TextInput
            placeholder="PayPal Email"
            value={form.paypalEmail}
            onChangeText={(v) => setForm((f) => ({ ...f, paypalEmail: v }))}
            style={styles.input}
          />
        )}
        <View style={styles.switchRow}>
          <Text>Set as Default</Text>
          <Switch
            value={form.isDefault}
            onValueChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
          />
        </View>
        <Button title={editingId ? "Update" : "Add"} onPress={handleSave} />
        {editingId && (
          <Button
            title="Cancel"
            color="gray"
            onPress={() => {
              setEditingId(null);
              setForm({
                type: "Card",
                cardNumber: "",
                cardHolder: "",
                expiry: "",
                brand: "",
                paypalEmail: "",
                isDefault: false,
              });
            }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: {
    backgroundColor: "#fffbe8",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  label: { fontWeight: "bold" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  form: {
    marginTop: 24,
    backgroundColor: "#2d2117",
    padding: 16,
    borderRadius: 8,
  },
  formTitle: { color: "#fffbe8", fontSize: 18, marginBottom: 8 },
  input: {
    backgroundColor: "#fffbe8",
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
  },
  switchRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
});

export default PaymentMethodsScreen;
