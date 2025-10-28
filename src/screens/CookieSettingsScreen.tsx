import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "react-native-paper";
import { useCookieConsent, CookieConsent } from "../contexts/CookieConsentContext";

const CookieSettingsScreen = () => {
  const { consent, savePreferences, resetConsent } = useCookieConsent();
  const [localPreferences, setLocalPreferences] = React.useState<CookieConsent>(
    consent || {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    }
  );

  React.useEffect(() => {
    if (consent) {
      setLocalPreferences(consent);
    }
  }, [consent]);

  const togglePreference = (key: keyof CookieConsent) => {
    if (key === "necessary") return; // Cannot disable necessary cookies
    setLocalPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    await savePreferences(localPreferences);
  };

  const handleReset = async () => {
    await resetConsent();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Cookie & Datenschutz-Einstellungen</Text>
        <Text style={styles.description}>
          Verwalten Sie Ihre Cookie-Einstellungen und Datenschutzpräferenzen.
          Notwendige Cookies können nicht deaktiviert werden, da sie für die
          Funktionalität der App erforderlich sind.
        </Text>

        {/* Necessary Cookies */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryTitle}>Notwendige Cookies</Text>
                <Text style={styles.categoryBadge}>Immer aktiv</Text>
              </View>
              <Switch
                value={true}
                disabled={true}
                trackColor={{ false: "#767577", true: "#e0b97f" }}
                thumbColor="#f4f3f4"
              />
            </View>
            <Text style={styles.categoryDescription}>
              Diese Cookies sind für die Funktion der App erforderlich und können
              nicht deaktiviert werden. Sie umfassen:
            </Text>
            <Text style={styles.cookieList}>
              • Authentifizierung und Sitzungsverwaltung{"\n"}
              • Warenkorb und Bestellfunktionen{"\n"}
              • Sicherheit und Betrugsschutz{"\n"}
              • Cookie-Einwilligungsverwaltung
            </Text>
          </Card.Content>
        </Card>

        {/* Analytics Cookies */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Analyse-Cookies</Text>
              <Switch
                value={localPreferences.analytics}
                onValueChange={() => togglePreference("analytics")}
                trackColor={{ false: "#767577", true: "#e0b97f" }}
                thumbColor="#f4f3f4"
              />
            </View>
            <Text style={styles.categoryDescription}>
              Diese Cookies helfen uns, die Nutzung der App zu verstehen und zu
              verbessern:
            </Text>
            <Text style={styles.cookieList}>
              • Besuchsstatistiken und Nutzungsmuster{"\n"}
              • Leistungsüberwachung{"\n"}
              • Fehlerberichterstattung{"\n"}
              • A/B-Testing und Funktionsoptimierung
            </Text>
          </Card.Content>
        </Card>

        {/* Marketing Cookies */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Marketing-Cookies</Text>
              <Switch
                value={localPreferences.marketing}
                onValueChange={() => togglePreference("marketing")}
                trackColor={{ false: "#767577", true: "#e0b97f" }}
                thumbColor="#f4f3f4"
              />
            </View>
            <Text style={styles.categoryDescription}>
              Diese Cookies werden für personalisierte Werbung verwendet:
            </Text>
            <Text style={styles.cookieList}>
              • Personalisierte Angebote und Empfehlungen{"\n"}
              • Werbe-Tracking und Conversion-Messung{"\n"}
              • Retargeting und zielgerichtete Werbung{"\n"}
              • Social-Media-Integration
            </Text>
          </Card.Content>
        </Card>

        {/* Preference Cookies */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>Präferenz-Cookies</Text>
              <Switch
                value={localPreferences.preferences}
                onValueChange={() => togglePreference("preferences")}
                trackColor={{ false: "#767577", true: "#e0b97f" }}
                thumbColor="#f4f3f4"
              />
            </View>
            <Text style={styles.categoryDescription}>
              Diese Cookies speichern Ihre persönlichen Einstellungen:
            </Text>
            <Text style={styles.cookieList}>
              • Sprachpräferenzen{"\n"}
              • Regionale Einstellungen{"\n"}
              • Anzeigepräferenzen{"\n"}
              • Gespeicherte Favoriten und Listen
            </Text>
          </Card.Content>
        </Card>

        {/* Info Section */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.infoTitle}>ℹ️ Weitere Informationen</Text>
            <Text style={styles.infoText}>
              Weitere Informationen zur Datenverarbeitung und Ihren Rechten finden
              Sie in unserer Datenschutzerklärung. Sie können Ihre Einstellungen
              jederzeit hier ändern.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Zurücksetzen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Einstellungen speichern</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#e0b97f",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#fffbe8",
    lineHeight: 20,
    marginBottom: 24,
    opacity: 0.9,
  },
  card: {
    backgroundColor: "#2d2117",
    marginBottom: 16,
    borderRadius: 12,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e0b97f",
  },
  categoryBadge: {
    fontSize: 11,
    color: "#e0b97f",
    backgroundColor: "#3d3127",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontWeight: "600",
  },
  categoryDescription: {
    fontSize: 13,
    color: "#fffbe8",
    lineHeight: 18,
    marginBottom: 8,
    opacity: 0.9,
  },
  cookieList: {
    fontSize: 12,
    color: "#fffbe8",
    lineHeight: 18,
    opacity: 0.8,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#2d2117",
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0b97f",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e0b97f",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#fffbe8",
    lineHeight: 18,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#3d3127",
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#fffbe8",
    borderRadius: 8,
    alignItems: "center",
  },
  resetButtonText: {
    color: "#fffbe8",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: "#e0b97f",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#231a13",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default CookieSettingsScreen;
