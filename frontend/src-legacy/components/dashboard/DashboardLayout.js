'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import { 
  LayoutDashboard, 
  CalendarDays, 
  History, 
  User, 
  Phone, 
  LogOut,
  Menu,
  X,
  Home,
  Gift,
  Users,
  HelpCircle,
  Settings,
  Star,
  Shield,
  Bell,
  Package,
  CreditCard,
  MapPin,
  ChevronRight,
  ChevronDown,
  Circle,
  Zap
} from 'lucide-react';
import styles from './DashboardLayout.module.css';

// Main navigation items
const mainNavItems = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: <LayoutDashboard size={20} />,
    badge: null
  },
  { 
    name: 'My Subscription', 
    href: '/dashboard/subscription', 
    icon: <CalendarDays size={20} />,
    badge: '2'
  },
  { 
    name: 'Order History', 
    href: '/dashboard/history', 
    icon: <History size={20} />,
    badge: null
  },
  { 
    name: 'Profile Settings', 
    href: '/dashboard/profile', 
    icon: <User size={20} />,
    badge: null
  },
  { 
    name: 'Contact Support', 
    href: '/dashboard/contact', 
    icon: <Phone size={20} />,
    badge: null
  },
];

// Quick links
const quickLinks = [
  { name: 'Help Center', href: '/help', icon: <HelpCircle size={18} /> },
  { name: 'Gift a Meal', href: '/gift', icon: <Gift size={18} /> },
  { name: 'Invite Friends', href: '/invite', icon: <Users size={18} /> },
  { name: 'Leave Review', href: '/review', icon: <Star size={18} /> },
];

// Account links
const accountLinks = [
  { name: 'Payment Methods', href: '/dashboard/payments', icon: <CreditCard size={18} /> },
  { name: 'Notifications', href: '/dashboard/notifications', icon: <Bell size={18} /> },
  { name: 'Privacy & Security', href: '/dashboard/privacy', icon: <Shield size={18} /> },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('main');
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Get user initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get page title from pathname
  useEffect(() => {
    const item = mainNavItems.find(item => item.href === pathname);
    if (item) {
      setPageTitle(item.name);
    } else if (pathname.includes('/dashboard/subscription')) {
      setPageTitle('My Subscription');
    } else if (pathname.includes('/dashboard/history')) {
      setPageTitle('Order History');
    } else if (pathname.includes('/dashboard/profile')) {
      setPageTitle('Profile Settings');
    } else if (pathname.includes('/dashboard/contact')) {
      setPageTitle('Contact Support');
    }
  }, [pathname]);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  // Check if item is active
  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  // Get active icon style
  const getIconStyle = (href) => {
    return isActive(href) ? { color: '#FF9801' } : {};
  };

  return (
    <div className={styles.container}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <button 
          className={styles.mobileMenuButton}
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        
        <h1 className={styles.mobileTitle}>{pageTitle}</h1>
        
        <div className={styles.mobileAvatar}>
          {getInitials(user?.name)}
        </div>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`${styles.mobileOverlay} ${sidebarOpen ? styles.open : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        {/* User Info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {getInitials(user?.name)}
          </div>
          <div className={styles.userDetails}>
            <p className={styles.userName}>{user?.name || 'Guest User'}</p>
            <p className={styles.userEmail}>{user?.email || 'No email'}</p>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              Active
            </div>
          </div>
        </div>

        {/* Current Page Indicator */}
        <div className={styles.currentPage}>
          <Circle size={8} fill="#94a3b8" />
          <span>{pageTitle}</span>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {/* Main Navigation Section */}
          <div className={styles.navSection}>
            <div className={styles.sectionLabel}>Main Menu</div>
            {mainNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${styles.navItem} ${active ? styles.active : ''}`}
                  onClick={closeSidebar}
                >
                  <span className={styles.icon} style={getIconStyle(item.href)}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className={styles.badge}>{item.badge}</span>
                  )}
                  {active && (
                    <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Links Section */}
          <div className={styles.navSection}>
            <div 
              className={styles.collapsibleHeader}
              onClick={() => toggleSection('quick')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Zap size={16} />
                Quick Links
              </span>
              {activeSection === 'quick' ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </div>
            
            {activeSection === 'quick' && (
              <div className={styles.collapsibleContent}>
                <div className={styles.quickLinks}>
                  {quickLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={styles.quickLink}
                      onClick={closeSidebar}
                    >
                      <span className={styles.quickLinkIcon}>{link.icon}</span>
                      <span>{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account Settings Section */}
          <div className={styles.navSection}>
            <div 
              className={styles.collapsibleHeader}
              onClick={() => toggleSection('account')}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={16} />
                Account Settings
              </span>
              {activeSection === 'account' ? 
                <ChevronDown size={16} /> : 
                <ChevronRight size={16} />
              }
            </div>
            
            {activeSection === 'account' && (
              <div className={styles.collapsibleContent}>
                {accountLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href}
                    className={styles.navItem}
                    onClick={closeSidebar}
                  >
                    <span className={styles.icon}>{link.icon}</span>
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Logout Section */}
          <div className={styles.divider}></div>
          
          <button 
            onClick={() => {
              handleLogout();
              closeSidebar();
            }} 
            className={`${styles.navItem} ${styles.logoutBtn}`}
          >
            <span className={styles.icon}><LogOut size={20} /></span>
            <span>Logout</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <p className={styles.version}>v2.1.0 • Homely Khana</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.content}>
        <div className={styles.contentWrapper}>
          {children}
        </div>
      </main>
    </div>
  );
}
