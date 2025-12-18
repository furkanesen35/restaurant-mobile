import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import apiClient from "../utils/apiClient";
import logger from "../utils/logger";

import { SelectedModifier } from "../types";

export type CartItemModifier = {
  modifierId: number;
  quantity: number;
  name?: string;
  price?: number;
};

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  modifiers?: CartItemModifier[];
};

type AddToCartInput = Omit<CartItem, "quantity"> & { 
  quantity?: number;
  modifiers?: SelectedModifier[];
};

type CartContextType = {
  cart: CartItem[];
  loading: boolean;
  initialized: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (item: AddToCartInput) => Promise<void>;
  removeFromCart: (menuItemId: string) => Promise<void>;
  updateQuantity: (menuItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
};

type ApiCartItemModifier = {
  modifierId: number;
  quantity: number;
  name?: string;
  price?: number;
};

type ApiCartItem = {
  menuItemId: string | number;
  quantity: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  modifiers?: ApiCartItemModifier[];
};

const CartContext = createContext<CartContextType | undefined>(undefined);

const normalizeCartItems = (items: ApiCartItem[] = []): CartItem[] =>
  items.map((item) => ({
    menuItemId: item.menuItemId.toString(),
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl ?? null,
    modifiers: item.modifiers?.map((mod) => ({
      modifierId: mod.modifierId,
      quantity: mod.quantity,
      name: mod.name,
      price: mod.price,
    })) ?? [],
  }));

const loginRequiredError = () => {
  const error = new Error("LOGIN_REQUIRED") as Error & { code?: string };
  error.code = "LOGIN_REQUIRED";
  return error;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const resetCart = useCallback(() => {
    setCart([]);
    setInitialized(true);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!user) {
      resetCart();
      return;
    }
    try {
      setLoading(true);
      const response = await apiClient.get<{ items: ApiCartItem[] }>(
        "/api/cart"
      );
      const payload = response.data?.items || (response.data as unknown as ApiCartItem[]);
      setCart(normalizeCartItems(payload));
    } catch (error: any) {
      // Don't log 401 errors as they're expected when not logged in
      if (error?.statusCode !== 401) {
        logger.error("Failed to load cart", error);
      }
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user, resetCart]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (!user) {
      resetCart();
    }
  }, [user, resetCart]);

  const addToCart = useCallback(
    async ({ menuItemId, quantity = 1, modifiers = [] }: AddToCartInput) => {
      if (!user) {
        throw loginRequiredError();
      }
      try {
        setLoading(true);
        const response = await apiClient.post<{ items: ApiCartItem[] }>(
          "/api/cart",
          {
            menuItemId,
            quantity,
            modifiers: modifiers.map((mod) => ({
              modifierId: mod.modifierId,
              quantity: mod.quantity,
            })),
          }
        );
        const payload = response.data?.items || [];
        setCart(normalizeCartItems(payload));
      } catch (error: any) {
        // Don't log 401 errors as they're expected when not logged in
        if (error?.statusCode !== 401 && error?.code !== "LOGIN_REQUIRED") {
          logger.error("Failed to add to cart", error);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const removeFromCart = useCallback(
    async (menuItemId: string) => {
      if (!user) {
        throw loginRequiredError();
      }
      try {
        setLoading(true);
        const response = await apiClient.delete<{ items: ApiCartItem[] }>(
          `/api/cart/${menuItemId}`
        );
        setCart(normalizeCartItems(response.data?.items || []));
      } catch (error) {
        logger.error("Failed to remove cart item", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (menuItemId: string, quantity: number) => {
      if (!user) {
        throw loginRequiredError();
      }
      try {
        setLoading(true);
        const response = await apiClient.patch<{ items: ApiCartItem[] }>(
          `/api/cart/${menuItemId}`,
          { quantity }
        );
        setCart(normalizeCartItems(response.data?.items || []));
      } catch (error) {
        logger.error("Failed to update cart item", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (!user) {
      resetCart();
      return;
    }
    try {
      setLoading(true);
      await apiClient.delete("/api/cart");
      setCart([]);
    } catch (error) {
      logger.error("Failed to clear cart", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, resetCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        initialized,
        refreshCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
