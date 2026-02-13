//src/utils/AppContext.js
'use client';

import { createContext, useState, useEffect, useCallback } from "react";
import { getCookie, removeCookie, fetchWithToken } from './CookieManagement'; 

export const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ lunch: [], dinner: [] });
  const [cartTotal, setCartTotal] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [subStep, setSubStep] = useState(0);
  const [menuId, setMenuId] = useState(null);

  const logout = useCallback(() => {
    removeCookie();
    setUser(null);
    setIsLoggedIn(false);
    setCart({ lunch: [], dinner: [] });
    localStorage.removeItem('homelykhana-cart-v2'); // Also clear storage on logout
  }, []);

  const fetchUserProfile = useCallback(async () => {
    const token = getCookie();
    if (token) {
      try {
        const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/auth/profile`); 
        const data = await response.json();
        if (data.success) {
          setUser(data.user);
          setIsLoggedIn(true);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Failed to fetch user profile", error);
        logout();
      }
    } else {
        setUser(null);
        setIsLoggedIn(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchUserProfile();
    const savedCart = localStorage.getItem('homelykhana-cart-v2');
    if (savedCart) {
      try { 
        const parsedCart = JSON.parse(savedCart);
        const ensureTotalPrice = (items) => items.map(item => ({
            ...item,
            totalPrice: item.totalPrice || item.totalAmount || 0 
        }));
        parsedCart.lunch = ensureTotalPrice(parsedCart.lunch || []);
        parsedCart.dinner = ensureTotalPrice(parsedCart.dinner || []);
        setCart(parsedCart); 
      } catch (e) { console.error("Failed to parse cart", e); }
    }
    setIsMounted(true);
  }, [fetchUserProfile]);

  useEffect(() => {
    if (isMounted) {
      let total = 0;
      cart.lunch.forEach(item => {
        total += item.totalPrice || 0; 
      });
      cart.dinner.forEach(item => {
        total += item.totalPrice || 0;
      });
      setCartTotal(total);

      // Only save to storage if cart is not empty
      if (cart.lunch.length > 0 || cart.dinner.length > 0) {
        localStorage.setItem('homelykhana-cart-v2', JSON.stringify(cart));
      } else {
        localStorage.removeItem('homelykhana-cart-v2'); // Clean up storage if cart is empty
      }
    }
  }, [cart, isMounted]); 

  const addSubscription = (subscriptionDetails) => {
    const mealType = subscriptionDetails.mealType.toLowerCase();
    
    setCart(prevCart => {
        const newCart = { ...prevCart };
        const itemWithId = { 
            ...subscriptionDetails, 
            totalPrice: subscriptionDetails.totalPrice || 0,
            subs_id: Date.now() 
        };

        if (mealType === 'lunch') {
            newCart.lunch = [itemWithId];
        } else if (mealType === 'dinner') {
            newCart.dinner = [itemWithId];
        }
        return newCart;
    });
  };

  const removeSubscription = (mealType, subs_id) => {
    const type = mealType.toLowerCase();
    setCart(prev => {
        const updatedCart = { ...prev };
        if (type === 'lunch') {
            updatedCart.lunch = prev.lunch.filter(item => item.subs_id !== subs_id);
        } else {
            updatedCart.dinner = prev.dinner.filter(item => item.subs_id !== subs_id);
        }
        return updatedCart;
    });
  };
  
  // --- NEW clearCart Function ---
  const clearCart = () => {
    setCart({ lunch: [], dinner: [] });
    setCartTotal(0);
    // The useEffect hook will automatically remove the item from localStorage
    console.log("Cart Cleared via function call"); 
  };
  // --- END NEW Function ---

  const updateQuantity = (mealType, subs_id, newQuantity) => {
    const type = mealType.toLowerCase();
    const update = (items) => items.map(item => {
        if (item.subs_id === subs_id) {
            const baseAmount = item.originalAmount || (item.plan ? item.plan.price : item.base_price) || 0;
            const discount = (item.originalAmount && item.discountAmount) ? item.discountAmount / item.originalAmount : 0;
            
            const newOriginalAmount = parseFloat(baseAmount) * newQuantity;
            const newDiscountAmount = newOriginalAmount * discount;
            const newTotalPrice = newOriginalAmount - newDiscountAmount;

            return { 
              ...item, 
              quantity: newQuantity, 
              originalAmount: newOriginalAmount, 
              discountAmount: newDiscountAmount,
              totalPrice: newTotalPrice 
            };
        }
        return item;
    });
    
    if (type === 'lunch') setCart(prev => ({ ...prev, lunch: update(prev.lunch) }));
    else if (type === 'dinner') setCart(prev => ({ ...prev, dinner: update(prev.dinner) }));
  };

  const login = (userData) => { setUser(userData); setIsLoggedIn(true); };
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // --- ADD clearCart to the value ---
  const value = {
    isLoggedIn, user, login, logout,
    cart, cartTotal, addSubscription, removeSubscription, updateQuantity, clearCart, // Added clearCart
    isCartOpen, openCart, closeCart,
    deliveryAddress, setDeliveryAddress,
    subStep, setSubStep, menuId, setMenuId,
  };
  // --- END ADD ---

  if (!isMounted) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
