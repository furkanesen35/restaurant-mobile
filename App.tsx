import * as React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { LogBox, UIManager, Platform, StatusBar } from "react-native";
import * as Notifications from "expo-notifications";
import { cozyTheme } from "./src/theme/cozyTheme";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import ENV from "./src/config/env";

import RootNavigator from "./src/navigation/RootNavigator";
import { CartProvider } from "./src/contexts/CartContext";
import { CookieConsentProvider } from "./src/contexts/CookieConsentContext";
import { LanguageProvider } from "./src/contexts/LanguageContext";
import CookieConsentBanner from "./src/components/CookieConsentBanner";
import "./src/i18n"; // Initialize i18n

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Suppress the setLayoutAnimationEnabledExperimental warning
LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental",
  "expo-notifications: Android Push notifications",
  "`expo-notifications` functionality is not fully supported in Expo Go",
]);

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const linking = {
  prefixes: ["burgermeister://", "restaurantapp://", "exp://192.168.1.110:8081"],
  config: {
    screens: {
      Login: "login",
      Register: "register",
      ForgotPassword: "forgot-password",
      ResetPassword: {
        path: "reset-password",
        parse: {
          token: (token: string) => token,
        },
      },
      VerifyEmail: {
        path: "verify-email",
        parse: {
          token: (token: string) => token,
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>
        <PaperProvider theme={cozyTheme}>
          <LanguageProvider>
            <CookieConsentProvider>
              <AuthProvider>
                <CartProvider>
                  <NavigationContainer linking={linking}>
                    <RootNavigator />
                    <CookieConsentBanner />
                  </NavigationContainer>
                </CartProvider>
              </AuthProvider>
            </CookieConsentProvider>
          </LanguageProvider>
        </PaperProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
