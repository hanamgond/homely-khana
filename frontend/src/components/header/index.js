'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import styles from './Header.module.css';

// --- NEW: SVG Icons for a cleaner look ---
const CartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>);
const UserIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);

export default function Header() {
  const { isLoggedIn, user, logout, cart } = useContext(AppContext);
  const router = useRouter();
  const pathname = usePathname();
  
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // --- NEW: Logic to close dropdown when clicking outside ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);


  // --- NEW: Calculate cart item count from your AppContext structure ---
  const cartItemCount = (cart?.lunch?.length || 0) + (cart?.dinner?.length || 0);

  // --- NEW: Get user initials for avatar ---
  const userInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/');
  };

  // Don't show the header on certain pages
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
            // --- IMPROVISED: Logged-In View with Dropdown ---
            <>
              <div className={styles.userMenu} ref={dropdownRef}>
                <button className={styles.userMenuButton} onClick={() => setDropdownOpen(prev => !prev)}>
                  <div className={styles.avatar}>{userInitials}</div>
                  <span>Hello, {user?.name?.split(' ')[0] || 'User'}</span>
                </button>

                {isDropdownOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.avatar}>{userInitials}</div>
                      <div>
                        <p className={styles.dropdownName}>{user?.name || 'User'}</p>
                        <p className={styles.dropdownEmail}>{user?.email}</p>
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