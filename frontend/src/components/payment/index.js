'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './Payment.module.css';
import { load } from '@cashfreepayments/cashfree-js';

// A simple lock icon for trust signals
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9z"/>
  </svg>
);

export default function PaymentClient() {
  // Migrated from AppContext to Zustand
  const { items: cart, clearCart } = useCartStore();
  const { token } = useAuthStore();
  const [cashfree, setCashfree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);

  // Fetch delivery address from API
  useEffect(() => {
    const fetchAddress = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('/api/addresses/default', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const address = await response.json();
          setDeliveryAddress(address);
        }
      } catch (error) {
        console.error('Error fetching address:', error);
      }
    };

    fetchAddress();
  }, [token]);

  // Rest of your existing payment logic remains the same
  useEffect(() => {
    const initializeCashfree = async () => {
      try {
        const cashfree = await load({
          mode: "production" // or "sandbox"
        });
        setCashfree(cashfree);
      } catch (error) {
        console.error("Failed to load Cashfree:", error);
      }
    };
    initializeCashfree();
  }, []);

  const doPayment = async () => {
    if (!cashfree || !deliveryAddress) {
      alert("Payment gateway not ready or address missing");
      return;
    }

    setIsLoading(true);
    try {
      // Your existing payment logic here
      const sessionId = "your_session_id"; // Replace with actual session ID from backend
      
      const result = await cashfree.checkout({
        paymentSessionId: sessionId,
        returnUrl: "https://yourdomain.com/order-success", // Your return URL
      });

      if (result.error) {
        console.error("Payment failed:", result.error);
        alert("Payment failed. Please try again.");
      } else {
        console.log("Payment successful:", result);
        // Clear cart on successful payment
        clearCart();
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals from cart store
  const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  return (
    <div className={styles.paymentContainer}>
      <h1 className={styles.paymentTitle}>Payment</h1>
      
      <div className={styles.paymentSummary}>
        <h2>Order Summary</h2>
        {cart.map((item) => (
          <div key={item.id} className={styles.orderItem}>
            <span>{item.name}</span>
            <span>₹{item.price * (item.quantity || 1)}</span>
          </div>
        ))}
        <div className={styles.totalSection}>
          <div className={styles.totalRow}>
            <span>Subtotal:</span>
            <span>₹{subtotal}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax (18%):</span>
            <span>₹{tax}</span>
          </div>
          <div className={styles.totalRow}>
            <strong>Total:</strong>
            <strong>₹{total}</strong>
          </div>
        </div>
      </div>

      <div className={styles.paymentSecurity}>
        <LockIcon />
        <span>Secure payment encrypted and processed by Cashfree</span>
      </div>

      <button 
        onClick={doPayment}
        disabled={isLoading || !cashfree || !deliveryAddress}
        className={styles.payButton}
      >
        {isLoading ? 'Processing...' : `Pay ₹${total}`}
      </button>

      <Link href="/checkout" className={styles.backLink}>
        ← Back to Checkout
      </Link>
    </div>
  );
}
