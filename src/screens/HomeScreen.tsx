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
  container: {
    // flex: 1 - Takes up all available screen space vertically
    flex: 1,
    // alignItems: "center" - Centers content horizontally
    alignItems: "center",
    // justifyContent: "center" - Centers content vertically
    justifyContent: "center",
    // padding: 24 - Adds 24dp space inside container on all sides
    padding: 24,
  },
  title: {
    // fontSize: 28 - Large text size for main heading
    fontSize: 28,
    // fontWeight: "bold" - Makes text thick/heavy for emphasis
    fontWeight: "bold",
    // marginBottom: 16 - Adds 16dp space below title
    marginBottom: 16,
  },
});

export default HomeScreen;
