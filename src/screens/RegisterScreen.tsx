import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { TextInput, Button, Card, Title } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { NavigationProps } from "../types";

const RegisterScreen = ({ navigation }: NavigationProps) => {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await register({ email, password });
      setSuccess("Registration successful!");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Register</Title>
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
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
            contentStyle={{ backgroundColor: "#e0b97f" }}
            labelStyle={{ color: "#231a13" }}
          >
            Register
          </Button>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Already have an account? Login</Text>
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

export default RegisterScreen;
