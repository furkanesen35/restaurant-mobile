import React, { useState } from "react";
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      setError("All fields are required");
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (trimmedPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      await register({ email: trimmedEmail, password: trimmedPassword });
      setSuccess("Registration successful!");
    } catch (e: any) {
      setError(e.message || "Registration failed");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // MAIN CONTAINER - The entire Register screen wrapper
  // Used by: Root View component wrapping the registration card
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    justifyContent: "center", // Centers card vertically on screen
    alignItems: "center", // Centers card horizontally on screen
    backgroundColor: "#231a13", // Dark brown background (matches app theme)
  },

  // ============================================================================
  // REGISTRATION CARD - The card container holding the registration form
  // Used by: Card component wrapping all registration form elements
  // ============================================================================
  card: {
    width: "90%", // Card takes 90% of screen width (leaves 5% margin on each side)
    backgroundColor: "#2d2117", // Lighter brown card surface
    borderRadius: 16, // Rounded corners for modern, friendly look
    padding: 16, // 16px padding on all sides
  },

  // ============================================================================
  // TITLE - "Create Account" heading at top of form
  // Used by: Text component showing registration screen title
  // ============================================================================
  title: {
    color: "#fffbe8", // Light cream color for high contrast on dark background
    fontSize: 24, // Large text size for prominent heading
    fontWeight: "bold", // Bold weight for emphasis and hierarchy
    marginBottom: 16, // 16px space between title and first input field
    textAlign: "center", // Centers text horizontally
  },

  // ============================================================================
  // INPUT FIELD - Text input boxes for name, email, password
  // Used by: TextInput components for all registration fields
  // ============================================================================
  input: {
    marginBottom: 12, // 12px space between input fields
    backgroundColor: "#fffbe8", // Light cream background for good contrast with dark text
  },

  // ============================================================================
  // REGISTER BUTTON - Primary action button to submit registration
  // Used by: Button component for creating new account
  // ============================================================================
  button: {
    marginTop: 8, // 8px space above button (from last input)
    marginBottom: 8, // 8px space below button (before login link)
  },

  // ============================================================================
  // LINK TEXT - "Already have an account? Login" clickable text
  // Used by: Text inside TouchableOpacity for navigation to LoginScreen
  // ============================================================================
  link: {
    color: "#e0b97f", // Gold color to indicate interactivity
    textAlign: "center", // Centers text horizontally
    marginTop: 8, // 8px space above link
  },

  // ============================================================================
  // ERROR MESSAGE - Red text showing validation or API errors
  // Used by: Text component displaying error messages
  // ============================================================================
  error: {
    color: "red", // Red text indicates error/problem
    marginBottom: 8, // 8px space below error message
    textAlign: "center", // Centers error text for visibility
  },

  // ============================================================================
  // SUCCESS MESSAGE - Green text showing successful registration
  // Used by: Text component displaying success confirmation
  // ============================================================================
  success: {
    color: "green", // Green text indicates success/completion
    marginBottom: 8, // 8px space below success message
    textAlign: "center", // Centers success text for visibility
  },
});

export default RegisterScreen;
