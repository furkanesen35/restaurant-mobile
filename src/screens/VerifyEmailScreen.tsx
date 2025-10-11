import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Button, TextInput, ActivityIndicator } from "react-native-paper";
import { StackScreenProps } from "@react-navigation/stack";
import apiClient from "../utils/apiClient";

type Props = StackScreenProps<any, "VerifyEmail">;

const VerifyEmailScreen: React.FC<Props> = ({ route, navigation }) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const handleVerify = useCallback(
    async (verificationToken?: string) => {
      const tokenToVerify = verificationToken || token;
      if (!tokenToVerify.trim()) {
        Alert.alert("Error", "Please enter the verification code");
        return;
      }

      try {
        if (verificationToken) {
          setAutoVerifying(true);
        } else {
          setLoading(true);
        }

        await apiClient.get(`/auth/verify-email?token=${tokenToVerify.trim()}`);
        setSuccess(true);
        setCountdown(5);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              navigation.navigate(token ? "Main" : "Login");
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error.response?.data?.error ||
            "Failed to verify email. Please try again.",
        );
      } finally {
        setLoading(false);
        setAutoVerifying(false);
      }
    },
    [token, navigation],
  );

  useEffect(() => {
    // Try to get token from route params (deep link)
    const tokenFromParams = route.params?.token;
    if (tokenFromParams) {
      setToken(tokenFromParams);
      handleVerify(tokenFromParams);
    }
  }, [route.params, handleVerify]);

  if (autoVerifying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.title}>Verifying your email...</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Verification Successful!</Text>
        <Text style={styles.subtitle}>
          Redirecting to main page in {countdown} second
          {countdown !== 1 ? "s" : ""}...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Email</Text>
      <Text style={styles.subtitle}>
        Enter the verification code from your email
      </Text>

      <TextInput
        label="Verification Code"
        value={token}
        onChangeText={setToken}
        mode="outlined"
        style={styles.input}
        autoCapitalize="none"
        multiline
      />

      <Button
        mode="contained"
        onPress={() => handleVerify()}
        loading={loading}
        disabled={loading || success}
        style={styles.button}
      >
        Verify Email
      </Button>

      <Button
        mode="text"
        onPress={() => navigation.navigate("Login")}
        style={styles.backButton}
        disabled={success}
      >
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    marginBottom: 15,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  backButton: {
    marginTop: 15,
  },
});

export default VerifyEmailScreen;
