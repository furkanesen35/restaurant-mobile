import 'dotenv/config';

export default {
  expo: {
    plugins: [
      "expo-web-browser"
    ],
    name: "restaurant-mobile",
    slug: "restaurant-mobile",
    scheme: "restaurantapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      package: "com.burgermeister_schmidt.restaurantmobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID
    }
  }
};
