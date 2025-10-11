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
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingOverlay from "../components/common/LoadingOverlay";
import apiClient from "../utils/apiClient";

const ResetPasswordScreen: React.FC<NavigationProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const [token, setToken] = useState((route?.params as any)?.token || '');
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ token?: string; newPassword?: string; confirmPassword?: string }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const errors: { token?: string; newPassword?: string; confirmPassword?: string } = {};
    
    if (!token.trim()) {
      errors.token = "Reset token is required";
    }
    
    if (!newPassword.trim()) {
      errors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.post('/auth/reset-password', { 
        token: token.trim(), 
        newPassword: newPassword.trim() 
      });
      setSuccess(true);
      setToken("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Navigate to login after 2 seconds
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
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
            <Title style={styles.title}>Reset Password</Title>
            <Text style={styles.subtitle}>
              Enter your new password below.
            </Text>
            
            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>
                  Password reset successful! Redirecting to login...
                </Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Reset Token (from email)"
                value={token}
                onChangeText={(text) => {
                  setToken(text);
                  if (validationErrors.token) {
                    setValidationErrors({ ...validationErrors, token: undefined });
                  }
                }}
                style={styles.input}
                autoCapitalize="none"
                error={!!validationErrors.token}
                disabled={isLoading || success}
              />
              {validationErrors.token && (
                <HelperText type="error" visible={!!validationErrors.token}>
                  {validationErrors.token}
                </HelperText>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="New Password"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (validationErrors.newPassword) {
                    setValidationErrors({ ...validationErrors, newPassword: undefined });
                  }
                }}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                textContentType="newPassword"
                error={!!validationErrors.newPassword}
                disabled={isLoading || success}
                right={
                  <TextInput.Icon 
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {validationErrors.newPassword && (
                <HelperText type="error" visible={!!validationErrors.newPassword}>
                  {validationErrors.newPassword}
                </HelperText>
              )}
            </View>
            
            <View style={styles.inputContainer}>
              <TextInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors({ ...validationErrors, confirmPassword: undefined });
                  }
                }}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
                textContentType="newPassword"
                error={!!validationErrors.confirmPassword}
                disabled={isLoading || success}
              />
              {validationErrors.confirmPassword && (
                <HelperText type="error" visible={!!validationErrors.confirmPassword}>
                  {validationErrors.confirmPassword}
                </HelperText>
              )}
            </View>
            
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={isLoading || success}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('Login')}
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
        message="Resetting password..." 
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

export default ResetPasswordScreen;
