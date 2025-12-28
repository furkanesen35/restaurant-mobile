import "dotenv/config";

export default ({ config: _config }) => {
  const isProduction = process.env.APP_VARIANT === 'production';
  
  return {
    expo: {
      plugins: [
          "expo-web-browser",
          "expo-font",
          "expo-localization",
          [
            "expo-build-properties",
            {
              android: {
                usesCleartextTraffic: !isProduction,
              },
            },
          ],
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
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.burgermeister.restaurantmobile",
      buildNumber: "1.0.0",
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
      },
      infoPlist: {
        NSAppTransportSecurity: isProduction ? undefined : {
          NSAllowsArbitraryLoads: true,
        },
        NSLocationWhenInUseUsageDescription: "This app needs access to your location to show delivery tracking.",
        NSLocationAlwaysUsageDescription: "This app needs access to your location to show delivery tracking."
      },
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
        "VIBRATE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
        }
      },
      usesCleartextTraffic: !isProduction,
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
}
