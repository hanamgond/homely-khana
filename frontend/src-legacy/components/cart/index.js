'use client';

import React, { useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';

import styles from "./Cart.module.css"; // Assumes colocation
import { AppContext } from '@/utils/AppContext';

const Cart = () => {
  const router = useRouter();

  // Get everything from AppContext
  const { 
    isCartOpen, 
    closeCart, 
    cart, 
    cartTotal, 
    updateQuantity, 
    removeSubscription 
  } = useContext(AppContext);

  const hasItems = cart && ((cart.lunch?.length > 0) || (cart.dinner?.length > 0));

  const handleProceedToCheckout = () => {
    closeCart();
    router.push("/checkout");
  };
  
  const modifyQuantity = (type, action, sub) => {
    const currentQuantity = sub.quantity;
    let newQuantity = action === 'add' ? currentQuantity + 1 : currentQuantity - 1;

    if (newQuantity < 1) {
      if (removeSubscription) {
        removeSubscription(type, sub.subs_id);
        toast.success("Meal removed from cart");
      }
    } else if (newQuantity < 100) {
      if (updateQuantity) {
        updateQuantity(type, sub.subs_id, newQuantity);
      }
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
              {/* Lunch Items */}
              {cart.lunch.length > 0 && <h3 className={styles.cartSectionTitle}>Lunch</h3>}
              {cart.lunch.map(sub => (
                <div key={sub.subs_id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{sub.selectedMeal}</p>
                    <p className={styles.itemMeta}>Plan: {sub.plan}</p>
                  </div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => modifyQuantity('lunch', 'remove', sub)}>-</button>
                    <span>{sub.quantity}</span>
                    <button onClick={() => modifyQuantity('lunch', 'add', sub)}>+</button>
                  </div>
                  <p className={styles.itemPrice}>₹{sub.totalAmount}</p>
                </div>
              ))}
              {/* Dinner Items */}
              {cart.dinner.length > 0 && <h3 className={styles.cartSectionTitle}>Dinner</h3>}
              {cart.dinner.map(sub => (
                 <div key={sub.subs_id} className={styles.cartItem}>
                  <div className={styles.itemDetails}>
                    <p className={styles.itemName}>{sub.selectedMeal}</p>
                    <p className={styles.itemMeta}>Plan: {sub.plan}</p>
                  </div>
                  <div className={styles.quantityControls}>
                    <button onClick={() => modifyQuantity('dinner', 'remove', sub)}>-</button>
                    <span>{sub.quantity}</span>
                    <button onClick={() => modifyQuantity('dinner', 'add', sub)}>+</button>
                  </div>
                  <p className={styles.itemPrice}>₹{sub.totalAmount}</p>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Grand Total</span>
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