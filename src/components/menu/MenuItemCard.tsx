import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { Chip } from "react-native-paper";
import { MenuItem } from "../../types";
import { formatCurrency } from "../../utils/validation";

interface MenuItemCardProps {
  item: MenuItem;
  onPress: (item: MenuItem) => void;
  onAddToCart?: (item: MenuItem) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onPress,
  onAddToCart,
}) => {
  const cardContent = (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
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
    </View>
  );

  return (
    <TouchableOpacity onPress={() => onPress(item)} style={styles.card}>
      {item.imageUrl ? (
        <ImageBackground
          source={{ uri: item.imageUrl }}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          {cardContent}
        </ImageBackground>
      ) : (
        <View style={styles.fallbackBackground}>{cardContent}</View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2d2117",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  imageBackground: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(29, 21, 17, 0.35)',
  },
  fallbackBackground: {
    backgroundColor: '#2d2117',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    color: "#fffbe8",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  price: {
    color: "#e0b97f",
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    color: "#fffbe8",
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryChip: {
    backgroundColor: "transparent",
    borderColor: "#e0b97f",
  },
  categoryText: {
    color: "#e0b97f",
    fontSize: 12,
  },
  addButton: {
    backgroundColor: "#e0b97f",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#231a13",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default MenuItemCard;
