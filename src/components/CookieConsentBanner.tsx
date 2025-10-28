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
            <Text style={styles.title}>🍪 Cookies & Datenschutz</Text>
            <Text style={styles.description}>
              Wir verwenden Cookies und ähnliche Technologien, um Ihre Erfahrung zu
              verbessern, Inhalte zu personalisieren und unseren Datenverkehr zu
              analysieren. Durch Klicken auf "Alle akzeptieren" stimmen Sie der
              Verwendung ALLER Cookies zu. Sie können Ihre Einstellungen jederzeit
              anpassen.
            </Text>
            <Text style={styles.privacyLink}>
              Weitere Informationen finden Sie in unserer Datenschutzerklärung.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.rejectButton]}
                onPress={rejectAll}
              >
                <Text style={styles.rejectButtonText}>Alle ablehnen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.settingsButton]}
                onPress={() => setShowSettings(true)}
              >
                <Text style={styles.settingsButtonText}>Einstellungen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={acceptAll}
              >
                <Text style={styles.acceptButtonText}>Alle akzeptieren</Text>
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
            <Text style={styles.modalTitle}>Cookie-Einstellungen</Text>
            <Text style={styles.modalDescription}>
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung auf unserer
              Website zu bieten. Sie können wählen, welche Kategorien von Cookies Sie
              zulassen möchten.
            </Text>

            {/* Necessary Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Notwendige Cookies</Text>
                <Switch
                  value={true}
                  disabled={true}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                Diese Cookies sind für die Funktion der Website erforderlich und können
                nicht deaktiviert werden. Sie werden normalerweise nur als Reaktion auf
                von Ihnen vorgenommene Aktionen gesetzt, wie z.B. das Setzen Ihrer
                Datenschutzeinstellungen, das Anmelden oder das Ausfüllen von
                Formularen.
              </Text>
            </View>

            {/* Analytics Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Analyse-Cookies</Text>
                <Switch
                  value={preferences.analytics}
                  onValueChange={() => togglePreference("analytics")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                Diese Cookies ermöglichen es uns, Besuche und Verkehrsquellen zu zählen,
                damit wir die Leistung unserer Website messen und verbessern können. Sie
                helfen uns zu verstehen, welche Seiten am beliebtesten sind und wie
                Besucher sich auf der Website bewegen.
              </Text>
            </View>

            {/* Marketing Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Marketing-Cookies</Text>
                <Switch
                  value={preferences.marketing}
                  onValueChange={() => togglePreference("marketing")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                Diese Cookies können von unseren Werbepartnern über unsere Website
                gesetzt werden. Sie können verwendet werden, um ein Profil Ihrer
                Interessen zu erstellen und Ihnen relevante Anzeigen auf anderen
                Websites zu zeigen.
              </Text>
            </View>

            {/* Preference Cookies */}
            <View style={styles.cookieCategory}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>Präferenz-Cookies</Text>
                <Switch
                  value={preferences.preferences}
                  onValueChange={() => togglePreference("preferences")}
                  trackColor={{ false: "#767577", true: "#e0b97f" }}
                  thumbColor="#f4f3f4"
                />
              </View>
              <Text style={styles.categoryDescription}>
                Diese Cookies ermöglichen es der Website, sich an Ihre Auswahl zu
                erinnern (wie Ihren Benutzernamen, Ihre Sprache oder die Region, in der
                Sie sich befinden) und bieten verbesserte, persönlichere Funktionen.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalSaveButton]}
              onPress={handleSavePreferences}
            >
              <Text style={styles.modalSaveButtonText}>Einstellungen speichern</Text>
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
