import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, OrderMode, GasStation, DeliveryMethod } from '../types/index.ts';

interface CartContextType {
  cart: CartItem[];
  selectedStation: GasStation | null;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string;
  notes: string;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  setDeliveryAddress: (address: string) => void;
  setNotes: (notes: string) => void;
  setSelectedStation: (station: GasStation | null) => void;
  addToCart: (product: Product, orderMode: OrderMode, quantity?: number) => void;
  removeFromCart: (productId: number, orderMode: OrderMode) => void;
  updateQuantity: (productId: number, orderMode: OrderMode, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  deliveryFee: number;
  total: number;
  itemCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('gaspoint_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedStation, setSelectedStationState] = useState<GasStation | null>(() => {
    try {
      const saved = localStorage.getItem('gaspoint_selected_station');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('House 4B, Woodvale Grove, Westlands, Nairobi');
  const [notes, setNotes] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('gaspoint_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (selectedStation) {
      localStorage.setItem('gaspoint_selected_station', JSON.stringify(selectedStation));
    } else {
      localStorage.removeItem('gaspoint_selected_station');
    }
  }, [selectedStation]);

  const setSelectedStation = (station: GasStation | null) => {
    if (selectedStation && station && selectedStation.id !== station.id && cart.length > 0) {
      if (window.confirm('Switching gas stations will clear your current cart items from the previous provider. Continue?')) {
        setCart([]);
        setSelectedStationState(station);
      }
    } else {
      setSelectedStationState(station);
    }
  };

  const addToCart = (product: Product, orderMode: OrderMode, quantity = 1) => {
    // Determine unit price based on orderMode
    let unitPrice = Number(product.refillPrice);
    if (orderMode === 'exchange') {
      unitPrice = Number(product.exchangePrice);
    } else if (orderMode === 'new_cylinder') {
      unitPrice = Number(product.newCylinderPrice);
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.orderMode === orderMode
      );

      if (existingIndex > -1) {
        const next = [...prev];
        const newQty = next[existingIndex].quantity + quantity;
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: newQty,
          subtotal: newQty * unitPrice,
        };
        return next;
      }

      return [
        ...prev,
        {
          product,
          orderMode,
          quantity,
          unitPrice,
          subtotal: quantity * unitPrice,
        },
      ];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: number, orderMode: OrderMode) => {
    setCart((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.orderMode === orderMode))
    );
  };

  const updateQuantity = (productId: number, orderMode: OrderMode, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, orderMode);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.orderMode === orderMode) {
          return {
            ...item,
            quantity,
            subtotal: quantity * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = deliveryMethod === 'pickup' || subtotal === 0 ? 0 : 150;
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        selectedStation,
        deliveryMethod,
        deliveryAddress,
        notes,
        setDeliveryMethod,
        setDeliveryAddress,
        setNotes,
        setSelectedStation,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        deliveryFee,
        total,
        itemCount,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
