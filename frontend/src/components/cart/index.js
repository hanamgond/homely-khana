'use client';

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import styles from "./Cart.module.css";

// --- NEW IMPORTS ---
import { useUIStore } from '@/store/uiStore';      // Manages open/close state
import { useCartStore } from '@/store/cartStore'; // Manages cart data

// --- REMOVED APP CONTEXT ---
// import { AppContext } from '@/utils/AppContext';

const Cart = () => {
  const router = useRouter();

  // --- 1. Get UI state from useUIStore ---
  const { isCartOpen, closeCart } = useUIStore();
  
  // --- 2. Get Cart data from useCartStore ---
  const { 
    cartItems, 
    getTotalPrice, 
    updateQuantity, 
    removeFromCart 
  } = useCartStore();

  // --- 3. Get calculated values from store ---
  const cartTotal = getTotalPrice();
  const hasItems = cartItems.length > 0;

  // --- 4. Derive Lunch/Dinner items (like in CheckoutClient) ---
  const { lunchItems, dinnerItems } = useMemo(() => {
    const lunch = cartItems.filter(item => item.mealType?.toLowerCase() === 'lunch');
    const dinner = cartItems.filter(item => item.mealType?.toLowerCase() === 'dinner');
    return { lunchItems: lunch, dinnerItems: dinner };
  }, [cartItems]);


  const handleProceedToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };
  
  // --- REFACTORED: Quantity modification ---
  const modifyQuantity = (action, item) => {
    const currentQuantity = item.quantity;
    let newQuantity = action === 'add' ? currentQuantity + 1 : currentQuantity - 1;

    if (newQuantity < 1) {
      // Use the item's unique ID (from subscribe page)
      removeFromCart(item.id || item.subs_id);
      toast.success("Meal removed from cart");
    } else if (newQuantity < 100) {
      updateQuantity(item.id || item.subs_id, newQuantity);
    }
  };

  if (!isCartOpen) {
    return null;
  }

  return (
    <>
      <div className={styles.overlay} onClick={closeCart} />
      <div className={styles.sidebar}>
        <div className={styles.header}>
          <h2>Your Cart</h2>
          <button onClick={closeCart} className={styles.closeButton}>×</button>
        </div>

        {hasItems ? (
          <div className={styles.cartContent}>
            <div className={styles.itemList}>
              
              {/* --- REFACTORED: Lunch Items --- */}
              {lunchItems.length > 0 && <h3 className={styles.cartSectionTitle}>Lunch</h3>}
              {lunchItems.map(item => (
                <div key={item.id || item.subs_id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    {/* Use new property names: name, plan.plan_name */}
                    <p className={styles.itemName}>{item.name || item.selectedMeal}</p>
                    <p className={styles.itemMeta}>Plan: {item.plan?.plan_name || item.plan}</p>
                  </div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => modifyQuantity('remove', item)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => modifyQuantity('add', item)}>+</button>
                  </div>
                  {/* Use new property name: totalPrice */}
                  <p className={styles.itemPrice}>₹{item.totalPrice || item.totalAmount}</p>
                </div>
              ))}
              
              {/* --- REFACTORED: Dinner Items --- */}
              {dinnerItems.length > 0 && <h3 className={styles.cartSectionTitle}>Dinner</h3>}
              {dinnerItems.map(item => (
                 <div key={item.id || item.subs_id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{item.name || item.selectedMeal}</p>
                    <p className={styles.itemMeta}>Plan: {item.plan?.plan_name || item.plan}</p>
                  </div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => modifyQuantity('remove', item)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => modifyQuantity('add', item)}>+</button>
                  </div>
                  <p className={styles.itemPrice}>₹{item.totalPrice || item.totalAmount}</p>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Grand Total</span>
                {/* Use new cartTotal from store */}
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <button className={styles.checkoutButton} onClick={handleProceedToCheckout}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyCart}>
            <p>Your cart is empty.</p>
            <button onClick={() => { closeCart(); router.push('/subscribe'); }} className={styles.browseButton}>Browse Meals</button>
          </div>
        )}
      </div>
    </>
  );
};

export default Cart;