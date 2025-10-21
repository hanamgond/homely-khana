'use client';

import { createContext, useState, useEffect, useCallback } from "react";
import { getCookie, removeCookie, fetchWithToken } from './CookieManagement'; // Assuming fetchWithToken is in this file

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
  }, []);

  const fetchUserProfile = useCallback(async () => {
    const token = getCookie();
    if (token) {
      try {
        // --- THIS IS THE FIX ---
        // Changed /users/profile to our new /auth/profile route
        const response = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/auth/profile`); 
        // -----------------------

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
    }
  }, [logout]);

  useEffect(() => {
    fetchUserProfile();
    const savedCart = localStorage.getItem('homelykhana-cart-v2');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Failed to parse cart", e); }
    }
    setIsMounted(true);
  }, [fetchUserProfile]);

  useEffect(() => {
    if (isMounted) {
      let total = 0;
      cart.lunch.forEach(item => total += item.totalAmount);
      cart.dinner.forEach(item => total += item.totalAmount);
      setCartTotal(total);
      localStorage.setItem('homelykhana-cart-v2', JSON.stringify(cart));
    }
  }, [cart, isMounted]);

  const addSubscription = (subscriptionDetails) => {
    const mealType = subscriptionDetails.mealType.toLowerCase();
    
    setCart(prevCart => {
        const newCart = { ...prevCart };
        const itemWithId = { ...subscriptionDetails, subs_id: Date.now() };

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
    if (type === 'lunch') {
      setCart(prev => ({ ...prev, lunch: prev.lunch.filter(item => item.subs_id !== subs_id) }));
    } else {
      setCart(prev => ({ ...prev, dinner: prev.dinner.filter(item => item.subs_id !== subs_id) }));
    }
  };
  
  const updateQuantity = (mealType, subs_id, newQuantity) => {
    const type = mealType.toLowerCase();
    const update = (items) => items.map(item => {
        if (item.subs_id === subs_id) {
            const newTotalAmount = item.basePrice * item.totalMeals * newQuantity;
            return { ...item, quantity: newQuantity, totalAmount: newTotalAmount };
        }
        return item;
    });
    if (type === 'lunch') setCart(prev => ({ ...prev, lunch: update(prev.lunch) }));
    else if (type === 'dinner') setCart(prev => ({ ...prev, dinner: update(prev.dinner) }));
  };

  const login = (userData) => { setUser(userData); setIsLoggedIn(true); };
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const value = {
    isLoggedIn, user, login, logout,
    cart, cartTotal, addSubscription, removeSubscription, updateQuantity,
    isCartOpen, openCart, closeCart,
    deliveryAddress, setDeliveryAddress,
    subStep, setSubStep, menuId, setMenuId,
  };

  if (!isMounted) return null;

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};