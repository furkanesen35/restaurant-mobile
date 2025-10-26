import * as React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { LogBox, UIManager, Platform, StatusBar } from "react-native";
import { cozyTheme } from "./src/theme/cozyTheme";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import ENV from "./src/config/env";

import RootNavigator from "./src/navigation/RootNavigator";
import { CartProvider } from "./src/contexts/CartContext";

// Suppress the setLayoutAnimationEnabledExperimental warning
LogBox.ignoreLogs([
  "setLayoutAnimationEnabledExperimental",
]);

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const linking = {
  prefixes: ["restaurantapp://", "exp://192.168.1.110:8081"],
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
          <AuthProvider>
            <CartProvider>
              <NavigationContainer linking={linking}>
                <RootNavigator />
              </NavigationContainer>
            </CartProvider>
          </AuthProvider>
        </PaperProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
