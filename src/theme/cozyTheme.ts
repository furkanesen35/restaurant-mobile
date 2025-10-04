import { MD3LightTheme as DefaultTheme } from "react-native-paper";

export const cozyTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: "#8B2F1C", // Deep red
    secondary: "#e0b97f", // Muted gold pastel
    background: "#231a13", // Very dark brown for main background
    surface: "#2d2117", // Dark brown for cards
    onBackground: "#e0b97f", // Muted gold pastel for text on background
    onSurface: "#e0b97f", // Muted gold pastel for text on cards
    outline: "#BCAAA4",
    error: "#D84315", // Alert red
  },
};
