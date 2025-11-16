import React, { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.menuItemId);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1, imageUrl: i.imageUrl ?? item.imageUrl ?? null }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, imageUrl: item.imageUrl ?? null }];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}
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
