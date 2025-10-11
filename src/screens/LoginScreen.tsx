import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  Divider,
} from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import { NavigationProps } from "../types";
import { validateEmail } from "../utils/validation";
import ErrorMessage from "../components/common/ErrorMessage";
import LoadingOverlay from "../components/common/LoadingOverlay";
// import * as Google from 'expo-auth-session/providers/google';
// import * as WebBrowser from 'expo-web-browser';
// import Constants from 'expo-constants';
// WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC<NavigationProps> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login({ email: email.trim().toLowerCase(), password });
      // Navigation will be handled automatically by the navigation structure
    } catch (e: any) {
      // Error is handled by the AuthContext and displayed via the error prop
      console.error("Login error:", e);
    }
  };

  // const googleClientId = Constants.expoConfig?.extra?.googleClientId;
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   clientId: googleClientId,
  //   scopes: ['profile', 'email'],
  // });

  // useEffect(() => {
  //   if (response?.type === 'success') {
  //     const { authentication } = response;
  //     if (authentication?.idToken) {
  //       // Fetch user info from Google API
  //       fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
  //         headers: { Authorization: `Bearer ${authentication.accessToken}` },
  //       })
  //         .then(res => res.json())
  //         .then(async userInfo => {
  //           await googleSignIn({
  //             email: userInfo.email,
  //             name: userInfo.name || userInfo.email,
  //             idToken: authentication.idToken || '',
  //           });
  //         })
  //         .catch(err => {
  //           console.error('Failed to fetch Google user info:', err);
  //         });
  //     }
  //   }
  // }, [response]);

  // const handleGoogleSignIn = () => {
  //   promptAsync();
  // };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Welcome Back</Title>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputContainer}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (validationErrors.email) {
                    setValidationErrors({
                      ...validationErrors,
                      email: undefined,
                    });
                  }
                }}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={!!validationErrors.email}
                disabled={isLoading}
              />
              {validationErrors.email && (
                <HelperText type="error" visible={!!validationErrors.email}>
                  {validationErrors.email}
                </HelperText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (validationErrors.password) {
                    setValidationErrors({
                      ...validationErrors,
                      password: undefined,
                    });
                  }
                }}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                error={!!validationErrors.password}
                disabled={isLoading}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
              {validationErrors.password && (
                <HelperText type="error" visible={!!validationErrors.password}>
                  {validationErrors.password}
                </HelperText>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>

            <TouchableOpacity
              onPress={() => navigation.navigate("ForgotPassword")}
              disabled={isLoading}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <Divider style={styles.divider} />
            </View>

            {/*
            <Button
              mode="outlined"
              onPress={handleGoogleSignIn}
              disabled={isLoading}
              style={styles.googleButton}
              contentStyle={styles.googleButtonContent}
              labelStyle={styles.googleButtonLabel}
              icon="google"
            >
              Sign in with Google
            </Button>
            */}

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                disabled={isLoading}
              >
                <Text style={styles.link}>Don't have an account? Register</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </KeyboardAvoidingView>

      <ErrorMessage error={error} onDismiss={clearError} />

      <LoadingOverlay visible={isLoading} message="Signing you in..." />
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
    shadowColor: "#000",
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
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.9,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#fffbe8",
  },
  button: {
    marginTop: 16,
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
  forgotPasswordContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: "#e0b97f",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  divider: {
    flex: 1,
    backgroundColor: "#e0b97f",
    height: 1,
  },
  dividerText: {
    color: "#e0b97f",
    marginHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    marginBottom: 16,
    borderRadius: 12,
    borderColor: "#e0b97f",
    borderWidth: 2,
  },
  googleButtonContent: {
    paddingVertical: 4,
  },
  googleButtonLabel: {
    color: "#e0b97f",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginTop: 8,
  },
  link: {
    color: "#e0b97f",
    textAlign: "center",
    fontSize: 16,
    textDecorationLine: "underline",
  },
});

export default LoginScreen;
