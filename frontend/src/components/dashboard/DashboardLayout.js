'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useContext } from 'react';
import { AppContext } from '@/utils/AppContext';
import { LayoutDashboard, CalendarDays, History, User, Phone, LogOut } from 'lucide-react'; 
import styles from './DashboardLayout.module.css';

const sidebarItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'My Subscription', href: '/dashboard/subscription', icon: <CalendarDays size={20} /> },
  { name: 'Order History', href: '/dashboard/history', icon: <History size={20} /> },
  { name: 'Profile Settings', href: '/dashboard/profile', icon: <User size={20} /> },
  { name: 'Contact Us', href: '/dashboard/contact', icon: <Phone size={20} /> },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useContext(AppContext);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.container}>
      {/* --- UNIFIED SIDEBAR (Matches Home Screenshot) --- */}
      <aside className={styles.sidebar}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {getInitials(user?.name)}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user?.name || 'Guest User'}</p>
            <p className={styles.userEmail}>{user?.email || 'No email'}</p>
          </div>
        </div>

        <nav className={styles.nav}>
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
          
          <div className={styles.divider}></div>

          <button onClick={handleLogout} className={`${styles.navItem} ${styles.logoutBtn}`}>
            <span className={styles.icon}><LogOut size={20} /></span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
}