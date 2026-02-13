'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import styles from './OrderSuccess.module.css'; // ✅ Import the CSS Module

export default function OrderSuccess() {
  const router = useRouter();

  // Optional: Auto-redirect after 5 seconds as a convenience
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 5000); // 5 seconds gives them time to read the success message

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <CheckCircle size={80} color="#22c55e" className={styles.icon} />
      
      <h1 className={styles.title}>Order Placed Successfully!</h1>
      
      <p className={styles.message}>
        Thank you for your order. You can view your order details in your account dashboard.
        <br />
        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          (Redirecting to dashboard in 5 seconds...)
        </span>
      </p>

      <div className={styles.buttonContainer}>
        {/* Secondary Action first */}
        <Link href="/" className={styles.buttonSecondary}>
          Continue Shopping
        </Link>
        
        {/* Primary Action second */}
        <Link href="/dashboard" className={styles.button}>
          View Orders
        </Link>
      </div>
    </div>
  );
}