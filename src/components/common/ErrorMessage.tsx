import React from "react";
import { Text, StyleSheet } from "react-native";
import { Snackbar } from "react-native-paper";
import { ErrorMessageProps } from "../../types";

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  const handleDismiss = onDismiss || (() => {});

  return (
    <Snackbar
      visible={!!error}
      onDismiss={handleDismiss}
      duration={5000}
      style={styles.snackbar}
      action={{
        label: "Dismiss",
        onPress: handleDismiss,
        textColor: "#fffbe8",
      }}
    >
      <Text style={styles.text}>{error}</Text>
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: "#d32f2f",
    borderRadius: 8,
    marginBottom: 16,
  },
  text: {
    color: "#fffbe8",
    fontSize: 14,
  },
});

export default ErrorMessage;
