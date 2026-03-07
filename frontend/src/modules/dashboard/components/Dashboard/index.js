// frontend/src/modules/dashboard/components/Dashboard/index.js
'use client';

import { useContext } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppContext } from '@/shared/lib/AppContext';
import DashboardOverview from '../DashboardOverview';
import Profile from '../Profile';
import UserSubscriptions from '../Subscriptions';
import OrderHistory from '../OrderHistory';
import ContactSupport from '../ContactSupport';
import styles from './Dashboard.module.css';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', component: DashboardOverview },
  { name: 'My Subscription', href: '/dashboard/subscription', component: UserSubscriptions },
  { name: 'Order History', href: '/dashboard/history', component: OrderHistory },
  { name: 'Profile Settings', href: '/dashboard/profile', component: Profile },
  { name: 'Contact Support', href: '/dashboard/contact', component: ContactSupport },
];

export default function Dashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useContext(AppContext);

  const activeNavItem =
    navItems.find(item => pathname === item.href) || navItems[0];

  const ActiveComponent = activeNavItem.component;

  const handleLogout = () => {
    logout?.();
    router.push('/');
  };

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
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {getUserInitials()}
          </div>
          <h3>{user?.name || 'Guest User'}</h3>
        </div>

        <nav className={styles.navigation}>
          {navItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {item.name}
              </Link>
            );
          })}

          <button
            className={`${styles.navItem} ${styles.logout}`}
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <ActiveComponent />
      </main>
    </div>
  );
}