import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { TextInput, Button, useTheme, Card, Title, HelperText } from "react-native-paper";
import { NavigationProps } from "../types";
import { validateEmail } from "../utils/validation";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingOverlay from "../components/common/LoadingOverlay";
import apiClient from "../utils/apiClient";

const ForgotPasswordScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setValidationError("Email is required");
      return false;
    }
    if (!validateEmail(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSuccess(true);
      setEmail("");
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Forgot Password</Title>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
            
            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Password reset email sent! Please check your inbox.
                </Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationError) {
                    setValidationError(null);
                  }
                }}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={!!validationError}
                disabled={isLoading}
              />
              {validationError && (
                <HelperText type="error" visible={!!validationError}>
                  {validationError}
                </HelperText>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.goBack()}
              disabled={isLoading}
              style={styles.backButton}
              labelStyle={styles.backButtonLabel}
            >
              Back to Login
            </Button>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>
      
      <ErrorMessage 
        error={error} 
        onDismiss={() => setError(null)} 
      />
      
      <LoadingOverlay 
        visible={isLoading} 
        message="Sending reset link..." 
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#231a13",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#2d2117",
    borderRadius: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  title: {
    color: "#fffbe8",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#e0b97f",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.9,
  },
  successContainer: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fffbe8",
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
  },
  buttonContent: {
    backgroundColor: "#e0b97f",
    paddingVertical: 4,
  },
  buttonLabel: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    marginTop: 8,
  },
  backButtonLabel: {
    color: "#e0b97f",
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
