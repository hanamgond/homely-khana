'use client'; // This component is interactive, so it MUST be a client component

import { useState, useContext } from 'react';
import Image from 'next/image';
import Countdown from 'react-countdown';
import { AppContext } from '@/utils/AppContext';
import styles from './Dashboard.module.css'; // CORRECTED PATH using alias

// --- Placeholder Components for different dashboard views ---
const TodaysMeal = () => {
  // In a real app, this data would come from your API
  const nextMeal = {
    type: "Today's Lunch",
    name: "Paneer Butter Masala Meal",
    items: "Paneer, 2 Rotis, Dal, Rice, Salad",
    image: "/meal3.jpg" // Example image
  };

  // Calculate skip deadline (e.g., 10 AM on the delivery day)
  const skipDeadline = new Date();
  skipDeadline.setHours(10, 0, 0, 0);

  return (
    <div>
      <h2 className={styles.contentHeader}>Dashboard</h2>
      <div className={styles.mealCard}>
        <div className={styles.mealCardHeader}>
          <Image src={nextMeal.image} alt={nextMeal.name} width={100} height={100} className={styles.mealImage} />
          <div>
            <p style={{ color: 'var(--muted-text)', fontWeight: '700', margin: 0 }}>{nextMeal.type}</p>
            <h3 className={styles.mealTitle}>{nextMeal.name}</h3>
            <p className={styles.mealItems}>{nextMeal.items}</p>
          </div>
        </div>
        <div className={styles.mealCardBody}>
          <div className={styles.skipSection}>
            <button className={styles.skipButton}>Skip this Meal</button>
            <div className={styles.countdown}>
              <Countdown 
                date={skipDeadline}
                renderer={({ hours, minutes, seconds }) => (
                  <span>{hours}h {minutes}m {seconds}s</span>
                )}
              />
              <p>Time remaining to skip</p>
            </div>
          </div>
          <div className={styles.statusTracker}>
            <div className={`${styles.statusStep} ${styles.active}`}>Order Received</div>
            <div className={styles.statusStep}>In Kitchen</div>
            <div className={styles.statusStep}>Ready For Pick-up</div>
            <div className={styles.statusStep}>Out For Delivery</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (Other view components would go here)

export default function DashboardClient() { // Renamed to avoid confusion
  const [activeView, setActiveView] = useState('dashboard');
  const { user, logout } = useContext(AppContext);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <TodaysMeal />;
      // case 'subscription': return <MySubscription />;
      // case 'history': return <OrderHistory />;
      // case 'profile': return <ProfileSettings />;
      default: return <TodaysMeal />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* --- Left Column: Sidebar --- */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3 className={styles.welcomeTitle}>Welcome, {user?.name || 'User'}!</h3>
          <p className={styles.welcomeEmail}>{user?.email}</p>
        </div>
        <ul className={styles.sidebarNav}>
          <li>
            <button className={`${styles.navButton} ${activeView === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveView('dashboard')}>
              Dashboard
            </button>
          </li>
          <li>
            <button className={`${styles.navButton} ${activeView === 'subscription' ? styles.active : ''}`} onClick={() => setActiveView('subscription')}>
              My Subscription
            </button>
          </li>
           <li>
            <button className={`${styles.navButton} ${activeView === 'history' ? styles.active : ''}`} onClick={() => setActiveView('history')}>
              Order History
            </button>
          </li>
           <li>
            <button className={`${styles.navButton} ${activeView === 'profile' ? styles.active : ''}`} onClick={() => setActiveView('profile')}>
              Profile Settings
            </button>
          </li>
          <li><button className={styles.navButton} onClick={logout}>Logout</button></li>
        </ul>
      </aside>

      {/* --- Right Column: Content --- */}
      <main className={styles.contentBox}>
        {renderView()}
      </main>
    </div>
  );
}
