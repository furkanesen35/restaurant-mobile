import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const cozyTheme = {
  ...DefaultTheme,
  roundness: 8,
  colors: {
    ...DefaultTheme.colors,
    primary: '#8B2F1C', // Deep red
    secondary: '#FFD700', // Gold
    background: '#FFF8F0', // Cream
    surface: '#F5E1C6', // Light brown
    onBackground: '#3E2723', // Dark brown
    onSurface: '#3E2723', // Dark brown
    outline: '#BCAAA4',
    error: '#D84315', // Alert red
  },
};
