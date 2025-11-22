import "dotenv/config";

export default {
  expo: {
    plugins: ["expo-web-browser", "expo-font"],
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
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.burgermeister.restaurantmobile",
      buildNumber: "1.0.0",
    },
    android: {
      package: "com.burgermeister_schmidt.restaurantmobile",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "CAMERA",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "VIBRATE"
      ],
      usesCleartextTraffic: true,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      googleClientId: process.env.GOOGLE_CLIENT_ID,
      eas: {
        projectId: "34d8bfb4-2a86-49ed-a4d6-b29eee48d18d"
      }
    },
  },
};
