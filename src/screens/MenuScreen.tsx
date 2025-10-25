import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
} from "react-native";
import { Card, useTheme, Chip } from "react-native-paper";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import ENV from "../config/env";
import { MenuItem } from "../types";

const MenuScreen = () => {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [key: string]: View | null }>({});

  const [menuCategories, setMenuCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dietaryFilters, setDietaryFilters] = useState({
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
  });

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
        if (selectedCategory !== "all")
          params.append("categoryId", selectedCategory);
        if (dietaryFilters.isVegetarian)
          params.append("isVegetarian", "true");
        if (dietaryFilters.isVegan) params.append("isVegan", "true");
        if (dietaryFilters.isGlutenFree)
          params.append("isGlutenFree", "true");
        if (dietaryFilters.isSpicy) params.append("isSpicy", "true");

        const queryString = params.toString();
        const url = `${ENV.API_URL}/menu${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url);
        if (!response.ok) {
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
      } catch (err) {
        setError((err as Error).message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [debouncedSearchQuery, selectedCategory, dietaryFilters]);

  // Auto-expand categories when searching
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      // When there's a search query, expand all categories that have items
      const categoriesWithItems = menuCategories
        .filter((c) => c.id !== "all")
        .filter((category) => 
          menuItems.some((item) => item.category === category.id)
        )
        .map((c) => c.id);
      setExpandedCategories(categoriesWithItems);
    } else {
      // When search is cleared, collapse all categories
      setExpandedCategories([]);
    }
  }, [debouncedSearchQuery, menuCategories, menuItems]);

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
          // Filter out empty categories when searching
          .filter(({ items }) => 
            debouncedSearchQuery.trim() ? items.length > 0 : true
          )
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

  const toggleCategory = (categoryId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const isExpanding = !expandedCategories.includes(categoryId);
    const newExpanded = isExpanding
      ? [...expandedCategories, categoryId]
      : expandedCategories.filter((id) => id !== categoryId);
    setExpandedCategories(newExpanded);
  };

  const DietaryBadges = ({ item }: { item: MenuItem }) => {
    const badges = [];
    if (item.isVegetarian)
      badges.push({ icon: "leaf", label: "V", color: "#4caf50" });
    if (item.isVegan)
      badges.push({ icon: "sprout", label: "VG", color: "#66bb6a" });
    if (item.isGlutenFree)
      badges.push({ icon: "wheat-off", label: "GF", color: "#ff9800" });
    if (item.isSpicy)
      badges.push({ icon: "chili-hot", label: "🌶", color: "#f44336" });

    if (badges.length === 0) return null;

    return (
      <View style={styles.dietaryBadgesContainer}>
        {badges.map((badge, index) => (
          <View
            key={index}
            style={[
              styles.dietaryBadge,
              { backgroundColor: badge.color + "20", borderColor: badge.color },
            ]}
          >
            <Text style={[styles.dietaryBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu..."
          placeholderTextColor="#e0b97f80"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Dietary Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        <Chip
          selected={dietaryFilters.isVegetarian}
          onPress={() =>
            setDietaryFilters((prev) => ({
              ...prev,
              isVegetarian: !prev.isVegetarian,
            }))
          }
          style={[
            styles.filterChip,
            dietaryFilters.isVegetarian && styles.filterChipSelected,
          ]}
          textStyle={styles.filterChipText}
          icon="leaf"
        >
          Vegetarian
        </Chip>
        <Chip
          selected={dietaryFilters.isVegan}
          onPress={() =>
            setDietaryFilters((prev) => ({
              ...prev,
              isVegan: !prev.isVegan,
            }))
          }
          style={[
            styles.filterChip,
            dietaryFilters.isVegan && styles.filterChipSelected,
          ]}
          textStyle={styles.filterChipText}
          icon="sprout"
        >
          Vegan
        </Chip>
        <Chip
          selected={dietaryFilters.isGlutenFree}
          onPress={() =>
            setDietaryFilters((prev) => ({
              ...prev,
              isGlutenFree: !prev.isGlutenFree,
            }))
          }
          style={[
            styles.filterChip,
            dietaryFilters.isGlutenFree && styles.filterChipSelected,
          ]}
          textStyle={styles.filterChipText}
          icon="wheat-off"
        >
          Gluten-Free
        </Chip>
        <Chip
          selected={dietaryFilters.isSpicy}
          onPress={() =>
            setDietaryFilters((prev) => ({
              ...prev,
              isSpicy: !prev.isSpicy,
            }))
          }
          style={[
            styles.filterChip,
            dietaryFilters.isSpicy && styles.filterChipSelected,
          ]}
          textStyle={styles.filterChipText}
          icon="chili-hot"
        >
          Spicy
        </Chip>
        {(dietaryFilters.isVegetarian ||
          dietaryFilters.isVegan ||
          dietaryFilters.isGlutenFree ||
          dietaryFilters.isSpicy) && (
          <Chip
            onPress={() =>
              setDietaryFilters({
                isVegetarian: false,
                isVegan: false,
                isGlutenFree: false,
                isSpicy: false,
              })
            }
            style={styles.clearFilterChip}
            textStyle={styles.filterChipText}
            icon="close"
          >
            Clear
          </Chip>
        )}
      </ScrollView>

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
          <View style={styles.categoryBarContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryBarContent}
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
                    style={[
                      styles.categoryButtonText,
                      selectedCategory === category.id && {
                        color: colors.onPrimary,
                        fontWeight: "700",
                        opacity: 1,
                      },
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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
                    onPress={() => category?.id && toggleCategory(category.id)}
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
                        {category?.id &&
                        expandedCategories.includes(category.id)
                          ? "▼"
                          : "▶"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

                {selectedCategory !== "all"
                  ? // When specific category is selected, show items directly
                    items.map((item) => (
                      <Card key={item.id} style={styles.menuCard}>
                        <Card.Title
                          title={item.name}
                          subtitle={`€${item.price.toFixed(2)}`}
                          right={() => (
                            <TouchableOpacity
                              onPress={() => toggleFavorite(item.id)}
                              style={{ marginRight: 8 }}
                            >
                              <Text style={{ fontSize: 24 }}>
                                {isFavorite(item.id) ? "❤️" : "🤍"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        />
                        <Card.Content>
                          <Text style={{ color: colors.onBackground }}>
                            {item.description}
                          </Text>
                          <DietaryBadges item={item} />
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
                  : expandedCategories.includes(category?.id ?? "") && (
                      <View>
                        {items.map((item) => (
                          <Card key={item.id} style={styles.menuCard}>
                            <Card.Title
                              title={item.name}
                              subtitle={`€${item.price.toFixed(2)}`}
                              right={() => (
                                <TouchableOpacity
                                  onPress={() => toggleFavorite(item.id)}
                                  style={{ marginRight: 8 }}
                                >
                                  <Text style={{ fontSize: 24 }}>
                                    {isFavorite(item.id) ? "❤️" : "🤍"}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            />
                            <Card.Content>
                              <Text style={{ color: colors.onBackground }}>
                                {item.description}
                              </Text>
                              <DietaryBadges item={item} />
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
                      </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#2d2117",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fffbe8",
    borderWidth: 1,
    borderColor: "#e0b97f40",
  },
  filtersContainer: {
    marginBottom: 12,
    flexGrow: 0,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#2d2117",
    marginRight: 8,
    borderColor: "#e0b97f40",
    borderWidth: 1,
  },
  filterChipSelected: {
    backgroundColor: "#e0b97f",
    borderColor: "#e0b97f",
  },
  filterChipText: {
    color: "#fffbe8",
    fontSize: 13,
  },
  clearFilterChip: {
    backgroundColor: "#d32f2f20",
    borderColor: "#d32f2f",
    borderWidth: 1,
    marginRight: 8,
  },
  categoryBar: {
    flexGrow: 0,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBarContainer: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  categoryBarContent: {
    alignItems: "center",
    paddingVertical: 4,
    paddingRight: 8,
  },
  categoryButton: {
    paddingHorizontal: 18,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#2d2117",
    borderWidth: 2,
    borderColor: "#fffbe8", // Lighter border for visibility
    justifyContent: "center",
    alignItems: "center",
  },
  categoryButtonText: {
    fontSize: 16,
    color: "#fffbe8",
    letterSpacing: 0.5,
    fontWeight: "500",
    opacity: 0.8,
    lineHeight: 20,
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
  dietaryBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  dietaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  dietaryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
});

export default MenuScreen;
