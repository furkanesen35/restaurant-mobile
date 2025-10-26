import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
      {/* SafeAreaView wraps entire screen to respect safe areas (status bar, notch, etc.) */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#231a13" }}
        edges={["top", "bottom"]}
      >
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
                  <HelperText
                    type="error"
                    visible={!!validationErrors.password}
                  >
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
                  <Text style={styles.link}>
                    Don't have an account? Register
                  </Text>
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>

        <ErrorMessage error={error} onDismiss={clearError} />

        <LoadingOverlay visible={isLoading} message="Signing you in..." />
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // MAIN CONTAINER - The entire Login screen wrapper
  // Used by: KeyboardAvoidingView that wraps the login card
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    justifyContent: "center", // Centers card vertically on screen
    alignItems: "center", // Centers card horizontally on screen
    backgroundColor: "#231a13", // Dark brown background (matches app theme)
    paddingHorizontal: 16, // 16px padding on left and right to prevent edge touch
  },

  // ============================================================================
  // LOGIN CARD - The white/cream card container holding the form
  // Used by: Card component wrapping all login form elements
  // ============================================================================
  card: {
    width: "100%", // Card takes full width of container (minus padding)
    maxWidth: 400, // But never wider than 400px (looks better on tablets/wide screens)
    backgroundColor: "#2d2117", // Slightly lighter brown than background for card surface
    borderRadius: 20, // Large rounded corners for modern, friendly look
    elevation: 8, // Android shadow depth (8 units) - higher number = more prominent shadow
    // iOS shadow properties:
    shadowColor: "#000", // Black shadow color
    shadowOffset: { width: 0, height: 4 }, // Shadow offset: 0px horizontal, 4px down
    shadowOpacity: 0.3, // 30% opacity for subtle shadow
    shadowRadius: 8, // 8px blur radius for soft shadow edges
  },

  // ============================================================================
  // TITLE - "Welcome Back" heading at top of form
  // Used by: Title component from react-native-paper
  // ============================================================================
  title: {
    color: "#fffbe8", // Light cream color for high contrast on dark background
    fontSize: 28, // Large text size for prominent heading
    fontWeight: "bold", // Bold weight for emphasis and hierarchy
    marginBottom: 8, // 8px space between title and subtitle
    textAlign: "center", // Centers text horizontally
  },

  // ============================================================================
  // SUBTITLE - "Sign in to your account" text below title
  // Used by: Text component below main title
  // ============================================================================
  subtitle: {
    color: "#e0b97f", // Gold/tan accent color (theme primary color)
    fontSize: 16, // Medium size for secondary text
    textAlign: "center", // Centers text horizontally
    marginBottom: 32, // Large 32px gap before form inputs start
    opacity: 0.9, // Slightly transparent (90% visible) for subtle hierarchy
  },

  // ============================================================================
  // INPUT CONTAINER - Wrapper for each input field + error message
  // Used by: View wrapping TextInput and HelperText for email and password
  // ============================================================================
  inputContainer: {
    marginBottom: 16, // 16px space between input fields
  },

  // ============================================================================
  // INPUT FIELD - Email and Password text input boxes
  // Used by: TextInput components for email and password entry
  // ============================================================================
  input: {
    backgroundColor: "#fffbe8", // Light cream background for good contrast with dark text
  },

  // ============================================================================
  // SIGN IN BUTTON - Primary action button
  // Used by: Main "Sign In" Button component
  // ============================================================================
  button: {
    marginTop: 16, // 16px space above button (from last input)
    marginBottom: 16, // 16px space below button (before forgot password link)
    borderRadius: 12, // Rounded corners matching input fields
  },

  // ============================================================================
  // SIGN IN BUTTON CONTENT - Inner styling of button
  // Used by: contentStyle prop of Button component
  // ============================================================================
  buttonContent: {
    backgroundColor: "#e0b97f", // Gold/tan background (theme primary color)
    paddingVertical: 4, // 4px vertical padding for comfortable touch target
  },

  // ============================================================================
  // SIGN IN BUTTON LABEL - Text inside button
  // Used by: labelStyle prop of Button component
  // ============================================================================
  buttonLabel: {
    color: "#231a13", // Dark text on light button for high contrast
    fontSize: 16, // Standard button text size
    fontWeight: "600", // Semi-bold for emphasis
  },

  // ============================================================================
  // FORGOT PASSWORD CONTAINER - Wrapper for forgot password link
  // Used by: TouchableOpacity wrapper around forgot password text
  // ============================================================================
  forgotPasswordContainer: {
    alignItems: "center", // Centers link horizontally
    marginTop: 12, // 12px space above link
    marginBottom: 8, // 8px space below link (before OR divider)
  },

  // ============================================================================
  // FORGOT PASSWORD TEXT - The clickable "Forgot Password?" link
  // Used by: Text inside TouchableOpacity for forgot password
  // ============================================================================
  forgotPasswordText: {
    color: "#e0b97f", // Gold accent color to show it's interactive
    fontSize: 14, // Smaller than main text (secondary action)
    textDecorationLine: "underline", // Underline indicates it's a clickable link
  },

  // ============================================================================
  // DIVIDER CONTAINER - Wrapper for "OR" section with lines
  // Used by: View containing left line, "OR" text, and right line
  // ============================================================================
  dividerContainer: {
    flexDirection: "row", // Arranges children horizontally (line-text-line)
    alignItems: "center", // Vertically centers all items (aligns lines with text)
    marginVertical: 16, // 16px space above and below divider section
  },

  // ============================================================================
  // DIVIDER LINE - Horizontal lines on left and right of "OR"
  // Used by: Divider components on both sides of "OR" text
  // ============================================================================
  divider: {
    flex: 1, // Takes up all remaining horizontal space (makes lines stretch)
    backgroundColor: "#e0b97f", // Gold color matching theme
    height: 1, // Thin 1px line
  },

  // ============================================================================
  // DIVIDER TEXT - "OR" text between the lines
  // Used by: Text component in middle of divider section
  // ============================================================================
  dividerText: {
    color: "#e0b97f", // Gold color matching divider lines
    marginHorizontal: 12, // 12px space on left and right of text (gap from lines)
    fontSize: 14, // Small text size
  },

  // ============================================================================
  // GOOGLE BUTTON - "Sign in with Google" button (currently commented out)
  // Used by: Button component for Google OAuth (when enabled)
  // ============================================================================
  googleButton: {
    marginBottom: 16, // 16px space below button
    borderRadius: 12, // Rounded corners matching other buttons
    borderColor: "#e0b97f", // Gold border color
    borderWidth: 2, // 2px thick border (outline style)
  },

  // ============================================================================
  // GOOGLE BUTTON CONTENT - Inner styling of Google button
  // Used by: contentStyle prop of Google sign-in Button (when enabled)
  // ============================================================================
  googleButtonContent: {
    paddingVertical: 4, // 4px vertical padding for comfortable touch target
  },

  // ============================================================================
  // GOOGLE BUTTON LABEL - Text inside Google button
  // Used by: labelStyle prop of Google sign-in Button (when enabled)
  // ============================================================================
  googleButtonLabel: {
    color: "#e0b97f", // Gold text for outline button (matches border)
    fontSize: 16, // Same size as primary button text
    fontWeight: "600", // Semi-bold for consistency with primary button
  },

  // ============================================================================
  // FOOTER - Bottom section with registration link
  // Used by: View containing "Don't have an account?" link
  // ============================================================================
  footer: {
    alignItems: "center", // Centers link horizontally
    marginTop: 8, // 8px space above footer section
  },

  // ============================================================================
  // LINK TEXT - "Don't have an account? Register" clickable text
  // Used by: Text inside TouchableOpacity for navigation to RegisterScreen
  // ============================================================================
  link: {
    color: "#e0b97f", // Gold color to indicate interactivity
    textAlign: "center", // Centers text horizontally
    fontSize: 16, // Standard link text size
    textDecorationLine: "underline", // Underline shows it's clickable
  },
});

export default LoginScreen;
