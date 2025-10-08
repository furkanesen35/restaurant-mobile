import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Card, useTheme } from "react-native-paper";
import { useCart } from "../contexts/CartContext";

const MenuScreen = () => {
  const { colors } = useTheme();
  const { addToCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [key: string]: View | null }>({});

  const [menuCategories, setMenuCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [menuItems, setMenuItems] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      description: string;
      category: string;
    }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [animatedHeights] = useState<{ [key: string]: Animated.Value }>({});

  React.useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("http://192.168.1.110:3000/menu");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch menu: ${response.status}`);
        }
        const data = await response.json();
        if (!data) {
          throw new Error("No data received from server");
        }
        // Handle empty menu data gracefully
        const categories = Array.isArray(data.categories)
          ? data.categories
          : [];
        const items = Array.isArray(data.items) ? data.items : [];
        setMenuCategories([{ id: "all", name: "All" }, ...categories]);
        setMenuItems(items);
        setSelectedCategory("all");
      } catch (err) {
        setError((err as Error).message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // If 'all' is selected, group items by category
  const itemsToShow =
    selectedCategory === "all"
      ? menuCategories
          .filter((c: { id: string; name: string }) => c.id !== "all")
          .map((category: { id: string; name: string }) => ({
            category,
            items: menuItems.filter(
              (item: {
                id: string;
                name: string;
                price: number;
                description: string;
                category: string;
              }) => item.category === category.id
            ),
          }))
      : [
          {
            category: menuCategories.find(
              (c: { id: string; name: string }) => c.id === selectedCategory
            ),
            items: menuItems.filter(
              (item: {
                id: string;
                name: string;
                price: number;
                description: string;
                category: string;
              }) => item.category === selectedCategory
            ),
          },
        ];

  // Helper to get or create Animated.Value for a category
  const getAnimatedHeight = (categoryId: string) => {
    if (!animatedHeights[categoryId]) {
      animatedHeights[categoryId] = new Animated.Value(0);
    }
    return animatedHeights[categoryId];
  };

  const toggleCategory = (categoryId: string, itemCount: number) => {
    const isExpanding = !expandedCategories.includes(categoryId);
    const newExpanded = isExpanding
      ? [...expandedCategories, categoryId]
      : expandedCategories.filter((id) => id !== categoryId);
    setExpandedCategories(newExpanded);

    // More accurate height calculation: card height + margins
    const cardHeight = 100; // Card + margin
    const targetHeight = isExpanding ? itemCount * cardHeight : 0;

    Animated.timing(getAnimatedHeight(categoryId), {
      toValue: targetHeight,
      duration: 300, // Slower for drawer effect
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.primary, fontSize: 20 }}>
          Loading menu...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: "red", fontSize: 18 }}>Error: {error}</Text>
      </View>
    );
  }

  // If menu data is empty, show a message
  const hasMenu = menuCategories.length > 1 && menuItems.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Menu</Text>
      {!hasMenu ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: colors.primary, fontSize: 18 }}>
            No menu data available.
          </Text>
          <Text style={{ color: colors.primary, fontSize: 14, marginTop: 10 }}>
            Categories: {menuCategories.length}, Items: {menuItems.length}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryBar}
          >
            {menuCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <Text
                  style={{
                    color:
                      selectedCategory === category.id
                        ? colors.onPrimary
                        : "#fffbe8", // Lighter for inactive
                    fontWeight:
                      selectedCategory === category.id ? "bold" : "normal",
                    opacity: selectedCategory === category.id ? 1 : 0.8,
                  }}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            contentContainerStyle={styles.menuList}
            ref={scrollViewRef}
          >
            {itemsToShow.map(({ category, items }) => (
              <View
                key={category?.id}
                style={styles.categorySection}
                ref={(ref) => {
                  if (ref && category?.id)
                    categoryRefs.current[category.id] = ref;
                }}
              >
                {selectedCategory === "all" && (
                  <TouchableOpacity
                    onPress={() => toggleCategory(category?.id!, items.length)}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.categoryTitle}>{category?.name}</Text>
                      <Text
                        style={{
                          fontSize: 18,
                          marginLeft: 6,
                          color: "#fffbe8",
                        }}
                      >
                        {expandedCategories.includes(category?.id!) ? "▼" : "▶"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {selectedCategory !== "all" ? (
                  // When specific category is selected, show items directly
                  items.map((item) => (
                    <Card key={item.id} style={styles.menuCard}>
                      <Card.Title
                        title={item.name}
                        subtitle={`₺${item.price.toFixed(2)}`}
                      />
                      <Card.Content>
                        <Text style={{ color: colors.onBackground }}>
                          {item.description}
                        </Text>
                        <TouchableOpacity
                          style={{
                            marginTop: 8,
                            backgroundColor: colors.primary,
                            borderRadius: 8,
                            padding: 8,
                            alignSelf: "flex-start",
                          }}
                          onPress={() =>
                            addToCart({
                              menuItemId: item.id,
                              name: item.name,
                              price: item.price,
                            })
                          }
                        >
                          <Text
                            style={{
                              color: colors.onPrimary,
                              fontWeight: "bold",
                            }}
                          >
                            Add to Cart
                          </Text>
                        </TouchableOpacity>
                      </Card.Content>
                    </Card>
                  ))
                ) : (
                  // When "all" is selected, show collapsible items
                  <Animated.View
                    style={{
                      overflow: "hidden",
                      height: getAnimatedHeight(category?.id!),
                    }}
                  >
                    {items.map((item) => (
                      <Card key={item.id} style={styles.menuCard}>
                        <Card.Title
                          title={item.name}
                          subtitle={`₺${item.price.toFixed(2)}`}
                        />
                        <Card.Content>
                          <Text style={{ color: colors.onBackground }}>
                            {item.description}
                          </Text>
                          <TouchableOpacity
                            style={{
                              marginTop: 8,
                              backgroundColor: colors.primary,
                              borderRadius: 8,
                              padding: 8,
                              alignSelf: "flex-start",
                            }}
                            onPress={() =>
                              addToCart({
                                menuItemId: item.id,
                                name: item.name,
                                price: item.price,
                              })
                            }
                          >
                            <Text
                              style={{
                                color: colors.onPrimary,
                                fontWeight: "bold",
                              }}
                            >
                              Add to Cart
                            </Text>
                          </TouchableOpacity>
                        </Card.Content>
                      </Card>
                    ))}
                  </Animated.View>
                )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 24,
    backgroundColor: "#231a13", // Very dark brown, bar & grill vibe
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 12,
    alignSelf: "center",
    color: "#fffbe8", // Lighter yellowish/whitish
    letterSpacing: 1,
    textShadowColor: "#1a120b",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  categoryBar: {
    flexGrow: 0,
    maxHeight: 56,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#2d2117",
    borderWidth: 2,
    borderColor: "#fffbe8", // Lighter border for visibility
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fffbe8", // Lighter yellowish/whitish
    letterSpacing: 0.5,
    textShadowColor: "#1a120b",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  menuList: {
    padding: 16,
  },
  menuCard: {
    marginBottom: 16,
    backgroundColor: "#2d2117", // Dark brown card
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e0b97f",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 84, // Fixed height for calculation
  },
});

export default MenuScreen;
