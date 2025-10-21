'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      fontFamily: 'sans-serif',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333' }}>404 - Page Not Found</h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginTop: '1rem' }}>
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => router.back()}
          style={{
            padding: '0.75rem 1.5rem',
            border: '1px solid #ddd',
            borderRadius: '8px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          ← Go Back
        </button>
        <Link href="/" style={{
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '8px',
          background: '#FF6347', // Using a color similar to your theme
          color: 'white',
          textDecoration: 'none',
          fontSize: '1rem'
        }}>
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

