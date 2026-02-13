// src/components/payment/index.js
'use client'; // Required for hooks like useEffect, useState, useContext

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppContext } from '@/shared/lib/AppContext';
import styles from './Payment.module.css'; // CORRECTED PATH
import { load } from '@cashfreepayments/cashfree-js';

// A simple lock icon for trust signals
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9z"/>
  </svg>
);

export default function PaymentClient() { // RENAMED COMPONENT
  const { cart, deliveryAddress } = useContext(AppContext);
  const [cashfree, setCashfree] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeCashfree = async () => { 
        // Your existing initialization logic for Cashfree SDK goes here...
    };
    initializeCashfree();
  }, []);

  const handlePayment = async () => {
    if (!cashfree || isLoading) {
      return;
    }
    setIsLoading(true);
    console.log("Starting payment process...");

    // Simulating a backend call and payment gateway interaction
    setTimeout(() => {
      // In a real app, you would handle the response from your backend here
      alert("This is where the real payment gateway would open.");
      setIsLoading(false); 
    }, 2000);
  };

  if (!cart || !deliveryAddress) {
    return (
      <div className={styles.pageContainer}>
        <h2 style={{ textAlign: 'center', margin: '4rem 0' }}>Missing cart or address details.</h2>
        <Link href="/subscribe" className={styles.backLink} style={{ justifyContent: 'center' }}>
            ← Please start by building a subscription
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Link href="/checkout" className={styles.backLink}>
        ← Back to Address
      </Link>
      
      <div className={styles.layoutGrid}>
        {/* --- Left Column --- */}
        <div className={styles.paymentColumn}>
          <div className={styles.infoBox}>
            <h2 className={styles.boxHeader}>Delivery Address</h2>
            <p className={styles.addressDisplay}>{deliveryAddress.address}</p>
          </div>

          <div className={styles.paymentBox}>
            <h2 className={styles.boxHeader}>Payment Details</h2>
            <div id="payment-form" className={styles.paymentFormContainer}>
               <p>Loading secure payment options...</p>
            </div>
            <div className={styles.securityInfo}>
              <LockIcon />
              <span>All transactions are secure and encrypted.</span>
            </div>
          </div>
        </div>

        {/* --- Right Column --- */}
        <div className={styles.summaryBox}>
          <h3 className={styles.summaryHeader}>Final Order Summary</h3>
          <div className={styles.summaryGrid}>
              <span className={styles.summaryLabel}>Selected Meal:</span>
              <span className={styles.summaryValue}>{cart.selectedMeal} (x{cart.quantity})</span>
              <span className={styles.summaryLabel}>Subscription:</span>
              <span className={styles.summaryValue}>{cart.plan}</span>
              <div className={styles.totalAmountRow}>
                <span className={styles.summaryTotalLabel}>Total Amount:</span>
                <span className={styles.summaryTotalPrice}>₹{cart.totalAmount.toLocaleString('en-IN')}/-</span>
              </div>
          </div>
          <button onClick={handlePayment} className={styles.payButton} disabled={isLoading}>
            {isLoading ? (
              <div className={styles.spinner}></div>
            ) : (
              `Pay ₹${cart.totalAmount.toLocaleString('en-IN')}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
