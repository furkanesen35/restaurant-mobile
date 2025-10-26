import * as React from "react";
import { Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";

const HomeScreen = () => {
  const { colors } = useTheme();
  return (
    // SafeAreaView ensures content doesn't overlap with status bar, notch, or home indicator
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <Text style={[styles.title, { color: colors.primary }]}>
        Welcome to Cozy Bar & Grill!
      </Text>
      <Text style={{ color: colors.onBackground }}>
        Enjoy our menu, reserve a table, and order online.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // MAIN CONTAINER - The entire Home screen wrapper
  // Used by: Root SafeAreaView on HomeScreen
  // ============================================================================
  container: {
    flex: 1, // Takes up all available screen space vertically
    alignItems: "center", // Centers all child elements horizontally
    justifyContent: "center", // Centers all child elements vertically
    padding: 24, // Adds 24px space inside container on all sides (prevents edge touch)
    // backgroundColor is set dynamically from theme colors.background
  },

  // ============================================================================
  // WELCOME TITLE - "Welcome to Cozy Bar & Grill!" heading
  // Used by: Main Text component on HomeScreen
  // ============================================================================
  title: {
    fontSize: 28, // Large text size for main welcome heading
    fontWeight: "bold", // Makes text thick/heavy for emphasis and visibility
    marginBottom: 16, // Adds 16px space below title before subtitle text
    // color is set dynamically from theme colors.primary
  },
});

export default HomeScreen;
