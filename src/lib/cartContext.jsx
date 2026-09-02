import React, { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'mobile_menu_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (item) => {
    // item: { id, name, price, qty, addons: [{name, price}], image_url }
    setItems((prev) => {
      const key = `${item.id}|${JSON.stringify(item.addons ?? [])}|${item.note || ''}`;
      const existing = prev.find((p) => `${p.id}|${JSON.stringify(p.addons ?? [])}|${p.note || ''}` === key);
      if (existing) {
        return prev.map((p) =>
          `${p.id}|${JSON.stringify(p.addons ?? [])}|${p.note || ''}` === key
            ? { ...p, qty: p.qty + item.qty }
            : p
        );
      }
      return [...prev, item];
    });
  };

  const updateQty = (index, qty) => {
    setItems((prev) =>
      prev
        .map((p, i) => (i === index ? { ...p, qty: Math.max(0, qty) } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setItems([]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}