import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { cozyTheme } from '../theme/cozyTheme';

interface BarCodeEvent {
  type: string;
  data: string;
}

export default function QRScannerScreen({ navigation }: any) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    points: number;
    newBalance: number;
  } | null>(null);
  const { updateUser } = useAuth();

  // Animation value for success modal
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const extractCodeFromData = (data: string): string => {
    // Handle deep link format: restaurantapp://loyalty/redeem/VISIT-ABC123
    if (data.includes('restaurantapp://loyalty/redeem/')) {
      return data.split('/').pop() || data;
    }
    // Handle direct code
    return data;
  };

  const redeemLoyaltyCode = async (code: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await apiClient.post('/api/loyalty/redeem', {
        code: code.toUpperCase().trim(),
      });

      const data = response.data as any;
      if (data.success) {
        // Update user loyalty points in context
        await updateUser({ loyaltyPoints: data.newBalance });

        // Show success animation
        setSuccessData({
          points: data.pointsAwarded,
          newBalance: data.newBalance,
        });
        setShowSuccess(true);

        // Animate success modal
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();

        // Auto close after 3 seconds
        setTimeout(() => {
          closeSuccessModal();
        }, 3000);
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'Fehler beim Einlösen des QR-Codes';
      Alert.alert('Fehler', errorMessage);
      setScanned(false);
    } finally {
      setIsProcessing(false);
      setManualCode('');
      setShowManualEntry(false);
    }
  };

  const handleBarCodeScanned = ({ data }: BarCodeEvent) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    const code = extractCodeFromData(data);
    redeemLoyaltyCode(code);
  };

  const handleManualSubmit = () => {
    if (manualCode.length < 10) {
      Alert.alert('Fehler', 'Bitte geben Sie einen gültigen Code ein');
      return;
    }
    setScanned(true);
    redeemLoyaltyCode(manualCode);
  };

  const closeSuccessModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccess(false);
      setSuccessData(null);
      navigation.goBack();
    });
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
        <Text style={styles.permissionText}>
          Kamera-Berechtigung wird angefordert...
        </Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
      <View style={styles.permissionDenied}>
        <Ionicons name="camera-outline" size={64} color="#9ca3af" />
        <Text style={styles.permissionTitle}>Kein Kamera-Zugriff</Text>
          <Text style={styles.permissionText}>
            Bitte erlauben Sie den Kamera-Zugriff in den Einstellungen, um QR-Codes zu scannen.
          </Text>
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualEntry(true)}
          >
            <Ionicons name="keypad" size={20} color={cozyTheme.colors.primary} />
            <Text style={styles.manualButtonText}>Code manuell eingeben</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR-Code scannen</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />

        {/* Scan frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {scanned && isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.processingText}>Wird eingelöst...</Text>
          </View>
        )}
      </View>

      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>
          Scannen Sie den QR-Code
        </Text>
        <Text style={styles.instructionsText}>
          Halten Sie den QR-Code innerhalb des Rahmens. Der Code wird automatisch erkannt.
        </Text>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualEntry(true)}
        >
          <Ionicons name="keypad" size={20} color={cozyTheme.colors.primary} />
          <Text style={styles.manualButtonText}>Code manuell eingeben</Text>
        </TouchableOpacity>

        <View style={styles.tipContainer}>
          <Ionicons name="bulb-outline" size={20} color={cozyTheme.colors.primary} />
          <Text style={styles.tipText}>
            Tipp: Halten Sie den Code gut beleuchtet für schnelles Scannen
          </Text>
        </View>

        {scanned && !isProcessing && (
          <TouchableOpacity
            style={styles.scanAgainButton}
            onPress={() => setScanned(false)}
          >
            <Text style={styles.scanAgainText}>Erneut scannen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualEntry}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Code manuell eingeben</Text>
              <TouchableOpacity onPress={() => setShowManualEntry(false)}>
                <Ionicons name="close" size={24} color={cozyTheme.colors.onBackground} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="VISIT-ABC123XYZ"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                isProcessing && styles.submitButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Einlösen</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View
            style={[
              styles.successCard,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#22c55e" />
            </View>
            <Text style={styles.successTitle}>🎉 Erfolg!</Text>
            <Text style={styles.pointsText}>
              +{successData?.points} Treuepunkte
            </Text>
            <Text style={styles.balanceText}>
              Neuer Kontostand: {successData?.newBalance} Punkte
            </Text>
            <TouchableOpacity
              style={styles.successButton}
              onPress={closeSuccessModal}
            >
              <Text style={styles.successButtonText}>Großartig!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: cozyTheme.colors.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
  instructionsContainer: {
    backgroundColor: cozyTheme.colors.background,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.onBackground,
    marginBottom: 8,
    textAlign: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: cozyTheme.colors.primary,
    borderRadius: 8,
    marginTop: 8,
  },
  manualButtonText: {
    color: cozyTheme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: cozyTheme.colors.secondary + '20',
    borderRadius: 8,
  },
  tipText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: cozyTheme.colors.onBackground,
  },
  scanAgainButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: cozyTheme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionDenied: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.onBackground,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: cozyTheme.colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: cozyTheme.colors.onBackground,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3d3127',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'monospace',
    color: cozyTheme.colors.onBackground,
    backgroundColor: cozyTheme.colors.surface,
  },
  submitButton: {
    backgroundColor: cozyTheme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: cozyTheme.colors.background,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  successIconContainer: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.onBackground,
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: cozyTheme.colors.primary,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: cozyTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  successButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
