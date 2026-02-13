// src/app/order-success/page.js
import Link from 'next/link';
import { CheckCircle } from 'lucide-react'; // Simple success icon

export default function OrderSuccessPage() {
  return (
    <div style={styles.container}>
      <CheckCircle size={80} color="#22c55e" style={styles.icon} />
      <h1 style={styles.title}>Order Placed Successfully!</h1>
      <p style={styles.message}>
        Thank you for your order. You can view your order details in your account dashboard.
      </p>
      <div style={styles.buttonContainer}>
        <Link href="/" style={styles.button}>
          Continue Shopping
        </Link>
        <Link href="/dashboard" style={styles.buttonSecondary}>
          View Orders
        </Link>
      </div>
    </div>
  );
}

// Basic inline styles for demonstration
// You can move these to a CSS module later if you prefer
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    textAlign: 'center',
    padding: '2rem',
  },
  icon: {
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937', // Dark gray
  },
  message: {
    fontSize: '1.1rem',
    color: '#6b7280', // Medium gray
    marginBottom: '2rem',
    maxWidth: '500px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
  },
  button: {
    display: 'inline-block',
    padding: '0.8rem 1.5rem',
    backgroundColor: '#f97316', // HomelyKhana Orange
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    display: 'inline-block',
    padding: '0.8rem 1.5rem',
    backgroundColor: '#e5e7eb', // Light gray
    color: '#1f2937', // Dark gray
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
};

// Add hover effects (optional, requires CSS or styled-components for better handling)
// styles.button[':hover'] = { backgroundColor: '#ea580c' }; // Darker orange
// styles.buttonSecondary[':hover'] = { backgroundColor: '#d1d5db' }; // Darker gray