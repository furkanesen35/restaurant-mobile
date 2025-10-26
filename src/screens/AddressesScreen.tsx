import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";
import ENV from "../config/env";

type Address = {
  id: number;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  phone?: string;
};

const AddressesScreen = () => {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<Address | Omit<Address, "id">>({
    label: "",
    street: "",
    city: "",
    postalCode: "",
    phone: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      const res = await fetch(ENV.API_URL + "/api/address", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Address[] = await res.json();
      setAddresses(data);
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleSave = async () => {
    try {
      console.log("Saving address:", form);
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${ENV.API_URL + "/api/address"}/${editingId}` : ENV.API_URL + "/api/address";
      console.log("Request URL:", url);
      console.log("Request method:", method);
      console.log("Request body:", JSON.stringify(form, null, 2));

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      console.log("Response status:", res.status);
      const responseData = await res.text();
      console.log("Response data:", responseData);

      if (!res.ok)
        throw new Error(
          `Failed to save address: ${res.status} - ${responseData}`,
        );

      setForm({
        label: "",
        street: "",
        city: "",
        postalCode: "",
        phone: "",
      });
      setEditingId(null);
      fetchAddresses();
      Alert.alert("Success", "Address saved successfully");
    } catch (err) {
      console.error("Error saving address:", err);
      Alert.alert("Error", (err as Error).message);
    }
  };

  const handleEdit = (address: Address) => {
    setForm({
      label: address.label,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      phone: address.phone,
    });
    setEditingId(address.id);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${ENV.API_URL + "/api/address"}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAddresses();
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={(item: Address) => item.id.toString()}
        renderItem={({ item }: { item: Address }) => (
          <View style={styles.addressCard}>
            <Text style={styles.label}>{item.label}</Text>
            <Text>
              {item.street}, {item.city}, {item.postalCode}
            </Text>
            <Text>{item.phone}</Text>
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
          {editingId ? "Edit Address" : "Add Address"}
        </Text>
        <TextInput
          placeholder="Label"
          value={form.label}
          onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Street"
          value={form.street}
          onChangeText={(v) => setForm((f) => ({ ...f, street: v }))}
          style={styles.input}
        />
        <TextInput
          placeholder="City"
          value={form.city}
          onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Postal Code"
          value={form.postalCode}
          onChangeText={(v) => setForm((f) => ({ ...f, postalCode: v }))}
          style={styles.input}
        />
        <TextInput
          placeholder="Phone"
          value={form.phone}
          onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          style={styles.input}
        />
        <Button title={editingId ? "Update" : "Add"} onPress={handleSave} />
        {editingId && (
          <Button
            title="Cancel"
            color="gray"
            onPress={() => {
              setEditingId(null);
              setForm({
                label: "",
                street: "",
                city: "",
                postalCode: "",
                phone: "",
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
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "#fffbe8" },
  addressCard: {
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
});

export default AddressesScreen;
