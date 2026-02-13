'use client';

import { useState, useEffect, useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext } from '@/shared/lib/AppContext';
import DashboardOverview from '../DashboardOverview';
import Profile from '../Profile';
import UserSubscriptions from '../Subscriptions';
import OrderHistory from '../OrderHistory';
import ContactSupport from '../ContactSupport';
import styles from './Dashboard.module.css';

// Navigation items
const navItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: '📊',
    component: DashboardOverview
  },
  { 
    name: 'My Subscription', 
    href: '/dashboard/subscription', 
    icon: '📅',
    component: UserSubscriptions,
  },
  { 
    name: 'Order History', 
    href: '/dashboard/history', 
    icon: '📋',
    component: OrderHistory
  },
  { 
    name: 'Profile Settings', 
    href: '/dashboard/profile', 
    icon: '👤',
    component: Profile
  },
  { 
    name: 'Contact Support', 
    href: '/dashboard/contact', 
    icon: '📞',
    component: ContactSupport
  },
];

export default function Dashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState(false);
  const [hasGlobalHeader, setHasGlobalHeader] = useState(false);

  // Get current active tab
  const activeNavItem = navItems.find(item => 
    pathname === item.href || 
    (pathname.startsWith(item.href) && item.href !== '/dashboard')
  ) || navItems[0];

  const ActiveComponent = activeNavItem.component;

  // Check mobile view and detect global header
  useEffect(() => {
    const checkMobile = () => {
      setMobileView(window.innerWidth < 768);
      if (window.innerWidth > 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    // Check if there's a global header
    const checkGlobalHeader = () => {
      // Look for any fixed header in the DOM
      const globalHeader = document.querySelector('header, .header, .navbar, .app-header');
      setHasGlobalHeader(!!globalHeader);
    };
    
    checkMobile();
    checkGlobalHeader();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [sidebarOpen]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarOpen && mobileView && !e.target.closest(`.${styles.sidebar}`)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sidebarOpen, mobileView]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    if (logout) {
      logout();
    }
    router.push('/');
  };

  // Get user initials
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`${styles.container} ${hasGlobalHeader ? styles.withGlobalHeader : ''}`}>
      {/* Mobile Header */}
      {mobileView && (
        <div className={styles.mobileHeader}>
          <button 
            className={styles.menuButton}
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
          <h1 className={styles.mobileTitle}>{activeNavItem.name}</h1>
          <div className={styles.mobileAvatar}>
            {getUserInitials()}
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`} 
        id="sidebar-navigation"
        style={hasGlobalHeader ? { 
          top: 'var(--header-height, 64px)',
          height: 'calc(100vh - var(--header-height, 64px))'
        } : {}}
      >
        {/* User Info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {getUserInitials()}
          </div>
          <div className={styles.userDetails}>
            <h3 className={styles.userName}>{user?.name || 'Guest User'}</h3>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          {navItems.map((item) => {
            const isActive = activeNavItem.href === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={() => mobileView && setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navText}>{item.name}</span>
                {isActive && (
                  <span className={styles.activeIndicator}>›</span>
                )}
              </a>
            );
          })}
          
          {/* Logout item */}
          <button
            className={`${styles.navItem} ${styles.logoutNavItem}`}
            onClick={handleLogout}
          >
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navText}>Logout</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <p className={styles.version}>v2.1.0 • Homely Khana</p>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && mobileView && (
        <div 
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
}