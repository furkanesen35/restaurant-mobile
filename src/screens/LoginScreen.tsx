import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { TextInput, Button, useTheme, Card, Title } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";

const LoginScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");
  const handleLogin = async () => {
    setError("");
    setSuccess("");
    try {
      await login(email, password);
      setSuccess("Login successful!");
    } catch (e: any) {
      setError(e.message || "Login failed");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Login</Title>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
            contentStyle={{ backgroundColor: "#e0b97f" }}
            labelStyle={{ color: "#231a13" }}
          >
            Login
          </Button>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Don't have an account? Register</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#231a13",
  },
  card: {
    width: "90%",
    backgroundColor: "#2d2117",
    borderRadius: 16,
    padding: 16,
  },
  title: {
    color: "#fffbe8",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "#fffbe8",
  },
  button: {
    marginTop: 8,
    marginBottom: 8,
  },
  link: {
    color: "#e0b97f",
    textAlign: "center",
    marginTop: 8,
  },
  error: {
    color: "red",
    marginBottom: 8,
    textAlign: "center",
  },
  success: {
    color: "green",
    marginBottom: 8,
    textAlign: "center",
  },
});

export default LoginScreen;
