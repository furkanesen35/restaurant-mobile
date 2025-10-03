
import * as React from 'react';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MenuScreen from './src/screens/MenuScreen';
import ReservationsScreen from './src/screens/ReservationsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { cozyTheme } from './src/theme/cozyTheme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <PaperProvider theme={cozyTheme}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tab.Screen name="Menu" component={MenuScreen} />
          <Tab.Screen name="Reservations" component={ReservationsScreen} />
          <Tab.Screen name="Orders" component={OrdersScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}
