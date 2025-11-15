import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import CookieSettingsScreen from "../screens/CookieSettingsScreen";
import QRScannerScreen from "../screens/QRScannerScreen";
import { useAuth } from "../contexts/AuthContext";
import MenuScreen from "../screens/MenuScreen";
import ReservationsScreen from "../screens/ReservationsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CartScreen from "../screens/CartScreen";
import AdminScreen from "../screens/AdminScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import Icon from "react-native-paper/src/components/Icon";
import { useTranslation } from "../hooks/useTranslation";
import logger from '../utils/logger';
import { useCart } from "../contexts/CartContext";
import { View, Text, StyleSheet } from "react-native";
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { cart } = useCart();

  const getTabIcon = (routeName: string, focused: boolean, color: string, size: number) => {
    let iconName = "home";
    
    switch (routeName) {
      case "Menu":
        iconName = "silverware-fork-knife";
        break;
      case "Favorites":
        iconName = "heart";
        break;
      case "Cart":
        iconName = "cart";
        break;
      case "Reservations":
        iconName = "calendar-clock";
        break;
      case "Orders":
        iconName = "receipt";
        break;
      case "Profile":
        iconName = "account";
        break;
      case "Admin":
        iconName = "shield-crown";
        break;
    }

    // Add badge for cart
    if (routeName === "Cart" && cart.length > 0) {
      return (
        <View>
          <Icon source={iconName} size={size} color={color} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cart.length}</Text>
          </View>
        </View>
      );
    }

    return <Icon source={iconName} size={size} color={color} />;
  };

  const screens = React.useMemo(() => {
    const baseScreens = [
      { name: "Menu", component: MenuScreen, label: t("navigation.menu") },
      { name: "Favorites", component: FavoritesScreen, label: t("navigation.favorites") },
      { name: "Cart", component: CartScreen, label: t("navigation.cart") },
      { name: "Reservations", component: ReservationsScreen, label: t("navigation.reservations") },
      { name: "Orders", component: OrdersScreen, label: t("navigation.orders") },
      { name: "Profile", component: ProfileScreen, label: t("navigation.profile") },
    ];

    if (user && user.role === "admin") {
      baseScreens.push({ name: "Admin", component: AdminScreen, label: t("navigation.admin") });
    }

    return baseScreens;
  }, [user, t]);

  return (
    <Tab.Navigator 
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => 
          getTabIcon(route.name, focused, color, size),
        tabBarActiveTintColor: "#f5e6c8",
        tabBarInactiveTintColor: "#b8a68a",
        tabBarStyle: {
          backgroundColor: "#1a120b",
          borderTopColor: "#2d2117",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      })}
    >
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={{
            tabBarLabel: screen.label,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

function MainStack() {
  const { t } = useTranslation();
  
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: t("navigation.checkout"),
          headerStyle: { backgroundColor: "#231a13" },
          headerTintColor: "#d4af37",
        }}
      />
      <Stack.Screen
        name="CookieSettings"
        component={CookieSettingsScreen}
        options={{
          title: t("navigation.cookieSettings"),
          headerStyle: { backgroundColor: "#231a13" },
          headerTintColor: "#e0b97f",
        }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{
          title: t("navigation.scanQRCode"),
          headerStyle: { backgroundColor: "#231a13" },
          headerTintColor: "#e0b97f",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

const RootNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) return null; // Optionally show splash/loading

  // Use different keys to force complete remount on auth state change
  const navigationKey = token ? "authenticated" : "unauthenticated";

  return (
    <Stack.Navigator key={navigationKey} screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={MainStack} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#d4af37',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#1a120b',
    fontSize: 11,
    fontWeight: 'bold',
  },
});

export default RootNavigator;


