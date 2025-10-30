import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCookieConsent, CookieConsent } from "../contexts/CookieConsentContext";

const CookieConsentBanner = () => {
  const { showBanner, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  if (!showBanner && !showSettings) return null;

  const handleSavePreferences = async () => {
    await savePreferences(preferences);
    setShowSettings(false);
  };

  const togglePreference = (key: keyof CookieConsent) => {
    if (key === "necessary") return; // Cannot disable necessary cookies
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <>
      {/* Main Banner */}
      {showBanner && !showSettings && (
        <View style={styles.bannerContainer}>
          <View style={styles.banner}>
            <Text style={styles.title}>🍪 Cookies & Privacy</Text>
            <Text style={styles.description}>
              We use cookies and similar technologies to enhance your experience,
              personalize content, and analyze our traffic. By clicking "Accept All"
              you consent to the use of ALL cookies. You can adjust your
              settings at any time.
            </Text>
            <Text style={styles.privacyLink}>
              For more information, please see our Privacy Policy.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={rejectAll}
              >
                <Text style={styles.rejectButtonText}>Reject All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.settingsButton]}
                onPress={() => setShowSettings(true)}
              >
                <Text style={styles.settingsButtonText}>Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={acceptAll}
              >
                <Text style={styles.acceptButtonText}>Accept All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSettings(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
          <ScrollView style={styles.settingsContent}>
            <Text style={styles.modalTitle}>Cookie Settings</Text>
            <Text style={styles.modalDescription}>
              We use cookies to provide you with the best possible experience on our
              website. You can choose which categories of cookies you want to allow.
            </Text>

            {/* Necessary Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Necessary Cookies</Text>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                These cookies are essential for the website to function and cannot be
                disabled. They are usually only set in response to actions you take,
                such as setting your privacy preferences, logging in, or filling out
                forms.
              </Text>
            </View>

            {/* Analytics Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Analytics Cookies</Text>
                <Switch
                  value={preferences.analytics}
                  onValueChange={() => togglePreference("analytics")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                These cookies allow us to count visits and traffic sources so we can
                measure and improve the performance of our website. They help us
                understand which pages are most popular and how visitors move around
                the site.
              </Text>
            </View>

            {/* Marketing Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Marketing Cookies</Text>
                <Switch
                  value={preferences.marketing}
                  onValueChange={() => togglePreference("marketing")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                These cookies may be set by our advertising partners through our website.
                They may be used to build a profile of your interests and show you
                relevant ads on other websites.
              </Text>
            </View>

            {/* Preference Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Preference Cookies</Text>
                <Switch
                  value={preferences.preferences}
                  onValueChange={() => togglePreference("preferences")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                These cookies enable the website to remember your choices (such as
                your username, language, or region) and provide enhanced, more
                personalized features.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleSavePreferences}
            >
              <Text style={styles.modalSaveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    backgroundColor: "#2d2117",
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#e0b97f",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#fffbe8",
    lineHeight: 20,
    marginBottom: 8,
  },
  privacyLink: {
    fontSize: 12,
    color: "#e0b97f",
    marginBottom: 16,
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#e0b97f",
  },
  acceptButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
  rejectButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fffbe8",
  },
  rejectButtonText: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  settingsButtonText: {
    color: "#e0b97f",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  settingsContent: {
    flex: 1,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e0b97f",
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: "#fffbe8",
    lineHeight: 20,
    marginBottom: 24,
  },
  cookieCategory: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#2d2117",
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e0b97f",
    flex: 1,
  },
  categoryDescription: {
    fontSize: 13,
    color: "#fffbe8",
    lineHeight: 18,
    opacity: 0.9,
  },
  modalButtons: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#3d3127",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fffbe8",
  },
  modalCancelButtonText: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButton: {
    backgroundColor: "#e0b97f",
  },
  modalSaveButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CookieConsentBanner;
