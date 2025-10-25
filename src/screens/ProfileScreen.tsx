import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Card, Button, Avatar, Divider, IconButton } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import AddressesScreen from "./AddressesScreen";
import PaymentMethodsScreen from "./PaymentMethodsScreen";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [showAddresses, setShowAddresses] = useState(false);
  const [showPayments, setShowPayments] = useState(false);

  if (!user) {
    return (
      <View style={styles.loginPromptContainer}>
        <Card style={styles.loginPromptCard}>
          <Card.Content style={styles.loginPromptContent}>
            <Avatar.Icon
              size={80}
              icon="account-circle"
              style={styles.loginPromptIcon}
            />
            <Text style={styles.loginPromptTitle}>Welcome to Your Profile</Text>
            <Text style={styles.loginPromptSubtitle}>
              Please log in to access your profile, manage addresses, and
              payment methods.
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <Card style={styles.headerCard}>
        <Card.Content style={styles.headerContent}>
          <Avatar.Text
            size={80}
            label={user.name.charAt(0).toUpperCase()}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            {user.role === "admin" && (
              <Card style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>Admin</Text>
              </Card>
            )}
          </View>
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Card style={styles.loyaltyCard}>
        <Card.Title
          title="Loyalty Points"
          titleStyle={styles.sectionTitle}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon="star-circle"
              style={styles.sectionIcon}
            />
          )}
        />
        <Card.Content style={styles.loyaltyContent}>
          <Text style={styles.loyaltyPoints}>{user.loyaltyPoints ?? 0}</Text>
          <Text style={styles.loyaltyCaption}>
            Earn 1 point for every €1 spent. Points accumulate automatically
            after each successful payment.
          </Text>
        </Card.Content>
      </Card>

      {/* Addresses Section */}
      <TouchableOpacity onPress={() => setShowAddresses(true)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title="My Addresses"
            titleStyle={styles.sectionTitle}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="map-marker"
                style={styles.sectionIcon}
              />
            )}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" iconColor="#ffffff" />
            )}
          />
          <Card.Content>
            <Text style={styles.sectionPlaceholder}>
              Tap to manage your delivery addresses
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Payment Methods Section */}
      <TouchableOpacity onPress={() => setShowPayments(true)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title="Payment Methods"
            titleStyle={styles.sectionTitle}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="credit-card"
                style={styles.sectionIcon}
              />
            )}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" iconColor="#ffffff" />
            )}
          />
          <Card.Content>
            <Text style={styles.sectionPlaceholder}>
              Tap to manage your payment methods
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={logout}
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonLabel}
        contentStyle={styles.logoutButtonContent}
        icon="logout"
      >
        Logout
      </Button>

      {/* Addresses Modal */}
      <Modal
        visible={showAddresses}
        animationType="slide"
        onRequestClose={() => setShowAddresses(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>My Addresses</Text>
            <IconButton
              icon="close"
              onPress={() => setShowAddresses(false)}
              iconColor="#ffffff"
            />
          </View>
          <AddressesScreen />
        </View>
      </Modal>

      {/* Payment Methods Modal */}
      <Modal
        visible={showPayments}
        animationType="slide"
        onRequestClose={() => setShowPayments(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Methods</Text>
            <IconButton
              icon="close"
              onPress={() => setShowPayments(false)}
              iconColor="#ffffff"
            />
          </View>
          <PaymentMethodsScreen />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Login Prompt Styles
  loginPromptContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#231a13",
    padding: 20,
  },
  loginPromptCard: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#2d2117",
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginPromptContent: {
    alignItems: "center",
    padding: 24,
  },
  loginPromptIcon: {
    backgroundColor: "#e0b97f",
    marginBottom: 16,
  },
  loginPromptTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  loginPromptSubtitle: {
    color: "#f5f5f5",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },

  // Main Profile Styles
  container: {
    flex: 1,
    backgroundColor: "#231a13",
    padding: 16,
  },

  // Header Section
  headerCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  avatar: {
    backgroundColor: "#e0b97f",
    marginRight: 16,
  },
  avatarLabel: {
    color: "#231a13",
    fontSize: 28,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  userEmail: {
    color: "#f5f5f5",
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.9,
  },
  adminBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0b97f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  adminBadgeText: {
    color: "#231a13",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },

  // Divider
  divider: {
    backgroundColor: "#e0b97f",
    height: 2,
    marginVertical: 16,
  },

  loyaltyCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3d3127",
  },
  loyaltyContent: {
    alignItems: "center",
    paddingBottom: 20,
  },
  loyaltyPoints: {
    color: "#e0b97f",
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
  },
  loyaltyCaption: {
    color: "#f5f5f5",
    fontSize: 14,
    textAlign: "center",
    opacity: 0.85,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "#2d2117",
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3d3127",
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sectionIcon: {
    backgroundColor: "#e0b97f",
  },
  sectionPlaceholder: {
    color: "#f5f5f5",
    fontSize: 14,
    fontStyle: "italic",
    opacity: 0.8,
    textAlign: "center",
    paddingVertical: 12,
  },

  // Logout Button
  logoutButton: {
    backgroundColor: "#d32f2f",
    borderRadius: 12,
    marginTop: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
  logoutButtonLabel: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2d2117",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
