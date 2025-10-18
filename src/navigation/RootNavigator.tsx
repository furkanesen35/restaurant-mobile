import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import VerifyEmailScreen from "../screens/VerifyEmailScreen";
import { useAuth } from "../contexts/AuthContext";
import MenuScreen from "../screens/MenuScreen";
import ReservationsScreen from "../screens/ReservationsScreen";
import OrdersScreen from "../screens/OrdersScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import CartScreen from "../screens/CartScreen";
import AdminScreen from "../screens/AdminScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { user } = useAuth();

  const screens = React.useMemo(() => {
    const baseScreens = [
      { name: "Menu", component: MenuScreen },
      { name: "Cart", component: CartScreen },
      { name: "Reservations", component: ReservationsScreen },
      { name: "Orders", component: OrdersScreen },
      { name: "Profile", component: ProfileScreen },
    ];

    if (user && user.role === "admin") {
      baseScreens.push({ name: "Admin", component: AdminScreen });
    }

    return baseScreens;
  }, [user]);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      {screens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
        />
      ))}
    </Tab.Navigator>
  );
}

function MainStack() {
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
          title: "Checkout",
          headerStyle: { backgroundColor: "#231a13" },
          headerTintColor: "#d4af37",
        }}
      />
    </Stack.Navigator>
  );
}

const RootNavigator = () => {
  const { token, isLoading } = useAuth();

  console.log(
    "RootNavigator render - token:",
    !!token,
    "isLoading:",
    isLoading,
  );

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

export default RootNavigator;
