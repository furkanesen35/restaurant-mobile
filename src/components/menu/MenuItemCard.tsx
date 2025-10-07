import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { MenuItem } from '../../types';
import { formatCurrency } from '../../utils/validation';

interface MenuItemCardProps {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onPress, onAddToCart }) => {
  return (
    <Card style={styles.card} onPress={() => onPress(item)}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        </View>
        
        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Chip 
            style={styles.categoryChip} 
            textStyle={styles.categoryText}
            mode="outlined"
          >
            {item.category}
          </Chip>
          
          {onAddToCart && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => onAddToCart(item)}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2d2117',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  name: {
    color: '#fffbe8',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  price: {
    color: '#e0b97f',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: '#fffbe8',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0b97f',
  },
  categoryText: {
    color: '#e0b97f',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#e0b97f',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#231a13',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MenuItemCard;