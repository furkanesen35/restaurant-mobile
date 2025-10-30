import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, Button, Avatar, Divider, IconButton } from "react-native-paper";
import { useAuth } from "../contexts/AuthContext";
import AddressesScreen from "./AddressesScreen";
import PaymentMethodsScreen from "./PaymentMethodsScreen";
import { useNavigation } from "@react-navigation/native";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useTranslation } from "../hooks/useTranslation";

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation();
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
            <Text style={styles.loginPromptTitle}>{t("profile.myProfile")}</Text>
            <Text style={styles.loginPromptSubtitle}>
              {t("auth.login")}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          title={t("profile.loyaltyPoints")}
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
            {t("loyalty.earnWithPurchase", { points: 1 })}
          </Text>
        </Card.Content>
      </Card>

      {/* Addresses Section */}
      <TouchableOpacity onPress={() => setShowAddresses(true)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title={t("profile.addresses")}
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
              {t("profile.addresses")}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Payment Methods Section */}
      <TouchableOpacity onPress={() => setShowPayments(true)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title={t("profile.paymentMethods")}
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
              {t("profile.paymentMethods")}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* QR Scanner Section */}
      <TouchableOpacity onPress={() => navigation.navigate("QRScanner" as never)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title={t("profile.scanQR")}
            titleStyle={styles.sectionTitle}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="qrcode-scan"
                style={styles.sectionIcon}
              />
            )}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" iconColor="#ffffff" />
            )}
          />
          <Card.Content>
            <Text style={styles.sectionDescription}>
              {t("loyalty.scanToEarn")}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Cookie Settings Section */}
      <TouchableOpacity onPress={() => navigation.navigate("CookieSettings" as never)}>
        <Card style={styles.sectionCard}>
          <Card.Title
            title={t("profile.cookieSettings")}
            titleStyle={styles.sectionTitle}
            left={(props) => (
              <Avatar.Icon
                {...props}
                icon="cookie"
                style={styles.sectionIcon}
              />
            )}
            right={(props) => (
              <IconButton {...props} icon="chevron-right" iconColor="#ffffff" />
            )}
          />
          <Card.Content>
            <Text style={styles.sectionPlaceholder}>
              {t("profile.cookieSettings")}
            </Text>
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {/* Language Settings Section */}
      <View style={styles.languageSwitcherContainer}>
        <LanguageSwitcher iconColor="#e0b97f" iconSize={24} />
      </View>

      {/* Logout Button */}
      <Button
        mode="contained"
        onPress={logout}
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonLabel}
        contentStyle={styles.logoutButtonContent}
        icon="logout"
      >
        {t("auth.logout")}
      </Button>
      </ScrollView>

      {/* Addresses Modal */}
      <Modal
        visible={showAddresses}
        animationType="slide"
        onRequestClose={() => setShowAddresses(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t("profile.addresses")}</Text>
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
            <Text style={styles.modalTitle}>{t("profile.paymentMethods")}</Text>
            <IconButton
              icon="close"
              onPress={() => setShowPayments(false)}
              iconColor="#ffffff"
            />
          </View>
          <PaymentMethodsScreen />
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // LOGIN PROMPT CONTAINER - Shown when user is not logged in
  // Used by: Root View when user needs to login to see profile
  // ============================================================================
  loginPromptContainer: {
    flex: 1, // Takes full screen height
    justifyContent: "center", // Centers card vertically
    alignItems: "center", // Centers card horizontally
    backgroundColor: "#231a13", // Dark brown background
    padding: 20, // 20px padding on all sides
  },

  // ============================================================================
  // LOGIN PROMPT CARD - Card containing login message
  // Used by: Card component in login prompt view
  // ============================================================================
  loginPromptCard: {
    width: "100%", // Full width of container
    maxWidth: 350, // But never wider than 350px (looks better on tablets)
    backgroundColor: "#2d2117", // Lighter brown card surface
    borderRadius: 20, // Large rounded corners for friendly appearance
    elevation: 8, // Android shadow depth (8 units)
    shadowColor: "#000", // iOS shadow color (black)
    shadowOffset: { width: 0, height: 4 }, // iOS shadow 4px down
    shadowOpacity: 0.3, // iOS shadow 30% opacity
    shadowRadius: 8, // iOS shadow 8px blur
  },

  // ============================================================================
  // LOGIN PROMPT CONTENT - Inner content of prompt card
  // Used by: View inside prompt card
  // ============================================================================
  loginPromptContent: {
    alignItems: "center", // Centers content horizontally
    padding: 24, // 24px padding on all sides
  },

  // ============================================================================
  // LOGIN PROMPT ICON - Icon at top of login prompt
  // Used by: Avatar or icon component in prompt
  // ============================================================================
  loginPromptIcon: {
    backgroundColor: "#e0b97f", // Gold background for icon
    marginBottom: 16, // 16px space below icon
  },

  // ============================================================================
  // LOGIN PROMPT TITLE - "Sign in to view profile" heading
  // Used by: Text component showing main prompt message
  // ============================================================================
  loginPromptTitle: {
    color: "#ffffff", // White text for high contrast
    fontSize: 24, // Large heading size
    fontWeight: "bold", // Bold for emphasis
    marginBottom: 12, // 12px space below title
    textAlign: "center", // Centers text horizontally
  },

  // ============================================================================
  // LOGIN PROMPT SUBTITLE - Descriptive text below title
  // Used by: Text component showing additional prompt info
  // ============================================================================
  loginPromptSubtitle: {
    color: "#f5f5f5", // Off-white text
    fontSize: 16, // Medium text size
    textAlign: "center", // Centers text horizontally
    lineHeight: 22, // Line height for better readability with wrapping
    opacity: 0.9, // Slightly transparent (90% visible)
  },

  // ============================================================================
  // MAIN CONTAINER - The entire Profile screen wrapper when logged in
  // Used by: Root View component when user is authenticated
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    backgroundColor: "#231a13", // Dark brown background
  },

  // ============================================================================
  // SCROLL CONTENT - ScrollView content container
  // Used by: ScrollView contentContainerStyle
  // ============================================================================
  scrollContent: {
    padding: 16, // 16px padding on all sides
    paddingBottom: 32, // Extra bottom padding for comfortable scrolling
  },

  // ============================================================================
  // HEADER CARD - Card showing user avatar, name, and email
  // Used by: Card component at top of profile
  // ============================================================================
  headerCard: {
    backgroundColor: "#2d2117", // Lighter brown card background
    borderRadius: 16, // Rounded corners
    elevation: 4, // Android shadow depth
    shadowColor: "#000", // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow 2px down
    shadowOpacity: 0.25, // iOS shadow 25% opacity
    shadowRadius: 6, // iOS shadow 6px blur
    marginBottom: 20, // 20px space below header card
  },

  // ============================================================================
  // HEADER CONTENT - Inner content of header card (avatar + user info)
  // Used by: View inside header card arranging avatar and text
  // ============================================================================
  headerContent: {
    flexDirection: "row", // Arranges avatar and user info horizontally
    alignItems: "center", // Vertically aligns avatar with text
    padding: 20, // 20px padding on all sides
  },

  // ============================================================================
  // AVATAR - Circular user avatar with initials
  // Used by: Avatar component showing user's first letter
  // ============================================================================
  avatar: {
    backgroundColor: "#e0b97f", // Gold circle background
    marginRight: 16, // 16px space between avatar and user info
  },

  // ============================================================================
  // AVATAR LABEL - Text inside avatar (user initials)
  // Used by: Text showing user's first letter
  // ============================================================================
  avatarLabel: {
    color: "#231a13", // Dark text on gold background for contrast
    fontSize: 28, // Large text for visibility
    fontWeight: "bold", // Bold text
  },

  // ============================================================================
  // USER INFO - Container for username and email
  // Used by: View wrapping name and email text
  // ============================================================================
  userInfo: {
    flex: 1, // Takes remaining horizontal space
  },

  // ============================================================================
  // USER NAME - User's display name
  // Used by: Text component showing user's full name
  // ============================================================================
  userName: {
    color: "#ffffff", // White text for high visibility
    fontSize: 22, // Large text for name prominence
    fontWeight: "bold", // Bold for emphasis
    marginBottom: 4, // 4px space below name
  },

  // ============================================================================
  // USER EMAIL - User's email address
  // Used by: Text component showing user's email
  // ============================================================================
  userEmail: {
    color: "#f5f5f5", // Off-white text
    fontSize: 16, // Medium text size
    marginBottom: 8, // 8px space below email
    opacity: 0.9, // Slightly transparent (90% visible)
  },

  // ============================================================================
  // ADMIN BADGE - Badge showing "ADMIN" for admin users
  // Used by: View/Badge component for admin indicator
  // ============================================================================
  adminBadge: {
    alignSelf: "flex-start", // Aligns to left edge (doesn't stretch)
    backgroundColor: "#e0b97f", // Gold background
    paddingHorizontal: 12, // 12px left/right padding
    paddingVertical: 4, // 4px top/bottom padding
    borderRadius: 12, // Rounded pill shape
  },

  // ============================================================================
  // ADMIN BADGE TEXT - "ADMIN" text inside badge
  // Used by: Text inside admin badge
  // ============================================================================
  adminBadgeText: {
    color: "#231a13", // Dark text on gold background
    fontSize: 12, // Small text
    fontWeight: "bold", // Bold for emphasis
    textTransform: "uppercase", // Forces uppercase letters
  },

  // ============================================================================
  // DIVIDER - Horizontal line separating sections
  // Used by: Divider component between profile sections
  // ============================================================================
  divider: {
    backgroundColor: "#e0b97f", // Gold line color
    height: 2, // 2px thick line
    marginVertical: 16, // 16px space above and below
  },

  // ============================================================================
  // LOYALTY CARD - Card showing loyalty points
  // Used by: Card component displaying user's loyalty points
  // ============================================================================
  loyaltyCard: {
    backgroundColor: "#2d2117", // Lighter brown card background
    borderRadius: 16, // Rounded corners
    marginBottom: 20, // 20px space below card
    borderWidth: 1, // 1px border
    borderColor: "#3d3127", // Subtle darker brown border
  },

  // ============================================================================
  // LOYALTY CONTENT - Inner content of loyalty card
  // Used by: View inside loyalty card
  // ============================================================================
  loyaltyContent: {
    alignItems: "center", // Centers points horizontally
    paddingBottom: 20, // 20px padding at bottom
  },

  // ============================================================================
  // LOYALTY POINTS - Large number showing points balance
  // Used by: Text component showing loyalty points number (e.g., "250")
  // ============================================================================
  loyaltyPoints: {
    color: "#e0b97f", // Gold text to highlight points
    fontSize: 36, // Very large text for emphasis
    fontWeight: "bold", // Bold for prominence
    marginBottom: 8, // 8px space below number
  },

  // ============================================================================
  // LOYALTY CAPTION - "Loyalty Points" label text
  // Used by: Text component below points number
  // ============================================================================
  loyaltyCaption: {
    color: "#f5f5f5", // Off-white text
    fontSize: 14, // Small text size
    textAlign: "center", // Centers text horizontally
    opacity: 0.85, // Slightly transparent (85% visible)
  },

  // ============================================================================
  // SECTION CARD - Generic card for profile sections (addresses, payments, etc.)
  // Used by: Card components for various profile sections
  // ============================================================================
  sectionCard: {
    backgroundColor: "#2d2117", // Lighter brown card background
    borderRadius: 16, // Rounded corners
    elevation: 3, // Android shadow depth (3 units)
    shadowColor: "#000", // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow 2px down
    shadowOpacity: 0.2, // iOS shadow 20% opacity
    shadowRadius: 4, // iOS shadow 4px blur
    marginBottom: 20, // 20px space between section cards
    borderWidth: 1, // 1px border
    borderColor: "#3d3127", // Subtle darker brown border
  },

  // ============================================================================
  // SECTION TITLE - Title of each section card
  // Used by: Text component showing section heading (e.g., "My Addresses")
  // ============================================================================
  sectionTitle: {
    color: "#ffffff", // White text for high visibility
    fontSize: 18, // Large text for section headings
    fontWeight: "bold", // Bold for emphasis
  },

  // ============================================================================
  // SECTION DESCRIPTION - Description text in section cards
  // Used by: Text component showing section description
  // ============================================================================
  sectionDescription: {
    color: "#f5f5f5", // Off-white text
    fontSize: 14, // Standard text size
    opacity: 0.9, // Slightly transparent
  },

  // ============================================================================
  // SECTION ICON - Icon next to section title
  // Used by: Icon component in section headers
  // ============================================================================
  sectionIcon: {
    backgroundColor: "#e0b97f", // Gold icon background
  },

  // ============================================================================
  // SECTION PLACEHOLDER - Text shown when section is empty
  // Used by: Text shown when user has no addresses, payments, etc.
  // ============================================================================
  sectionPlaceholder: {
    color: "#f5f5f5", // Off-white text
    fontSize: 14, // Small text size
    fontStyle: "italic", // Italic to show it's placeholder/empty state
    opacity: 0.8, // Slightly transparent (80% visible)
    textAlign: "center", // Centers text horizontally
    paddingVertical: 12, // 12px padding top/bottom
  },

  // ============================================================================
  // LANGUAGE SWITCHER CONTAINER - Container for language switcher component
  // Used by: View wrapping LanguageSwitcher component
  // ============================================================================
  languageSwitcherContainer: {
    marginBottom: 20, // 20px space below language switcher
  },

  // ============================================================================
  // LOGOUT BUTTON - Red button to sign out
  // Used by: Button component for logging out
  // ============================================================================
  logoutButton: {
    backgroundColor: "#d32f2f", // Red background (destructive action)
    borderRadius: 12, // Rounded corners
    marginTop: 20, // 20px space above button
    elevation: 4, // Android shadow depth
    shadowColor: "#000", // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow 2px down
    shadowOpacity: 0.25, // iOS shadow 25% opacity
    shadowRadius: 4, // iOS shadow 4px blur
  },

  // ============================================================================
  // LOGOUT BUTTON CONTENT - Inner styling of logout button
  // Used by: contentStyle prop of logout Button
  // ============================================================================
  logoutButtonContent: {
    paddingVertical: 8, // 8px padding top/bottom
  },

  // ============================================================================
  // LOGOUT BUTTON LABEL - Text inside logout button
  // Used by: labelStyle prop of logout Button
  // ============================================================================
  logoutButtonLabel: {
    color: "#ffffff", // White text on red background
    fontSize: 16, // Standard button text size
    fontWeight: "bold", // Bold for emphasis
  },

  // ============================================================================
  // MODAL CONTAINER - Full screen container for modals (addresses, payments)
  // Used by: Root View in modal screens
  // ============================================================================
  modalContainer: {
    flex: 1, // Takes full screen height
    backgroundColor: "#231a13", // Dark brown background matching main app
  },

  // ============================================================================
  // MODAL HEADER - Top bar of modal with title and close button
  // Used by: View at top of modal screens
  // ============================================================================
  modalHeader: {
    flexDirection: "row", // Arranges title and close button horizontally
    justifyContent: "space-between", // Pushes title and button to edges
    alignItems: "center", // Vertically aligns title and button
    backgroundColor: "#2d2117", // Lighter brown header background
    paddingHorizontal: 16, // 16px padding left/right
    paddingTop: 50, // 50px top padding (accounts for status bar)
    paddingBottom: 16, // 16px bottom padding
    elevation: 4, // Android shadow depth
    shadowColor: "#000", // iOS shadow color
    shadowOffset: { width: 0, height: 2 }, // iOS shadow 2px down
    shadowOpacity: 0.25, // iOS shadow 25% opacity
    shadowRadius: 4, // iOS shadow 4px blur
  },

  // ============================================================================
  // MODAL TITLE - Title text in modal header
  // Used by: Text component showing modal screen title
  // ============================================================================
  modalTitle: {
    color: "#ffffff", // White text for high visibility
    fontSize: 20, // Large text for modal heading
    fontWeight: "bold", // Bold for emphasis
  },
});

export default ProfileScreen;
