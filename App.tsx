import * as React from "react";
import { PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { cozyTheme } from "./src/theme/cozyTheme";
import { AuthProvider } from "./src/contexts/AuthContext";
import { StripeProvider } from "@stripe/stripe-react-native";
import ENV from "./src/config/env";

import RootNavigator from "./src/navigation/RootNavigator";
import { CartProvider } from "./src/contexts/CartContext";

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
  );
}
