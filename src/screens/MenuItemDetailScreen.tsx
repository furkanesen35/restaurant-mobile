import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  ActivityIndicator,
  Alert,
  TextInput,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../hooks/useFavorites";
import { useTranslation } from "../hooks/useTranslation";
import { useLanguage } from "../contexts/LanguageContext";
import { MenuItem, MenuItemModifier, SelectedModifier } from "../types";
import ENV from "../config/env";
import logger from "../utils/logger";

type RouteParams = {
  item: MenuItem;
};

// Get screen dimensions for responsive sizing
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = Math.min(280, SCREEN_HEIGHT * 0.3); // Max 280px or 30% of screen

const MenuItemDetailScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params as RouteParams;
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const { currentLanguage } = useLanguage();

  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);
  const [groupedModifiers, setGroupedModifiers] = useState<{
    additions: MenuItemModifier[];
    removals: MenuItemModifier[];
    preparations: MenuItemModifier[];
  }>({ additions: [], removals: [], preparations: [] });
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [selectedPreparation, setSelectedPreparation] = useState<number | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  
  // Ingredient state
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [ingredientCustomizations, setIngredientCustomizations] = useState<Record<number, number>>({});
  
  // Cooking preferences state
  const [hasCookingOptions, setHasCookingOptions] = useState(false);
  const [allowedCookingPreferences, setAllowedCookingPreferences] = useState<string[]>([]);
  const [selectedCookingPreference, setSelectedCookingPreference] = useState<string | null>(null);
  const [cookingNotes, setCookingNotes] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch modifiers and ingredients for this item
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch modifiers
        const modifiersResponse = await fetch(
          `${ENV.API_URL}/api/modifiers/menu-item/${item.id}`
        );
        if (modifiersResponse.ok) {
          const modifiersData = await modifiersResponse.json();
          setModifiers(modifiersData.modifiers || []);
          
          // Handle grouped response
          if (modifiersData.grouped) {
            setGroupedModifiers({
              additions: modifiersData.grouped.additions || [],
              removals: modifiersData.grouped.removals || [],
              preparations: modifiersData.grouped.preparations || []
            });
          } else {
            // Fallback for old API response
            setGroupedModifiers({
              additions: modifiersData.modifiers || [],
              removals: [],
              preparations: []
            });
          }
        }
        
        // Fetch ingredients
        const ingredientsResponse = await fetch(
          `${ENV.API_URL}/api/menu-item-ingredients/menu-item/${item.id}`
        );
        if (ingredientsResponse.ok) {
          const ingredientsData = await ingredientsResponse.json();
          setIngredients(ingredientsData.ingredients || []);
          
          // Initialize ingredient customizations with default quantities
          const defaultCustomizations: Record<number, number> = {};
          (ingredientsData.ingredients || []).forEach((ing: any) => {
            defaultCustomizations[ing.ingredientId] = ing.defaultQuantity;
          });
          setIngredientCustomizations(defaultCustomizations);
        }
        
        // Set cooking options from menu item
        setHasCookingOptions((item as any).hasCookingOptions || false);
        setAllowedCookingPreferences((item as any).allowedCookingPreferences || []);
        
      } catch (err) {
        logger.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [item]);

  // Get localized name for modifier
  const getModifierName = (modifier: MenuItemModifier) => {
    if (currentLanguage === "en" && modifier.nameEn) {
      return modifier.nameEn;
    }
    if (currentLanguage === "de" && modifier.nameDe) {
      return modifier.nameDe;
    }
    return modifier.name;
  };

  const handleToggleRemoval = (modifierId: number) => {
    const existingIndex = selectedModifiers.findIndex(
      (m) => m.modifierId === modifierId
    );
    
    if (existingIndex >= 0) {
      setSelectedModifiers(selectedModifiers.filter((_, i) => i !== existingIndex));
    } else {
      const modifier = groupedModifiers.removals.find((m) => m.id === modifierId);
      if (modifier) {
        setSelectedModifiers([
          ...selectedModifiers,
          {
            modifierId,
            quantity: 1,
            name: getModifierName(modifier),
            price: 0,
          },
        ]);
      }
    }
  };

  const handleSelectPreparation = (modifierId: number) => {
    // Remove any existing preparation
    const withoutPreparations = selectedModifiers.filter(
      (m) => !groupedModifiers.preparations.some((p) => p.id === m.modifierId)
    );
    
    // Add the new preparation if different from current
    if (selectedPreparation !== modifierId) {
      const modifier = groupedModifiers.preparations.find((m) => m.id === modifierId);
      if (modifier) {
        setSelectedModifiers([
          ...withoutPreparations,
          {
            modifierId,
            quantity: 1,
            name: getModifierName(modifier),
            price: 0,
          },
        ]);
        setSelectedPreparation(modifierId);
      }
    } else {
      // Deselect if clicking the same one
      setSelectedModifiers(withoutPreparations);
      setSelectedPreparation(null);
    }
  };


  // Handle modifier quantity change
  const updateModifierQuantity = (modifierId: number, delta: number) => {
    const modifier = modifiers.find((m) => m.id === modifierId);
    if (!modifier) return;

    setSelectedModifiers((prev) => {
      const existing = prev.find((m) => m.modifierId === modifierId);
      const currentQty = existing?.quantity || 0;
      const newQty = Math.max(0, Math.min(currentQty + delta, modifier.maxQuantity));

      if (newQty === 0) {
        return prev.filter((m) => m.modifierId !== modifierId);
      }

      if (existing) {
        return prev.map((m) =>
          m.modifierId === modifierId ? { ...m, quantity: newQty } : m
        );
      }

      return [...prev, { modifierId, quantity: newQty }];
    });
  };

  // Get selected quantity for a modifier
  const getModifierQuantity = (modifierId: number) => {
    return selectedModifiers.find((m) => m.modifierId === modifierId)?.quantity || 0;
  };

  // Ingredient handlers
  const handleIngredientQuantityChange = (ingredientId: number, delta: number) => {
    setIngredientCustomizations((prev) => {
      const currentQty = prev[ingredientId] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [ingredientId]: newQty };
    });
  };

  const getIngredientName = (ingredient: any) => {
    if (currentLanguage === "en" && ingredient.nameEn) {
      return ingredient.nameEn;
    }
    if (currentLanguage === "de" && ingredient.nameDe) {
      return ingredient.nameDe;
    }
    return ingredient.name;
  };

  // Calculate total price including ingredients
  const calculateTotal = () => {
    const basePrice = item.price * quantity;
    
    // Modifiers price
    const modifiersPrice = selectedModifiers.reduce((sum, sel) => {
      const modifier = modifiers.find((m) => m.id === sel.modifierId);
      return sum + (modifier?.price || 0) * sel.quantity;
    }, 0);
    
    // Ingredients price (only charge for EXTRA quantities beyond default)
    const ingredientsPrice = ingredients.reduce((sum, ing) => {
      const defaultQty = ing.defaultQuantity;
      const currentQty = ingredientCustomizations[ing.ingredientId] || 0;
      const extraQty = Math.max(0, currentQty - defaultQty);
      return sum + (extraQty * ing.pricePerUnit);
    }, 0);
    
    return basePrice + (modifiersPrice + ingredientsPrice) * quantity;
  };

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      setAddingToCart(true);
      
      // Build modifiers array with names and prices for display
      const modifiersWithDetails = selectedModifiers.map((sel) => {
        const mod = modifiers.find((m) => m.id === sel.modifierId);
        return {
          modifierId: sel.modifierId,
          quantity: sel.quantity,
          name: mod ? getModifierName(mod) : "",
          price: mod?.price || 0,
        };
      });

      logger.log("[MenuItemDetailScreen] Adding to cart:", {
        menuItemId: item.id,
        name: item.name,
        quantity,
        selectedModifiers,
        modifiersWithDetails,
        ingredientCustomizations,
        cookingPreference: selectedCookingPreference,
        cookingNotes,
      });

      // Prepare ingredient customizations array
      const ingredientCustomizationsArray = Object.entries(ingredientCustomizations)
        .map(([ingredientId, qty]) => ({
          ingredientId: parseInt(ingredientId),
          quantity: qty,
        }))
        .filter((custom) => {
          // Only send if quantity differs from default
          const ing = ingredients.find((i) => i.ingredientId === custom.ingredientId);
          return ing && custom.quantity !== ing.defaultQuantity;
        });

      await addToCart({
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl ?? null,
        quantity,
        modifiers: modifiersWithDetails,
        specialInstructions: specialInstructions.trim() || undefined,
        ingredientCustomizations: ingredientCustomizationsArray.length > 0 ? ingredientCustomizationsArray : undefined,
        cookingPreference: selectedCookingPreference || undefined,
        cookingNotes: cookingNotes.trim() || undefined,
      });

      Alert.alert(
        t("cart.title"),
        t("cart.itemAdded"),
        [
          { text: t("cart.continueShopping"), style: "cancel" },
          {
            text: t("cart.goToCart"),
            onPress: () => {
              logger.info("[MenuItemDetail] Go to Cart button pressed");
              // Navigate to MainTabs Cart screen directly (will dismiss this screen)
              // @ts-expect-error - Navigation typing
              navigation.navigate("MainTabs", { screen: "Cart" });
            },
          },
        ]
      );
    } catch (error: any) {
      const code = error?.code || error?.message;
      const statusCode = error?.statusCode;
      if (code === "LOGIN_REQUIRED" || statusCode === 401) {
        Alert.alert(t("auth.login"), t("cart.loginRequired"));
        return;
      }
      Alert.alert(t("common.error"), t("cart.updateFailed"));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite(item.id);
    } catch (error: any) {
      const statusCode = error?.statusCode;
      const code = error?.code;
      if (code === "LOGIN_REQUIRED" || statusCode === 401) {
        Alert.alert(t("auth.login"), t("cart.loginRequired"));
      }
    }
  };

  const DietaryBadges = () => {
    const badges = [];
    if (item.isVegetarian)
      badges.push({ icon: "leaf", label: t("menu.vegetarian"), color: "#4caf50" });
    if (item.isVegan)
      badges.push({ icon: "nutrition", label: t("menu.vegan"), color: "#66bb6a" });
    if (item.isGlutenFree)
      badges.push({ icon: "restaurant", label: t("menu.glutenFree"), color: "#ff9800" });
    if (item.isSpicy)
      badges.push({ icon: "flame", label: t("menu.spicy"), color: "#f44336" });

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
            <Ionicons name={badge.icon as any} size={14} color={badge.color} />
            <Text style={[styles.dietaryBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fffbe8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={handleToggleFavorite}
          >
            <Text style={{ fontSize: 28 }}>
              {isFavorite(item.id) ? "❤️" : "🤍"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Image */}
        {item.imageUrl ? (
          <ImageBackground
            source={{ uri: item.imageUrl }}
            style={[styles.imageHero, { height: IMAGE_HEIGHT }]}
            imageStyle={styles.imageRadius}
            resizeMode="cover"
          >
            <View style={styles.imageOverlay} />
          </ImageBackground>
        ) : (
          <View style={[styles.imageHero, styles.imagePlaceholder, { height: IMAGE_HEIGHT }]}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}

        {/* Item Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>€{item.price.toFixed(2)}</Text>
          </View>

          {item.description && (
            <Text style={styles.itemDescription}>{item.description}</Text>
          )}

          <DietaryBadges />

          {item.loyaltyPointsMultiplier && item.loyaltyPointsMultiplier > 1.0 && (
            <View style={styles.bonusPointsBadge}>
              <Text style={styles.bonusPointsText}>
                🌟 {item.loyaltyPointsMultiplier}x {t("profile.loyaltyPoints")}
              </Text>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>{t("cart.quantity")}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Ionicons name="remove" size={20} color="#231a13" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Ionicons name="add" size={20} color="#231a13" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients & Modifiers Section */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>{t("common.loading")}</Text>
            </View>
          ) : (
            <>
              {/* Ingredients Section */}
              {ingredients.length > 0 && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("ingredients.title") || "Ingredients"}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    {t("ingredients.subtitle") || "Customize quantities (extra charges apply)"}
                  </Text>
                  {ingredients.map((ing) => {
                    const currentQty = ingredientCustomizations[ing.ingredientId] || 0;
                    const defaultQty = ing.defaultQuantity;
                    const extraQty = Math.max(0, currentQty - defaultQty);
                    const extraCost = extraQty * ing.pricePerUnit;
                    
                    return (
                      <View key={ing.ingredientId} style={styles.ingredientRow}>
                        <View style={styles.ingredientInfo}>
                          <Text style={styles.ingredientName}>
                            {getIngredientName(ing)}
                          </Text>
                          <Text style={[styles.ingredientPrice, { color: extraCost > 0 ? "#e0b97f" : "#999" }]}>
                            {extraCost > 0 
                              ? `+€${extraCost.toFixed(2)}` 
                              : `€${ing.pricePerUnit.toFixed(2)}/extra`
                            }
                          </Text>
                        </View>
                        <View style={styles.ingredientControls}>
                          <TouchableOpacity
                            style={[
                              styles.ingredientBtn,
                              currentQty === 0 && styles.ingredientBtnDisabled,
                            ]}
                            onPress={() => handleIngredientQuantityChange(ing.ingredientId, -1)}
                            disabled={currentQty === 0}
                          >
                            <Ionicons
                              name="remove"
                              size={16}
                              color={currentQty === 0 ? "#666" : "#231a13"}
                            />
                          </TouchableOpacity>
                          <Text style={styles.ingredientQty}>{currentQty}</Text>
                          <TouchableOpacity
                            style={styles.ingredientBtn}
                            onPress={() => handleIngredientQuantityChange(ing.ingredientId, 1)}
                          >
                            <Ionicons name="add" size={16} color="#231a13" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Additions (paid extras) */}
              {groupedModifiers.additions.length > 0 && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("modifiers.additions") || "Add Extras"}
                  </Text>
                  {groupedModifiers.additions.map((mod) => (
                    <View key={mod.id} style={styles.modifierRow}>
                      <View style={styles.modifierInfo}>
                        <Text style={styles.modifierName}>
                          {getModifierName(mod)}
                        </Text>
                        <Text style={styles.modifierPrice}>
                          +€{mod.price.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.modifierControls}>
                        <TouchableOpacity
                          style={[
                            styles.modifierBtn,
                            getModifierQuantity(mod.id) === 0 &&
                              styles.modifierBtnDisabled,
                          ]}
                          onPress={() => updateModifierQuantity(mod.id, -1)}
                          disabled={getModifierQuantity(mod.id) === 0}
                        >
                          <Ionicons
                            name="remove"
                            size={16}
                            color={
                              getModifierQuantity(mod.id) === 0
                                ? "#666"
                                : "#231a13"
                            }
                          />
                        </TouchableOpacity>
                        <Text style={styles.modifierQty}>
                          {getModifierQuantity(mod.id)}
                        </Text>
                        <TouchableOpacity
                          style={[
                            styles.modifierBtn,
                            getModifierQuantity(mod.id) >= mod.maxQuantity &&
                              styles.modifierBtnDisabled,
                          ]}
                          onPress={() => updateModifierQuantity(mod.id, 1)}
                          disabled={getModifierQuantity(mod.id) >= mod.maxQuantity}
                        >
                          <Ionicons
                            name="add"
                            size={16}
                            color={
                              getModifierQuantity(mod.id) >= mod.maxQuantity
                                ? "#666"
                                : "#231a13"
                            }
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Removals (checkboxes) */}
              {groupedModifiers.removals.length > 0 && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("modifiers.removals") || "Remove Ingredients"}
                  </Text>
                  {groupedModifiers.removals.map((mod) => {
                    const isSelected = selectedModifiers.some(
                      (m) => m.modifierId === mod.id
                    );
                    return (
                      <TouchableOpacity
                        key={mod.id}
                        style={styles.checkboxRow}
                        onPress={() => handleToggleRemoval(mod.id)}
                      >
                        <Ionicons
                          name={isSelected ? "checkbox" : "square-outline"}
                          size={24}
                          color={isSelected ? colors.primary : "#666"}
                        />
                        <Text style={styles.checkboxLabel}>
                          {getModifierName(mod)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Preparations (radio buttons) */}
              {groupedModifiers.preparations.length > 0 && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("modifiers.preparations") || "Cooking Preference"}
                  </Text>
                  {groupedModifiers.preparations.map((mod) => {
                    const isSelected = selectedPreparation === mod.id;
                    return (
                      <TouchableOpacity
                        key={mod.id}
                        style={styles.radioRow}
                        onPress={() => handleSelectPreparation(mod.id)}
                      >
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color={isSelected ? colors.primary : "#666"}
                        />
                        <Text style={styles.radioLabel}>
                          {getModifierName(mod)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Cooking Preferences (if item has cooking options) */}
              {hasCookingOptions && allowedCookingPreferences.length > 0 && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("cooking.preference") || "Cooking Preference"}
                  </Text>
                  {allowedCookingPreferences.map((pref) => {
                    const isSelected = selectedCookingPreference === pref;
                    return (
                      <TouchableOpacity
                        key={pref}
                        style={styles.radioRow}
                        onPress={() => setSelectedCookingPreference(isSelected ? null : pref)}
                      >
                        <Ionicons
                          name={isSelected ? "radio-button-on" : "radio-button-off"}
                          size={24}
                          color={isSelected ? colors.primary : "#666"}
                        />
                        <Text style={styles.radioLabel}>
                          {t(`cooking.${pref}`) || pref.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Cooking Notes */}
              {hasCookingOptions && (
                <View style={styles.modifiersSection}>
                  <Text style={styles.sectionTitle}>
                    {t("cooking.notes") || "Cooking Notes"}
                  </Text>
                  <TextInput
                    style={styles.specialInstructionsInput}
                    placeholder={
                      t("cooking.notesPlaceholder") ||
                      "Any special cooking instructions..."
                    }
                    placeholderTextColor="#999"
                    value={cookingNotes}
                    onChangeText={(text) => {
                      if (text.length <= 200) {
                        setCookingNotes(text);
                      }
                    }}
                    multiline
                    numberOfLines={2}
                    maxLength={200}
                  />
                  <Text style={styles.charCounter}>
                    {cookingNotes.length}/200
                  </Text>
                </View>
              )}

              {/* Special Instructions */}
              <View style={styles.modifiersSection}>
                <Text style={styles.sectionTitle}>
                  {t("modifiers.specialInstructions") || "Special Instructions"}
                </Text>
                <TextInput
                  style={styles.specialInstructionsInput}
                  placeholder={
                    t("modifiers.specialInstructionsPlaceholder") ||
                    "Add any special requests here..."
                  }
                  placeholderTextColor="#999"
                  value={specialInstructions}
                  onChangeText={(text) => {
                    if (text.length <= 200) {
                      setSpecialInstructions(text);
                    }
                  }}
                  multiline
                  numberOfLines={3}
                  maxLength={200}
                />
                <Text style={styles.charCounter}>
                  {specialInstructions.length}/200
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>{t("cart.total")}</Text>
          <Text style={styles.totalPrice}>€{calculateTotal().toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, { backgroundColor: colors.primary }]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#231a13" />
          ) : (
            <>
              <Ionicons name="cart" size={20} color="#231a13" />
              <Text style={styles.addToCartBtnText}>{t("menu.addToCart")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#231a13",
  },
  header: {
    position: "absolute",
    top: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageHero: {
    width: "100%",
    // height is set dynamically via IMAGE_HEIGHT constant
    backgroundColor: "#3a2b1f",
  },
  imageRadius: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  placeholderIcon: {
    fontSize: 80,
  },
  detailsContainer: {
    padding: SCREEN_HEIGHT < 700 ? 14 : 20,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SCREEN_HEIGHT < 700 ? 8 : 12,
  },
  itemName: {
    fontSize: SCREEN_HEIGHT < 700 ? 22 : 26,
    fontWeight: "bold",
    color: "#fffbe8",
    flex: 1,
    marginRight: 16,
  },
  itemPrice: {
    fontSize: SCREEN_HEIGHT < 700 ? 20 : 24,
    fontWeight: "700",
    color: "#e0b97f",
  },
  itemDescription: {
    fontSize: SCREEN_HEIGHT < 700 ? 14 : 16,
    color: "#b8a68a",
    lineHeight: SCREEN_HEIGHT < 700 ? 20 : 24,
    marginBottom: SCREEN_HEIGHT < 700 ? 10 : 16,
  },
  dietaryBadgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dietaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  dietaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bonusPointsBadge: {
    backgroundColor: "#d4af37",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  bonusPointsText: {
    color: "#231a13",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: SCREEN_HEIGHT < 700 ? 16 : 18,
    fontWeight: "700",
    color: "#fffbe8",
    marginBottom: SCREEN_HEIGHT < 700 ? 8 : 12,
  },
  quantitySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SCREEN_HEIGHT < 700 ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0b97f",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fffbe8",
    minWidth: 30,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  loadingText: {
    color: "#b8a68a",
    fontSize: 14,
  },
  modifiersSection: {
    paddingTop: SCREEN_HEIGHT < 700 ? 12 : 16,
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
  },
  modifierCategory: {
    marginBottom: 16,
  },
  modifierCategoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e0b97f",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modifierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#2d2117",
    borderRadius: 12,
    marginBottom: 8,
  },
  modifierInfo: {
    flex: 1,
  },
  modifierName: {
    fontSize: 16,
    color: "#fffbe8",
    fontWeight: "500",
  },
  modifierPrice: {
    fontSize: 14,
    color: "#b8a68a",
    marginTop: 2,
  },
  modifierControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modifierBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0b97f",
    justifyContent: "center",
    alignItems: "center",
  },
  modifierBtnDisabled: {
    backgroundColor: "#3a2b1f",
  },
  modifierQty: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fffbe8",
    minWidth: 24,
    textAlign: "center",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#fffbe8",
    flex: 1,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  radioLabel: {
    fontSize: 16,
    color: "#fffbe8",
    flex: 1,
  },
  specialInstructionsInput: {
    backgroundColor: "#3a2b1f",
    color: "#fffbe8",
    padding: SCREEN_HEIGHT < 700 ? 10 : 12,
    borderRadius: 8,
    fontSize: SCREEN_HEIGHT < 700 ? 14 : 16,
    minHeight: SCREEN_HEIGHT < 700 ? 60 : 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#4a3b2f",
  },
  charCounter: {
    fontSize: 12,
    color: "#b8a68a",
    textAlign: "right",
    marginTop: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#b8a68a",
    marginBottom: 12,
    fontStyle: "italic",
  },
  ingredientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#3a2b1f",
  },
  ingredientInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 16,
  },
  ingredientName: {
    fontSize: 16,
    color: "#fffbe8",
    flex: 1,
  },
  ingredientPrice: {
    fontSize: 14,
    color: "#e0b97f",
    fontWeight: "600",
    marginLeft: 8,
  },
  ingredientControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ingredientBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e0b97f",
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientBtnDisabled: {
    backgroundColor: "#3a2b1f",
  },
  ingredientQty: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fffbe8",
    minWidth: 24,
    textAlign: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: SCREEN_HEIGHT < 700 ? 12 : 16,
    paddingBottom: SCREEN_HEIGHT < 700 ? 16 : 24,
    backgroundColor: "#2d2117",
    borderTopWidth: 1,
    borderTopColor: "#3a2b1f",
    gap: SCREEN_HEIGHT < 700 ? 12 : 16,
  },
  totalSection: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 14,
    color: "#b8a68a",
  },
  totalPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fffbe8",
  },
  addToCartBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  addToCartBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#231a13",
  },
});

export default MenuItemDetailScreen;
