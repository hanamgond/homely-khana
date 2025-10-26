'use client';

import { useState, useEffect, useRef } from 'react'; // Removed useContext
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Header.module.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { fetchProfile } from '../../lib/api'; // We'll fetch the profile for the user's name

// --- SVG Icons (Unchanged) ---
const CartIcon = () => (<svg /* ... */ >...</svg>);
const UserIcon = () => (<svg /* ... */ >...</svg>);
const LogoutIcon = () => (<svg /* ... */ >...</svg>);

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- ZUSTAND & REACT QUERY HOOKS ---
  const queryClient = useQueryClient();
  
  // 1. Get auth token and actions from authStore
  const { token, clearToken } = useAuthStore();
  const isLoggedIn = !!token; // Our new source of truth for auth
  
  // 2. Get cart items from cartStore
  const { cartItems } = useCartStore();

  const { data: user, isLoading: isUserLoading } = useQuery({
      queryKey: ['profile'],
      queryFn: fetchProfile,
      enabled: isLoggedIn, // Only run this query if we are logged in
      select: (data) => data.user // Extracts the nested 'user' object from the API response
  });

  // --- Click outside dropdown logic (Unchanged) ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


    const cartItemCount = cartItems.length;

  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  // --- REWRITTEN: Logout Handler ---
  const handleLogout = () => {
    // 1. Clear the token from Zustand (this logs the user out)
    clearToken();
    
    // 2. Clear all cached React Query data (profile, addresses, etc.)
    queryClient.clear();
    
    // 3. Close the dropdown
    setDropdownOpen(false);
    
    // 4. Redirect to home
    router.push('/');
  };

  // Don't show the header on certain pages (Unchanged)
  const noHeaderPages = ['/login', '/signup'];
  if (noHeaderPages.includes(pathname)) {
    return null;
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          HomelyKhana
        </Link>
        <nav className={styles.nav}>
          {isLoggedIn ? (
            // --- Logged-In View (Data sources updated) ---
            <>
              <div className={styles.userMenu} ref={dropdownRef}>
                <button className={styles.userMenuButton} onClick={() => setDropdownOpen(prev => !prev)}>
                  <div className={styles.avatar}>{userInitials}</div>
                  {/* Show loading state while profile fetches */}
                  <span> {isUserLoading ? '...' : (user?.name?.split(' ')[0] || 'User')}</span>
                </button>

                {isDropdownOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.avatar}>{userInitials}</div>
                      <div>
                        {/* Show loading state while profile fetches */}
                        <p className={styles.dropdownName}>{isUserLoading ? 'Loading...' : (user?.name || 'User')}</p>
                        <p className={styles.dropdownEmail}>{isUserLoading ? 'Loading...' : (user?.email || '...')}</p>
                      </div>
                    </div>
                    <Link href="/dashboard" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                      <UserIcon /> My Dashboard
                    </Link>
                    <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutButton}`}>
                      <LogoutIcon /> Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Cart button now uses new cartItemCount */}
              <button className={styles.cartButton} onClick={() => router.push('/checkout')}>
                <CartIcon />
                {cartItemCount > 0 && <span className={styles.cartCount}>{cartItemCount}</span>}
              </button>
            </>
          ) : (
            // --- Logged-Out View (Unchanged) ---
            <>
              <Link href="/login" className={styles.loginButton}>Login</Link>
              <Link href="/subscribe" className={`${styles.subscribeButton} ${styles.primary}`}>Subscribe</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};