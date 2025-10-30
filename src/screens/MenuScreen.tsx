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
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, useTheme, Chip } from "react-native-paper";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import ENV from "../config/env";
import { MenuItem } from "../types";
import { useTranslation } from "../hooks/useTranslation";

const MenuScreen = () => {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();

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

        // Only pass search query to API - do filtering client-side for better UX
        const params = new URLSearchParams();
        if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);

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
        setMenuCategories([{ id: "all", name: t("menu.allCategories") }, ...categories]);
        setMenuItems(items);
      } catch (err) {
        setError((err as Error).message || "Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [debouncedSearchQuery, t]);

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

  // Client-side filtering for better UX (no page reload)
  const getFilteredItems = () => {
    let filtered = menuItems;

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply dietary filters
    if (dietaryFilters.isVegetarian) {
      filtered = filtered.filter((item) => item.isVegetarian);
    }
    if (dietaryFilters.isVegan) {
      filtered = filtered.filter((item) => item.isVegan);
    }
    if (dietaryFilters.isGlutenFree) {
      filtered = filtered.filter((item) => item.isGlutenFree);
    }
    if (dietaryFilters.isSpicy) {
      filtered = filtered.filter((item) => item.isSpicy);
    }

    return filtered;
  };

  const filteredItems = getFilteredItems();

  // If 'all' is selected, group items by category
  const itemsToShow =
    selectedCategory === "all"
      ? menuCategories
          .filter((c: { id: string; name: string }) => c.id !== "all")
          .map((category: { id: string; name: string }) => ({
            category,
            items: filteredItems.filter(
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
            items: filteredItems.filter(
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <Text style={styles.title}>{t("menu.title")}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t("menu.search")}
          placeholderTextColor="#e0b97f80"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Dietary Filters */}
      <View style={styles.filtersContainer}>
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
          {t("menu.vegetarian")}
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
          {t("menu.vegan")}
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
          icon="barley-off"
        >
          {t("menu.glutenFree")}
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
          {t("menu.spicy")}
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
            {t("common.clear")}
          </Chip>
        )}
      </View>

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
                          title={
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onBackground }}>{item.name}</Text>
                              {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
                                <View style={styles.bonusPointsBadge}>
                                  <Text style={styles.bonusPointsText}>
                                    🌟 {item.loyaltyPointsMultiplier}x Points
                                  </Text>
                                </View>
                              )}
                            </View>
                          }
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
                              {t("menu.addToCart")}
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
                              title={
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.onBackground }}>{item.name}</Text>
                                  {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
                                    <View style={styles.bonusPointsBadge}>
                                      <Text style={styles.bonusPointsText}>
                                        🌟 {item.loyaltyPointsMultiplier}x Points
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              }
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
                                  {t("menu.addToCart")}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ============================================================================
  // MAIN CONTAINER - The entire Menu screen wrapper
  // ============================================================================
  container: {
    flex: 1, // Takes full available screen height
    paddingTop: 8, // Small padding from SafeAreaView edge (SafeAreaView handles status bar)
    backgroundColor: "#231a13", // Very dark brown background - main screen color
  },

  // ============================================================================
  // SCREEN TITLE - "Menu" text at the top
  // ============================================================================
  title: {
    fontSize: 32, // Large text for main heading
    fontWeight: "bold", // Makes text thick/bold
    marginBottom: 12, // Space between title and search bar below
    alignSelf: "center", // Centers horizontally on screen
    color: "#fffbe8", // Light cream/yellowish color for text
    letterSpacing: 1, // Adds 1px space between each letter for elegance
    textShadowColor: "#1a120b", // Very dark shadow behind text
    textShadowOffset: { width: 1, height: 1 }, // Shadow positioned 1px right and 1px down
    textShadowRadius: 2, // How blurry the shadow is (2px blur)
  },

  // ============================================================================
  // SEARCH BAR - Container wrapping the search input field
  // ============================================================================
  searchContainer: {
    paddingHorizontal: 16, // 16px padding on left and right sides
    marginBottom: 12, // Space between search bar and dietary filters below
  },

  // ============================================================================
  // SEARCH INPUT - The actual text input field where users type
  // ============================================================================
  searchInput: {
    backgroundColor: "#2d2117", // Slightly lighter brown than main background
    borderRadius: 12, // Rounded corners (12px radius)
    paddingHorizontal: 16, // Inner spacing left/right for text inside input
    paddingVertical: 12, // Inner spacing top/bottom for text inside input
    fontSize: 16, // Size of text when user types
    color: "#fffbe8", // Color of text user types (light cream)
    borderWidth: 1, // 1px border around the input
    borderColor: "#e0b97f40", // Gold/tan border color with 40 transparency (hex alpha)
  },

  // ============================================================================
  // DIETARY FILTERS - Wrapping container for filter chips
  // Used by: View wrapping all dietary filter chips (Vegetarian, Vegan, etc.)
  // ============================================================================
  filtersContainer: {
    flexDirection: "row", // Arranges chips in a row
    flexWrap: "wrap", // Allows chips to wrap to next line if needed
    paddingHorizontal: 16, // Padding on left/right sides
    marginBottom: 12, // Space between filters and category buttons below
    gap: 8, // 8px space between each chip
  },

  // ============================================================================
  // FILTER CHIPS CONTENT - Inner wrapper for filter chips (DEPRECATED - no longer used)
  // ============================================================================
  filtersContent: {
    paddingHorizontal: 16, // Padding on left/right sides of chips row
    gap: 8, // 8px space between each chip (modern React Native feature)
  },

  // ============================================================================
  // FILTER CHIP - Individual filter button (Vegetarian, Vegan, etc.) - UNSELECTED
  // ============================================================================
  filterChip: {
    backgroundColor: "#2d2117", // Dark brown background when not selected
    marginRight: 8, // Space to the right of each chip
    borderColor: "#e0b97f40", // Semi-transparent gold border
    borderWidth: 1, // 1px border thickness
  },

  // ============================================================================
  // FILTER CHIP SELECTED - Individual filter button when ACTIVE/SELECTED
  // ============================================================================
  filterChipSelected: {
    backgroundColor: "#e0b97f", // Gold/tan background when selected
    borderColor: "#e0b97f", // Solid gold border when selected
  },

  // ============================================================================
  // FILTER CHIP TEXT - Text inside filter chips (all states)
  // ============================================================================
  filterChipText: {
    color: "#fffbe8", // Light cream text color
    fontSize: 13, // Small text for compact chips
  },

  // ============================================================================
  // CLEAR FILTER CHIP - The "Clear" button that appears when filters active
  // ============================================================================
  clearFilterChip: {
    backgroundColor: "#d32f2f20", // Red background with 20 transparency
    borderColor: "#d32f2f", // Solid red border
    borderWidth: 1, // 1px border
    marginRight: 8, // Space to the right
  },

  // ============================================================================
  // CATEGORY BAR - Legacy style (might not be used, check categoryBarContainer)
  // ============================================================================
  categoryBar: {
    flexGrow: 0, // Prevents expansion
    marginBottom: 12, // Space below
    paddingHorizontal: 8, // Left/right padding
    paddingVertical: 4, // Top/bottom padding
  },

  // ============================================================================
  // CATEGORY BAR CONTAINER - Wrapper for horizontal category buttons (All, Pizzas, etc.)
  // ============================================================================
  categoryBarContainer: {
    height: 60, // Fixed height of 60px for category button row
    justifyContent: "center", // Centers content vertically within 60px height
    paddingHorizontal: 8, // Left/right padding
    marginBottom: 12, // Space between category bar and menu items below
  },

  // ============================================================================
  // CATEGORY BAR CONTENT - Inner content wrapper for ScrollView of categories
  // ============================================================================
  categoryBarContent: {
    alignItems: "center", // Centers items vertically in ScrollView
    paddingVertical: 4, // Top/bottom padding
    paddingRight: 8, // Extra padding on right side
  },

  // ============================================================================
  // CATEGORY BUTTON - Individual category pill button (All, Pizzas, Pasta, etc.)
  // ============================================================================
  categoryButton: {
    paddingHorizontal: 18, // Left/right inner spacing
    height: 44, // Fixed button height
    borderRadius: 22, // Half of height (44/2) = perfect pill shape
    marginRight: 10, // Space between category buttons
    backgroundColor: "#2d2117", // Dark brown background (unselected state)
    borderWidth: 2, // 2px border thickness
    borderColor: "#fffbe8", // Light cream border
    justifyContent: "center", // Centers text vertically
    alignItems: "center", // Centers text horizontally
  },

  // ============================================================================
  // CATEGORY BUTTON TEXT - Text inside category buttons
  // ============================================================================
  categoryButtonText: {
    fontSize: 16, // Medium text size
    color: "#fffbe8", // Light cream color
    letterSpacing: 0.5, // Slight letter spacing for readability
    fontWeight: "500", // Medium font weight (between normal and bold)
    opacity: 0.8, // 80% opacity for unselected state
    lineHeight: 20, // Height of each line of text
  },

  // ============================================================================
  // CATEGORY SECTION - Wrapper for each category group (title + items)
  // ============================================================================
  categorySection: {
    marginBottom: 32, // Large space between different category sections
  },

  // ============================================================================
  // CATEGORY TITLE - The category name header (e.g., "Pizzas", "Pasta")
  // ============================================================================
  categoryTitle: {
    fontSize: 22, // Large heading size
    fontWeight: "bold", // Bold text
    marginBottom: 10, // Space between title and first menu item
    color: "#fffbe8", // Light cream color
    letterSpacing: 0.5, // Slight letter spacing
    textShadowColor: "#1a120b", // Very dark shadow
    textShadowOffset: { width: 1, height: 1 }, // Shadow 1px right and down
    textShadowRadius: 1, // 1px shadow blur
  },

  // ============================================================================
  // MENU LIST - ScrollView content container holding all menu items
  // ============================================================================
  menuList: {
    padding: 16, // Padding on all sides (top, right, bottom, left)
  },

  // ============================================================================
  // MENU CARD - Individual menu item card (each dish/food item)
  // ============================================================================
  menuCard: {
    marginBottom: 16, // Space between each menu card
    backgroundColor: "#2d2117", // Dark brown card background
    borderRadius: 16, // Rounded corners (16px radius)
    borderWidth: 1, // 1px border
    borderColor: "#e0b97f", // Gold/tan border
    shadowColor: "#000", // Black shadow
    shadowOffset: { width: 0, height: 2 }, // Shadow 0px horizontal, 2px down
    shadowOpacity: 0.15, // 15% shadow opacity (very subtle)
    shadowRadius: 6, // 6px shadow blur
    elevation: 3, // Android shadow depth (3 units)
    minHeight: 84, // Minimum card height 84px
  },

  // ============================================================================
  // DIETARY BADGES CONTAINER - Row of dietary badges (V, VG, GF, 🌶)
  // ============================================================================
  dietaryBadgesContainer: {
    flexDirection: "row", // Arrange badges horizontally
    flexWrap: "wrap", // Allow badges to wrap to next line if too many
    gap: 6, // 6px space between each badge
    marginTop: 8, // Space above badges (below description)
  },

  // ============================================================================
  // DIETARY BADGE - Individual badge pill (Vegetarian, Vegan, etc.)
  // ============================================================================
  dietaryBadge: {
    paddingHorizontal: 8, // Left/right inner padding
    paddingVertical: 4, // Top/bottom inner padding
    borderRadius: 12, // Rounded pill shape
    borderWidth: 1, // 1px border (color set dynamically in component)
    // backgroundColor and borderColor are set dynamically in the component code
  },

  // ============================================================================
  // DIETARY BADGE TEXT - Text inside badges (V, VG, GF, 🌶)
  // ============================================================================
  dietaryBadgeText: {
    fontSize: 11, // Small text for compact badges
    fontWeight: "600", // Semi-bold text
    // color is set dynamically in the component code
  },

  // ============================================================================
  // BONUS POINTS BADGE - Badge showing loyalty points multiplier
  // ============================================================================
  bonusPointsBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#f57c00",
  },

  // ============================================================================
  // BONUS POINTS TEXT - Text inside loyalty points badge
  // ============================================================================
  bonusPointsText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default MenuScreen;
