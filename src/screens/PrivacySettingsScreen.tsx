import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';
import { Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

interface ConsentSettings {
  marketingConsent: boolean;
  behaviorTrackingConsent: boolean;
  reminderNotificationsConsent: boolean;
  consentGivenAt?: string;
  consentUpdatedAt?: string;
}

const PrivacySettingsScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [consent, setConsent] = useState<ConsentSettings>({
    marketingConsent: false,
    behaviorTrackingConsent: false,
    reminderNotificationsConsent: false,
  });
  
  useEffect(() => {
    fetchConsent();
  }, []);
  
  const fetchConsent = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/consent');
      setConsent(response.data);
    } catch (err) {
      console.error('Failed to load consent settings:', err);
      Alert.alert(
        t('error') || 'Error',
        'Failed to load privacy settings'
      );
    } finally {
      setLoading(false);
    }
  };
  
  const updateConsent = async (field: string, value: boolean) => {
    try {
      setSaving(true);
      
      const newConsent = { ...consent, [field]: value };
      
      await apiClient.put('/api/consent', newConsent);
      
      setConsent(newConsent);
      
      // Show warning if disabling behavior tracking
      if (field === 'behaviorTrackingConsent' && !value) {
        Alert.alert(
          t('dataDeleted') || 'Data Deleted',
          'Your behavior profile has been deleted from our servers.'
        );
      }
      
    } catch (err) {
      console.error('Failed to update consent:', err);
      Alert.alert(
        t('error') || 'Error',
        'Failed to update privacy settings'
      );
      // Revert change
      fetchConsent();
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e0b97f" />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>
          {t('privacyAndNotifications') || 'Privacy & Notifications'}
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('marketing') || 'Marketing'}
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {t('marketingEmails') || 'Marketing Emails'}
              </Text>
              <Text style={styles.settingDescription}>
                {t('marketingEmailsDesc') || 'Receive newsletters and promotional offers'}
              </Text>
            </View>
            <Switch
              value={consent.marketingConsent}
              onValueChange={(value) => updateConsent('marketingConsent', value)}
              disabled={saving}
              trackColor={{ false: '#767577', true: '#e0b97f' }}
              thumbColor={consent.marketingConsent ? '#d4a574' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('personalization') || 'Personalization'}
          </Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {t('behaviorAnalysis') || 'Behavior Analysis'}
              </Text>
              <Text style={styles.settingDescription}>
                {t('behaviorAnalysisDesc') || 'Analyze your order patterns to improve recommendations. Data is stored securely and deleted after 90 days.'}
              </Text>
            </View>
            <Switch
              value={consent.behaviorTrackingConsent}
              onValueChange={(value) => updateConsent('behaviorTrackingConsent', value)}
              disabled={saving}
              trackColor={{ false: '#767577', true: '#e0b97f' }}
              thumbColor={consent.behaviorTrackingConsent ? '#d4a574' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>
                {t('smartReminders') || 'Smart Reminders'}
              </Text>
              <Text style={styles.settingDescription}>
                {t('smartRemindersDesc') || 'Get gentle reminders at times you usually order. (Requires behavior analysis)'}
              </Text>
            </View>
            <Switch
              value={consent.reminderNotificationsConsent}
              onValueChange={(value) => updateConsent('reminderNotificationsConsent', value)}
              disabled={saving || !consent.behaviorTrackingConsent}
              trackColor={{ false: '#767577', true: '#e0b97f' }}
              thumbColor={consent.reminderNotificationsConsent ? '#d4a574' : '#f4f3f4'}
            />
          </View>
        </View>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ {t('yourPrivacy') || 'Your Privacy'}</Text>
          <Text style={styles.infoText}>
            {t('privacyInfo') || 'We respect your privacy. You can disable any of these features at any time.\n\nDisabling behavior tracking will permanently delete your behavior profile from our servers.'}
          </Text>
        </View>
        
        <Button
          mode="outlined"
          onPress={() => {
            // You can navigate to a full privacy policy page or open a web link
            Alert.alert(
              t('privacyPolicy') || 'Privacy Policy',
              'Full privacy policy would be displayed here or opened in a browser.',
              [{ text: 'OK' }]
            );
          }}
          style={styles.policyButton}
          textColor="#e0b97f"
        >
          {t('readFullPrivacyPolicy') || 'Read Full Privacy Policy'}
        </Button>
        
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#231a13',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fffbe8',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e0b97f',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2117',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fffbe8',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: '#2d2117',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#e0b97f',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0b97f',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#fffbe8',
    lineHeight: 20,
  },
  policyButton: {
    marginBottom: 32,
    borderColor: '#e0b97f',
  },
});

export default PrivacySettingsScreen;
