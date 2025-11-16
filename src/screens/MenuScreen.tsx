import React, { useState, useRef, useEffect, useCallback } from "react";
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
  ImageBackground,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import ENV from "../config/env";
import { MenuItem } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";

const MenuScreen = () => {
  const { colors } = useTheme();
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryRefs = useRef<{ [key: string]: View | null }>({});
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [menuCategories, setMenuCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const [committedSearchQuery, setCommittedSearchQuery] = useState<string>("");
  const [isSearchPending, setIsSearchPending] = useState<boolean>(false);
  type DietaryFilterKey =
    | "isVegetarian"
    | "isVegan"
    | "isGlutenFree"
    | "isSpicy";

  const [dietaryFilters, setDietaryFilters] = useState<
    Record<DietaryFilterKey, boolean>
  >({
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isSpicy: false,
  });
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    if (
      Platform.OS === "android" &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const commitSearch = useCallback((value: string) => {
    setCommittedSearchQuery(value.trim());
    setIsSearchPending(false);
  }, []);

  const triggerImmediateSearch = useCallback(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    commitSearch(searchInput);
  }, [searchInput, commitSearch]);

  // Debounce search query with a friendlier delay and indicator
  useEffect(() => {
    const trimmed = searchInput.trim();

    if (!trimmed) {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
      commitSearch("");
      setIsSearchPending(false);
      return;
    }

    setIsSearchPending(true);
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      commitSearch(searchInput);
      searchTimerRef.current = null;
    }, 2000);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = null;
      }
    };
  }, [searchInput, commitSearch]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all menu items with language parameter
        const lang = currentLanguage === 'en' ? 'en' : 'de';
        const url = `${ENV.API_URL}/menu?lang=${lang}`;

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
  }, [t, currentLanguage]); // Re-fetch when language changes

  // Auto-expand categories when searching
  useEffect(() => {
    if (committedSearchQuery.trim()) {
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
  }, [committedSearchQuery, menuCategories, menuItems]);

  // Client-side filtering for better UX (no page reload)
  const getFilteredItems = () => {
    let filtered = menuItems;

    // Apply search filter (client-side)
    if (committedSearchQuery.trim()) {
      const searchLower = committedSearchQuery.toLowerCase();
      filtered = filtered.filter((item) => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

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
  const activeFilterCount = Object.values(dietaryFilters).filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  const toggleDietaryFilter = (key: DietaryFilterKey) => {
    setDietaryFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clearDietaryFilters = () =>
    setDietaryFilters({
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isSpicy: false,
    });

  const filterOptions: Array<{
    key: DietaryFilterKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }> = [
    { key: "isVegetarian", label: t("menu.vegetarian"), icon: "leaf-outline" },
    { key: "isVegan", label: t("menu.vegan"), icon: "nutrition" },
    { key: "isGlutenFree", label: t("menu.glutenFree"), icon: "restaurant-outline" },
    { key: "isSpicy", label: t("menu.spicy"), icon: "flame-outline" },
  ];

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
            committedSearchQuery.trim() ? items.length > 0 : true
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

  const renderMenuItemCard = (item: MenuItem, categoryLabel?: string) => (
    <Card key={item.id} style={styles.menuCard}>
      {item.imageUrl && (
        <ImageBackground
          source={{ uri: item.imageUrl }}
          style={styles.menuCardImage}
          imageStyle={styles.menuCardImageRadius}
          resizeMode="cover"
        >
          <View style={styles.menuCardImageOverlay} />
          {categoryLabel ? (
            <View style={styles.menuCardImageChip}>
              <Text style={styles.menuCardImageChipText}>{categoryLabel}</Text>
            </View>
          ) : null}
        </ImageBackground>
      )}
      <Card.Title
        title={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{ fontSize: 16, fontWeight: "600", color: colors.onBackground }}
            >
              {item.name}
            </Text>
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
          <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={{ marginRight: 8 }}>
            <Text style={{ fontSize: 24 }}>{isFavorite(item.id) ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        )}
      />
      <Card.Content>
        <Text style={{ color: colors.onBackground }}>{item.description}</Text>
        <DietaryBadges item={item} />
        <TouchableOpacity
          style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
          onPress={() =>
            addToCart({
              menuItemId: item.id,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl ?? null,
            })
          }
        >
          <Text style={[styles.addToCartButtonText, { color: colors.onPrimary }]}>
            {t("menu.addToCart")}
          </Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

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
    <>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
      <Text style={styles.title}>{t("menu.title")}</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder={t("menu.search")}
            placeholderTextColor="#e0b97f80"
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={triggerImmediateSearch}
          />
          <TouchableOpacity
            style={[
              styles.searchButton,
              isSearchPending && styles.searchButtonPending,
              (!searchInput.trim() && !committedSearchQuery) && styles.searchButtonDisabled,
              isSearchPending && styles.searchButtonDisabled,
            ]}
            onPress={triggerImmediateSearch}
            disabled={
              isSearchPending || (!searchInput.trim() && !committedSearchQuery)
            }
          >
            {isSearchPending ? (
              <>
                <ActivityIndicator size="small" color="#1a120b" />
                <Text style={styles.searchButtonText}>{t("menu.searching")}</Text>
              </>
            ) : (
              <Text style={styles.searchButtonText}>{t("common.search")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Button Placeholder (chips moved into modal) */}

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
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={[
                  styles.filterIconButton,
                  hasActiveFilters && styles.filterIconButtonActive,
                ]}
                onPress={() => setFilterModalVisible(true)}
              >
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={hasActiveFilters ? "#1a120b" : "#fffbe8"}
                />
                {hasActiveFilters && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
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
                  ? items.map((item) => renderMenuItemCard(item, category?.name))
                  : expandedCategories.includes(category?.id ?? "") && (
                      <View>
                        {items.map((item) => renderMenuItemCard(item, category?.name))}
                      </View>
                    )}
              </View>
            ))}
          </ScrollView>
        </>
      )}
      </SafeAreaView>
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>{t("menu.filters")}</Text>
            <View style={styles.filterOptionsContainer}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.filterOption,
                    dietaryFilters[option.key] && styles.filterOptionActive,
                  ]}
                  onPress={() => toggleDietaryFilter(option.key)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={dietaryFilters[option.key] ? "#1a120b" : "#fffbe8"}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      dietaryFilters[option.key] && styles.filterOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterModalActions}>
              <TouchableOpacity
                style={styles.filterModalActionSecondary}
                onPress={clearDietaryFilters}
              >
                <Text style={styles.filterModalActionText}>{t("common.clear")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filterModalActionPrimary}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.filterModalActionTextDark}>{t("common.apply")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
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
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  // ============================================================================
  // SEARCH INPUT - The actual text input field where users type
  // ============================================================================
  searchInput: {
    flex: 1,
    backgroundColor: "#2d2117",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#fffbe8",
    borderWidth: 1,
    borderColor: "#e0b97f40",
  },

  // ============================================================================
  // SEARCH BUTTON - Manual trigger button
  // ============================================================================
  searchButton: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12, // Rounded button corners
    backgroundColor: "#e0b97f", // Gold background to stand out
    minWidth: 96,
  },

  searchButtonPending: {
    opacity: 0.9,
  },

  searchButtonDisabled: {
    opacity: 0.5,
  },

  // ============================================================================
  // SEARCH BUTTON TEXT - Text for manual trigger
  // ============================================================================
  searchButtonText: {
    color: "#1a120b", // Dark text for contrast on gold
    fontWeight: "700", // Bold for better readability
    letterSpacing: 0.5, // Slight letter spacing for polish
    textTransform: "uppercase", // Make it feel like an action button
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  filterIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#fffbe8",
    backgroundColor: "#2d2117",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  filterIconButtonActive: {
    backgroundColor: "#e0b97f",
    borderColor: "#e0b97f",
  },

  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#1a120b",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  filterBadgeText: {
    color: "#fffbe8",
    fontSize: 11,
    fontWeight: "700",
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

  categoryScroll: {
    flex: 1,
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

  modalWrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },

  filterModal: {
    backgroundColor: "#2d2117",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e0b97f40",
  },

  filterModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fffbe8",
    marginBottom: 16,
    textAlign: "center",
  },

  filterOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },

  filterOption: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#3a2b1f",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e0b97f20",
  },

  filterOptionActive: {
    backgroundColor: "#e0b97f",
    borderColor: "#e0b97f",
  },

  filterOptionText: {
    marginLeft: 10,
    color: "#fffbe8",
    fontWeight: "600",
  },

  filterOptionTextActive: {
    color: "#1a120b",
  },

  filterModalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },

  filterModalActionSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#fffbe8",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  filterModalActionPrimary: {
    flex: 1,
    backgroundColor: "#e0b97f",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  filterModalActionText: {
    color: "#fffbe8",
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  filterModalActionTextDark: {
    color: "#1a120b",
    fontWeight: "700",
    letterSpacing: 0.5,
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
  menuCardImage: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
    overflow: "hidden",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuCardImageRadius: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  menuCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  menuCardImageChip: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  menuCardImageChipText: {
    color: "#fffbe8",
    fontSize: 12,
    fontWeight: "600",
  },
  addToCartButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
  },
  addToCartButtonText: {
    fontWeight: "bold",
    letterSpacing: 0.5,
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
