import React, { createContext, useState, useEffect, useMemo } from 'react';
import { calcIGV } from '../utils/calcIGV';

export const CartContext = createContext(null);

const LOCAL_STORAGE_KEY = 'kenpaku_cart_v1';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (err) {
      console.error('Error al leer el carrito de localStorage:', err);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Error al guardar el carrito en localStorage:', err);
    }
  }, [items]);

  const addToCart = (product, cantidad = 1) => {
    if (!product || product.stock_disponible <= 0) return;

    setItems((prevItems) => {
      const existingIdx = prevItems.findIndex((i) => i.product.id === product.id);
      if (existingIdx !== -1) {
        const existingItem = prevItems[existingIdx];
        const newQty = Math.min(existingItem.cantidad + cantidad, product.stock_disponible);
        const updated = [...prevItems];
        updated[existingIdx] = { ...existingItem, cantidad: newQty };
        return updated;
      }
      return [...prevItems, { product, cantidad: Math.min(cantidad, product.stock_disponible) }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    setItems((prevItems) => {
      if (newQuantity <= 0) {
        return prevItems.filter((i) => i.product.id !== productId);
      }
      return prevItems.map((item) => {
        if (item.product.id === productId) {
          const maxQty = item.product.stock_disponible || 999;
          return { ...item, cantidad: Math.min(newQuantity, maxQty) };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setItems((prevItems) => prevItems.filter((i) => i.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  // Calculations
  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.cantidad, 0);
  }, [items]);

  const rawTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.precio_unitario * item.cantidad, 0);
  }, [items]);

  const { subtotal, igv, total } = useMemo(() => {
    return calcIGV(rawTotal);
  }, [rawTotal]);

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    itemCount,
    subtotal,
    igv,
    total,
    isCartOpen,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
