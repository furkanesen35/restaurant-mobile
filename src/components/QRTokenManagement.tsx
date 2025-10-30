import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import apiClient from '../utils/apiClient';
import { cozyTheme } from '../theme/cozyTheme';
import logger from '../utils/logger';
interface Token {
  id: number;
  code: string;
  points: number;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
  location?: string;
  notes?: string;
  redeemedBy?: any;
  redeemedAt?: string;
  isExpired: boolean;
  isRedeemed: boolean;
}

export default function QRTokenManagement() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  // Form state
  const [points, setPoints] = useState('50');
  const [expiryHours, setExpiryHours] = useState('24');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTokens();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showActiveOnly]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/api/loyalty/tokens?active=${showActiveOnly}&page=1&limit=50`
      );
      const data = response.data as any;
      setTokens(data.tokens || []);
    } catch (error: any) {
      logger.error('Failed to fetch tokens:', error);
      Alert.alert('Error', 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const createToken = async () => {
    if (!points || parseInt(points) <= 0) {
      Alert.alert('Error', 'Please enter a valid points value');
      return;
    }

    try {
      setCreating(true);
      const response = await apiClient.post('/api/loyalty/tokens', {
        points: parseInt(points),
        expiryHours: parseInt(expiryHours),
        location: location || undefined,
        notes: notes || undefined,
      });

      const data = response.data as any;
      if (data.success) {
        Alert.alert('Success', 'QR code created successfully!');
        setShowCreateModal(false);
        resetForm();
        fetchTokens();
        
        // Show the created token QR immediately
        setSelectedToken(data.token);
        setShowQRModal(true);
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create token'
      );
    } finally {
      setCreating(false);
    }
  };

  const deactivateToken = async (tokenId: number) => {
    Alert.alert(
      'Deactivate Token',
      'Are you sure you want to deactivate this token?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/loyalty/tokens/${tokenId}`);
              Alert.alert('Success', 'Token has been deactivated');
              fetchTokens();
            } catch (err) {
              logger.error('Failed to deactivate token:', err);
              Alert.alert('Error', 'Failed to deactivate token');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setPoints('50');
    setExpiryHours('24');
    setLocation('');
    setNotes('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderToken = ({ item }: { item: Token }) => {
    const statusColor = item.isRedeemed
      ? '#22c55e'
      : item.isExpired
      ? '#ef4444'
      : item.isActive
      ? '#3b82f6'
      : '#9ca3af';

    const statusText = item.isRedeemed
      ? 'Redeemed'
      : item.isExpired
      ? 'Expired'
      : item.isActive
      ? 'Active'
      : 'Inactive';

    return (
      <View style={styles.tokenCard}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenCode}>{item.code}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.tokenDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="star" size={16} color={cozyTheme.colors.primary} />
            <Text style={styles.detailText}>{item.points} Points</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#9ca3af" />
            <Text style={styles.detailText}>
              Created: {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="hourglass" size={16} color="#9ca3af" />
            <Text style={styles.detailText}>
              Expires: {formatDate(item.expiresAt)}
            </Text>
          </View>

          {item.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color="#9ca3af" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          )}

          {item.redeemedBy && (
            <View style={styles.redeemedInfo}>
              <Text style={styles.redeemedText}>
                Redeemed by: {item.redeemedBy.name}
              </Text>
              <Text style={styles.redeemedText}>
                On: {formatDate(item.redeemedAt!)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tokenActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              setSelectedToken(item);
              setShowQRModal(true);
            }}
          >
            <Ionicons name="qr-code" size={20} color={cozyTheme.colors.primary} />
            <Text style={styles.actionButtonText}>Show QR</Text>
          </TouchableOpacity>

          {item.isActive && !item.isRedeemed && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => deactivateToken(item.id)}
            >
              <Ionicons name="close-circle" size={20} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Deactivate
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>QR Code Management</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        >
          <Ionicons
            name={showActiveOnly ? 'eye' : 'eye-off'}
            size={20}
            color={cozyTheme.colors.primary}
          />
          <Text style={styles.filterText}>
            {showActiveOnly ? 'Active Only' : 'All'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={cozyTheme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={tokens}
          renderItem={renderToken}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="qr-code-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No tokens available</Text>
              <Text style={styles.emptySubtext}>
                Create a new QR code to get started
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Token Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New QR Code</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={cozyTheme.colors.onSurface} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.label}>Points *</Text>
              <TextInput
                style={styles.input}
                placeholder="50"
                value={points}
                onChangeText={setPoints}
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Validity (Hours) *</Text>
              <View style={styles.expiryButtons}>
                {[1, 24, 168].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.expiryButton,
                      expiryHours === hours.toString() && styles.expiryButtonActive,
                    ]}
                    onPress={() => setExpiryHours(hours.toString())}
                  >
                    <Text
                      style={[
                        styles.expiryButtonText,
                        expiryHours === hours.toString() &&
                          styles.expiryButtonTextActive,
                      ]}
                    >
                      {hours === 1 ? '1h' : hours === 24 ? '24h' : '1 Week'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Location (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Main Restaurant"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g. Weekend promotion"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[styles.createButton, creating && styles.createButtonDisabled]}
                onPress={createToken}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create QR Code</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QR Display Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQRModal(false)}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>

            {selectedToken && (
              <>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={`restaurantapp://loyalty/redeem/${selectedToken.code}`}
                    size={250}
                    backgroundColor="white"
                    color="black"
                  />
                </View>

                <Text style={styles.qrCode}>{selectedToken.code}</Text>
                <Text style={styles.qrPoints}>{selectedToken.points} Points</Text>
                <Text style={styles.qrExpiry}>
                  Valid until: {formatDate(selectedToken.expiresAt)}
                </Text>

                <Text style={styles.qrInstructions}>
                  Customers can scan this QR code with the app to collect points
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cozyTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3d3127',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: cozyTheme.colors.onBackground,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: cozyTheme.colors.primary,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  tokenCard: {
    backgroundColor: cozyTheme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3d3127',
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenCode: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: cozyTheme.colors.onSurface,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tokenDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: cozyTheme.colors.onSurface,
  },
  redeemedInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: 6,
  },
  redeemedText: {
    fontSize: 12,
    color: '#15803d',
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: cozyTheme.colors.primary,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: cozyTheme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: cozyTheme.colors.onBackground,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: cozyTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: cozyTheme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
    color: cozyTheme.colors.onSurface,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: cozyTheme.colors.onSurface,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3d3127',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: cozyTheme.colors.onSurface,
    backgroundColor: cozyTheme.colors.background,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  expiryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  expiryButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3d3127',
    borderRadius: 8,
    alignItems: 'center',
  },
  expiryButtonActive: {
    backgroundColor: cozyTheme.colors.primary,
    borderColor: cozyTheme.colors.primary,
  },
  expiryButtonText: {
    color: cozyTheme.colors.onSurface,
    fontWeight: '600',
  },
  expiryButtonTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: cozyTheme.colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    zIndex: 1,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
  },
  qrCode: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#000',
    marginBottom: 8,
  },
  qrPoints: {
    fontSize: 24,
    fontWeight: 'bold',
    color: cozyTheme.colors.primary,
    marginBottom: 4,
  },
  qrExpiry: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});



