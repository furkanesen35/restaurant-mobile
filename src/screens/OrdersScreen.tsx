import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Chip, useTheme, ProgressBar } from 'react-native-paper';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  items: string[];
  total: number;
  status: OrderStatus;
  orderTime: string;
  estimatedTime?: string;
  progress: number;
};

const OrdersScreen = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  const currentOrders: Order[] = [
    {
      id: 'ORD001',
      items: ['Classic Cheeseburger', 'Buffalo Wings', 'Craft Beer'],
      total: 34.97,
      status: 'preparing',
      orderTime: '2:30 PM',
      estimatedTime: '15-20 min',
      progress: 0.6,
    },
  ];

  const orderHistory: Order[] = [
    {
      id: 'ORD002',
      items: ['Grilled Ribeye Steak', 'House Wine'],
      total: 36.98,
      status: 'delivered',
      orderTime: 'Yesterday, 7:45 PM',
      progress: 1,
    },
    {
      id: 'ORD003',
      items: ['BBQ Ribs', 'Loaded Nachos', 'Old Fashioned'],
      total: 47.97,
      status: 'delivered',
      orderTime: 'Oct 1, 6:20 PM',
      progress: 1,
    },
  ];

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#FFD700';
      case 'confirmed': return '#87CEEB';
      case 'preparing': return '#FFA500';
      case 'ready': return '#90EE90';
      case 'delivered': return '#32CD32';
      case 'cancelled': return '#FF6B6B';
      default: return '#e0b97f';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Order Received';
      case 'confirmed': return 'Order Confirmed';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const OrderCard = ({ order }: { order: Order }) => (
    <Card style={styles.orderCard}>
      <Card.Content>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={styles.orderTime}>{order.orderTime}</Text>
        </View>
        
        <Chip 
          mode="outlined" 
          textStyle={{ color: getStatusColor(order.status) }}
          style={[styles.statusChip, { borderColor: getStatusColor(order.status) }]}
        >
          {getStatusText(order.status)}
        </Chip>

        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <View style={styles.progressSection}>
            <ProgressBar 
              progress={order.progress} 
              color={getStatusColor(order.status)}
              style={styles.progressBar}
            />
            {order.estimatedTime && (
              <Text style={styles.estimatedTime}>Est. {order.estimatedTime}</Text>
            )}
          </View>
        )}

        <View style={styles.itemsList}>
          {order.items.map((item, index) => (
            <Text key={index} style={styles.orderItem}>• {item}</Text>
          ))}
        </View>

        <Text style={styles.orderTotal}>Total: ₺{order.total.toFixed(2)}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.title}>My Orders</Text>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'current' && styles.activeTab]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.activeTabText]}>
            Current Orders
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Order History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.ordersContainer}>
        {activeTab === 'current' ? (
          currentOrders.length > 0 ? (
            currentOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No current orders</Text>
              <Text style={styles.emptySubText}>Place an order from our menu to get started!</Text>
            </View>
          )
        ) : (
          orderHistory.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fffbe8',
    textAlign: 'center',
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2d2117',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#e0b97f',
  },
  tabText: {
    color: '#fffbe8',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#231a13',
  },
  ordersContainer: {
    paddingBottom: 20,
  },
  orderCard: {
    marginBottom: 16,
    backgroundColor: '#2d2117',
    borderRadius: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fffbe8',
  },
  orderTime: {
    fontSize: 14,
    color: '#e0b97f',
  },
  statusChip: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#231a13',
    marginBottom: 8,
  },
  estimatedTime: {
    fontSize: 12,
    color: '#e0b97f',
    textAlign: 'center',
  },
  itemsList: {
    marginBottom: 12,
  },
  orderItem: {
    color: '#fffbe8',
    fontSize: 14,
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e0b97f',
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#fffbe8',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#e0b97f',
    textAlign: 'center',
  },
});

export default OrdersScreen;
