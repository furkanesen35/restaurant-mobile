import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  Card,
  Avatar,
  List,
  Button,
  Switch,
  useTheme,
  Divider,
} from "react-native-paper";

const ProfileScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);



  const handleLogout = () => {
    console.log('=== LOGOUT BUTTON CLICKED - SHOWING ALERT ===');
    if (typeof window !== 'undefined' && window.confirm) {
      // Web: use window.confirm
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (confirmed) {
        (async () => {
          console.log('=== LOGOUT CONFIRMED BY USER (WEB) ===');
          try {
            await logout();
            console.log('Logout function completed, resetting navigation');
            setTimeout(() => {
              navigation.reset({ index: 0, routes: [{ name: "Login" }] });
              console.log('Navigation reset completed');
            }, 100);
          } catch (error) {
            console.error('Error during logout:', error);
          }
        })();
      } else {
        console.log('Logout cancelled by user (WEB)');
      }
    } else {
      // Native: use Alert.alert
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { 
          text: "Cancel", 
          style: "cancel",
          onPress: () => console.log('Logout cancelled by user (NATIVE)')
        },
        {
          text: "Logout",
          onPress: async () => {
            console.log('=== LOGOUT CONFIRMED BY USER (NATIVE) ===');
            try {
              await logout();
              console.log('Logout function completed, resetting navigation');
              setTimeout(() => {
                navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                console.log('Navigation reset completed');
              }, 100);
            } catch (error) {
              console.error('Error during logout:', error);
            }
          },
        },
      ]);
    }
  };

  // Direct logout without confirmation for testing
  const handleDirectLogout = async () => {
    console.log('=== DIRECT LOGOUT (NO CONFIRMATION) ===');
    try {
      await logout();
      console.log('Logout function completed, resetting navigation');
      setTimeout(() => {
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        console.log('Navigation reset completed');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const menuOptions = [
    {
      title: "Edit Profile",
      description: "Update your personal information",
      icon: "account-edit",
      onPress: () =>
        Alert.alert("Coming Soon", "Profile editing feature coming soon!"),
    },
    {
      title: "Payment Methods",
      description: "Manage your payment options",
      icon: "credit-card",
      onPress: () =>
        Alert.alert("Coming Soon", "Payment methods feature coming soon!"),
    },
    {
      title: "Delivery Addresses",
      description: "Manage your saved addresses",
      icon: "map-marker",
      onPress: () =>
        Alert.alert("Coming Soon", "Address management feature coming soon!"),
    },
    {
      title: "Order History",
      description: "View all your past orders",
      icon: "history",
      onPress: () =>
        Alert.alert(
          "Navigate to Orders",
          "Switch to Orders tab to view history!"
        ),
    },
    {
      title: "Loyalty Program",
      description: "Check your rewards and points",
      icon: "star",
      onPress: () =>
        Alert.alert("Coming Soon", "Loyalty program feature coming soon!"),
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Profile Header */}
      <Card style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <Avatar.Text
            size={80}
            label={
              user?.name
                ? user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                : user?.email
                ? user.email[0].toUpperCase()
                : "?"
            }
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || "No Name"}</Text>
            <Text style={styles.userEmail}>{user?.email || "No Email"}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Account Options */}
      <Card style={styles.optionsCard}>
        <Card.Title title="Account" titleStyle={styles.sectionTitle} />
        <Card.Content>
          {menuOptions.map((option, index) => (
            <View key={option.title}>
              <List.Item
                title={option.title}
                description={option.description}
                left={(props) => (
                  <List.Icon {...props} icon={option.icon} color="#e0b97f" />
                )}
                right={(props) => (
                  <List.Icon {...props} icon="chevron-right" color="#e0b97f" />
                )}
                onPress={option.onPress}
                titleStyle={styles.optionTitle}
                descriptionStyle={styles.optionDescription}
              />
              {index < menuOptions.length - 1 && (
                <Divider style={styles.divider} />
              )}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Settings */}
      <Card style={styles.optionsCard}>
        <Card.Title title="Preferences" titleStyle={styles.sectionTitle} />
        <Card.Content>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified about order updates
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              color="#e0b97f"
            />
          </View>

          <Divider style={styles.divider} />

          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingTitle}>Email Updates</Text>
              <Text style={styles.settingDescription}>
                Receive promotions and news
              </Text>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              color="#e0b97f"
            />
          </View>
        </Card.Content>
      </Card>

      {/* Support */}
      <Card style={styles.optionsCard}>
        <Card.Title title="Support" titleStyle={styles.sectionTitle} />
        <Card.Content>
          <List.Item
            title="Help Center"
            description="Get answers to common questions"
            left={(props) => (
              <List.Icon {...props} icon="help-circle" color="#e0b97f" />
            )}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color="#e0b97f" />
            )}
            onPress={() =>
              Alert.alert("Coming Soon", "Help center feature coming soon!")
            }
            titleStyle={styles.optionTitle}
            descriptionStyle={styles.optionDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Contact Us"
            description="Reach out to our support team"
            left={(props) => (
              <List.Icon {...props} icon="phone" color="#e0b97f" />
            )}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color="#e0b97f" />
            )}
            onPress={() =>
              Alert.alert("Contact", "Call us at: +1 (555) BAR-GRILL")
            }
            titleStyle={styles.optionTitle}
            descriptionStyle={styles.optionDescription}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Rate Our App"
            description="Share your feedback with us"
            left={(props) => (
              <List.Icon {...props} icon="star-outline" color="#e0b97f" />
            )}
            right={(props) => (
              <List.Icon {...props} icon="chevron-right" color="#e0b97f" />
            )}
            onPress={() =>
              Alert.alert("Thank You!", "Thanks for using our app!")
            }
            titleStyle={styles.optionTitle}
            descriptionStyle={styles.optionDescription}
          />
        </Card.Content>
      </Card>

      {/* Logout Button */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonText}
      >
        Logout
      </Button>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 16,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#e0b97f",
    marginRight: 16,
  },
  avatarLabel: {
    color: "#231a13",
    fontSize: 24,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fffbe8",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#e0b97f",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#e0b97f",
  },
  optionsCard: {
    marginBottom: 16,
    backgroundColor: "#2d2117",
    borderRadius: 16,
  },
  sectionTitle: {
    color: "#fffbe8",
    fontSize: 18,
    fontWeight: "bold",
  },
  optionTitle: {
    color: "#fffbe8",
    fontSize: 16,
  },
  optionDescription: {
    color: "#e0b97f",
    fontSize: 12,
  },
  divider: {
    backgroundColor: "#231a13",
    marginVertical: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingTitle: {
    color: "#fffbe8",
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    color: "#e0b97f",
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 16,
    marginBottom: 24,
    borderColor: "#e0b97f",
  },
  logoutButtonText: {
    color: "#e0b97f",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 32,
  },
  footerText: {
    color: "#e0b97f",
    fontSize: 12,
  },
});

export default ProfileScreen;
