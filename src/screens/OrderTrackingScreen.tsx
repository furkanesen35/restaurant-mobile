import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { decode } from '@mapbox/polyline';
import { useTheme, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../utils/apiClient';
import { useTranslation } from '../hooks/useTranslation';
import logger from '../utils/logger';

interface TrackingInfo {
  orderId: number;
  status: string;
  driverName: string | null;
  driverPhone: string | null;
  driverLocation: {
    latitude: number;
    longitude: number;
    updatedAt: string;
  } | null;
  customerLocation: {
    latitude?: number;
    longitude?: number;
    address: string;
  } | null;
  restaurantLocation: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
  route: {
    polyline: string;
    durationText: string;
    distanceText: string;
  } | null;
  estimatedDeliveryTime: string | null;
  statusHistory: Array<{
    id: number;
    status: string;
    message: string | null;
    timestamp: string;
  }>;
}

const LOCATION_POLL_INTERVAL = 60000; // 1 minute

const OrderTrackingScreen = ({ route, navigation }: any) => {
  const { orderId } = route.params;
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [tracking, setTracking] = useState<TrackingInfo | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const response = await apiClient.get<TrackingInfo>(`/api/delivery/track/${orderId}`);
        const data = response.data;
        
        if (!data) return;
        
        setTracking(data);
        setError(null);

        // Decode polyline for route display
        if (data.route?.polyline) {
          const decoded = decode(data.route.polyline);
          setRouteCoordinates(decoded.map(([lat, lng]: [number, number]) => ({ latitude: lat, longitude: lng })));
        }

        // Fit map to show driver and destination
        if (data.driverLocation && mapRef.current) {
          const coords = [
            {
              latitude: data.driverLocation.latitude,
              longitude: data.driverLocation.longitude,
            },
          ];

          // Add restaurant location if available
          if (data.restaurantLocation) {
            coords.push({
              latitude: data.restaurantLocation.latitude,
              longitude: data.restaurantLocation.longitude,
            });
          }

          // Add customer location if available
          if (data.customerLocation?.latitude && data.customerLocation?.longitude) {
            coords.push({
              latitude: data.customerLocation.latitude,
              longitude: data.customerLocation.longitude,
            });
          }

          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
              animated: true,
            });
          }, 500);
        }
      } catch (error: any) {
        logger.error('Failed to fetch tracking:', error);
        setError(error.response?.data?.error || 'Failed to load tracking information');
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();

    // Poll every 1 minute
    const interval = setInterval(fetchTracking, LOCATION_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [orderId]);

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, string> = {
      pending: 'time-outline',
      confirmed: 'checkmark-circle-outline',
      preparing: 'restaurant-outline',
      ready: 'cube-outline',
      out_for_delivery: 'car-outline',
      delivered: 'checkmark-done-circle-outline',
      cancelled: 'close-circle-outline',
    };
    return statusIcons[status] || 'help-circle-outline';
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      preparing: '#2196F3',
      ready: '#9C27B0',
      out_for_delivery: '#FF5722',
      delivered: '#4CAF50',
      cancelled: '#F44336',
    };
    return statusColors[status] || '#999';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onBackground }]}>
            {t('orders.loadingTracking')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tracking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>
            {error || t('orders.trackingNotAvailable')}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initialRegion = tracking.restaurantLocation
    ? {
        latitude: tracking.restaurantLocation.latitude,
        longitude: tracking.restaurantLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Restaurant Marker */}
        {tracking.restaurantLocation && (
          <Marker
            coordinate={{
              latitude: tracking.restaurantLocation.latitude,
              longitude: tracking.restaurantLocation.longitude,
            }}
            title={t('orders.restaurant')}
            description={tracking.restaurantLocation.address || undefined}
            pinColor="green"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="restaurant" size={24} color="green" />
            </View>
          </Marker>
        )}

        {/* Driver Marker */}
        {tracking.driverLocation && (
          <Marker
            coordinate={{
              latitude: tracking.driverLocation.latitude,
              longitude: tracking.driverLocation.longitude,
            }}
            title={tracking.driverName || t('orders.driver')}
            pinColor="blue"
          >
            <View style={[styles.markerContainer, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="car" size={24} color="white" />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4285F4"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Info Panel */}
      <ScrollView style={[styles.infoPanel, { backgroundColor: colors.surface }]}>
        {/* Status Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Ionicons
                name={getStatusIcon(tracking.status) as any}
                size={32}
                color={getStatusColor(tracking.status)}
              />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusText, { color: colors.onSurface }]}>
                  {t(`orders.status.${tracking.status}`)}
                </Text>
                <Text style={[styles.orderIdText, { color: colors.onSurfaceVariant }]}>
                  {t('orders.orderNumber')}: #{orderId}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* ETA Info */}
        {tracking.route && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.etaContainer}>
                <View style={styles.etaItem}>
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                  <View style={styles.etaTextContainer}>
                    <Text style={[styles.etaLabel, { color: colors.onSurfaceVariant }]}>
                      {t('orders.eta')}
                    </Text>
                    <Text style={[styles.etaValue, { color: colors.onSurface }]}>
                      {tracking.route.durationText}
                    </Text>
                  </View>
                </View>
                <View style={styles.etaItem}>
                  <Ionicons name="navigate-outline" size={24} color={colors.primary} />
                  <View style={styles.etaTextContainer}>
                    <Text style={[styles.etaLabel, { color: colors.onSurfaceVariant }]}>
                      {t('orders.distance')}
                    </Text>
                    <Text style={[styles.etaValue, { color: colors.onSurface }]}>
                      {tracking.route.distanceText}
                    </Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Last Updated */}
        {tracking.driverLocation && (
          <Text style={[styles.updatedText, { color: colors.onSurfaceVariant }]}>
            {t('orders.lastUpdated')}: {formatTime(tracking.driverLocation.updatedAt)}
          </Text>
        )}

        {/* Status Timeline */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={[styles.timelineTitle, { color: colors.onSurface }]}>
              {t('orders.orderHistory')}
            </Text>
            {tracking.statusHistory.map((item, index) => (
              <View key={item.id} style={styles.timelineItem}>
                <View style={styles.timelineDotContainer}>
                  <View
                    style={[
                      styles.timelineDot,
                      { backgroundColor: getStatusColor(item.status) },
                    ]}
                  />
                  {index < tracking.statusHistory.length - 1 && (
                    <View style={[styles.timelineLine, { backgroundColor: colors.outline }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineStatus, { color: colors.onSurface }]}>
                    {t(`orders.status.${item.status}`)}
                  </Text>
                  <Text style={[styles.timelineTime, { color: colors.onSurfaceVariant }]}>
                    {formatTime(item.timestamp)}
                  </Text>
                  {item.message && (
                    <Text style={[styles.timelineMessage, { color: colors.onSurfaceVariant }]}>
                      {item.message}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  card: {
    marginBottom: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orderIdText: {
    fontSize: 14,
    marginTop: 4,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverDetails: {
    marginLeft: 12,
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  callText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  etaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  etaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  etaTextContainer: {
    marginLeft: 8,
  },
  etaLabel: {
    fontSize: 12,
  },
  etaValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  updatedText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineDotContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineStatus: {
    fontWeight: '600',
    fontSize: 14,
  },
  timelineTime: {
    fontSize: 12,
    marginTop: 2,
  },
  timelineMessage: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default OrderTrackingScreen;
