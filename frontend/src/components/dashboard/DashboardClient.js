'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Countdown from 'react-countdown';
import styles from './Dashboard.module.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { fetchProfile, fetchTodaysMeals, fetchSubscriptionStatus } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  Utensils, 
  History, 
  User, 
  LogOut,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  Truck,
  ChefHat,
  Package,
  CheckCircle
} from 'lucide-react';

// Enhanced Today's Meal Component
const TodaysMeal = () => {
  const { data: todaysMeals, isLoading } = useQuery({
    queryKey: ['todays-meals'],
    queryFn: fetchTodaysMeals,
  });

  const meal = todaysMeals?.[0] || { 
    type: "Today's Lunch", 
    name: "Paneer Butter Masala Meal", 
    items: "Paneer, 2 Rotis, Dal, Rice, Salad", 
    image: "/meal3.jpg",
    status: 'preparing',
    deliveryTime: '12:30 PM - 1:00 PM'
  };

  const skipDeadline = new Date();
  skipDeadline.setHours(10, 0, 0, 0);

  const statusSteps = [
    { key: 'ordered', label: 'Order Received', icon: Package },
    { key: 'preparing', label: 'In Kitchen', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: CheckCircle },
    { key: 'delivering', label: 'Out for Delivery', icon: Truck }
  ];

  const currentStatusIndex = statusSteps.findIndex(step => step.key === meal.status) || 0;

  return (
    <div className={styles.dashboardContent}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div>
          <h1 className={styles.welcomeTitle}>Good Morning! 👋</h1>
          <p className={styles.welcomeSubtitle}>Here&apos;s what&apos;s cooking today</p>
        </div>
        <div className={styles.deliveryInfo}>
          <Clock size={18} />
          <span>Delivery: {meal.deliveryTime}</span>
        </div>
      </div>

      {/* Today's Meals Grid */}
      <div className={styles.mealsGrid}>
        {/* Main Meal Card */}
        <div className={styles.mealCard}>
          <div className={styles.mealCardHeader}>
            <div className={styles.mealImageContainer}>
              <Image 
                src={meal.image} 
                alt={meal.name} 
                width={120} 
                height={120} 
                className={styles.mealImage}
              />
              <div className={styles.mealBadge}>{meal.type}</div>
            </div>
            <div className={styles.mealInfo}>
              <h3 className={styles.mealTitle}>{meal.name}</h3>
              <p className={styles.mealDescription}>{meal.items}</p>
              <div className={styles.mealStats}>
                <div className={styles.stat}>
                  <Clock size={16} />
                  <span>30 mins prep</span>
                </div>
                <div className={styles.stat}>
                  <Star size={16} />
                  <span>4.8 (120 reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className={styles.mealActions}>
            <button className={styles.skipButton}>
              Skip This Meal
            </button>
            <div className={styles.countdown}>
              <div className={styles.countdownTimer}>
                <Countdown 
                  date={skipDeadline}
                  renderer={({ hours, minutes, seconds }) => (
                    <span>{hours}h {minutes}m {seconds}s</span>
                  )}
                />
              </div>
              <p className={styles.countdownLabel}>Time remaining to skip</p>
            </div>
          </div>

          {/* Enhanced Status Tracker */}
          <div className={styles.statusTracker}>
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = index < currentStatusIndex;
              const isActive = index === currentStatusIndex;
              
              return (
                <div key={step.key} className={styles.statusStep}>
                  <div className={`
                    ${styles.statusIcon} 
                    ${isCompleted ? styles.completed : ''} 
                    ${isActive ? styles.active : ''}
                  `}>
                    <StepIcon size={20} />
                  </div>
                  <span className={`
                    ${styles.statusLabel} 
                    ${isCompleted || isActive ? styles.active : ''}
                  `}>
                    {step.label}
                  </span>
                  {index < statusSteps.length - 1 && (
                    <div className={`
                      ${styles.statusLine} 
                      ${isCompleted ? styles.completed : ''}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats Sidebar */}
        <div className={styles.statsSidebar}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Utensils size={24} />
            </div>
            <div className={styles.statContent}>
              <h4>Active Meals</h4>
              <p className={styles.statNumber}>12</p>
              <span className={styles.statLabel}>This week</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Star size={24} />
            </div>
            <div className={styles.statContent}>
              <h4>Meals Rated</h4>
              <p className={styles.statNumber}>8</p>
              <span className={styles.statLabel}>4.8 avg rating</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock size={24} />
            </div>
            <div className={styles.statContent}>
              <h4>Next Delivery</h4>
              <p className={styles.statNumber}>Tomorrow</p>
              <span className={styles.statLabel}>12:30 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Meals Section */}
      <div className={styles.upcomingSection}>
        <h3 className={styles.sectionTitle}>Upcoming Meals</h3>
        <div className={styles.upcomingGrid}>
          {[1, 2, 3].map((item) => (
            <div key={item} className={styles.upcomingCard}>
              <Image 
                src="/meal3.jpg" 
                alt="Upcoming meal" 
                width={80} 
                height={80} 
                className={styles.upcomingImage}
              />
              <div className={styles.upcomingInfo}>
                <h4>Butter Chicken Meal</h4>
                <p>Tomorrow&apos;s Lunch</p>
                <span className={styles.upcomingTime}>12:30 PM</span>
              </div>
              <ChevronRight size={20} className={styles.chevron} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = () => {
  const actions = [
    { icon: Utensils, label: 'Modify Subscription', color: '#f59e0b' },
    { icon: Clock, label: 'Pause Delivery', color: '#ef4444' },
    { icon: Star, label: 'Rate Meals', color: '#10b981' },
    { icon: MapPin, label: 'Delivery Address', color: '#3b82f6' }
  ];

  return (
    <div className={styles.quickActions}>
      <h3 className={styles.sectionTitle}>Quick Actions</h3>
      <div className={styles.actionsGrid}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button key={index} className={styles.actionButton}>
              <div 
                className={styles.actionIcon} 
                style={{ backgroundColor: `${action.color}20` }}
              >
                <Icon size={24} color={action.color} />
              </div>
              <span>{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function DashboardClient() {
  const [activeView, setActiveView] = useState('dashboard');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, clearToken } = useAuthStore();
  const isLoggedIn = !!token;

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: isLoggedIn,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscriptionStatus,
    enabled: isLoggedIn,
  });

  const handleLogout = () => {
    clearToken();
    queryClient.clear();
    router.push('/');
  };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: Home },
    { key: 'subscription', label: 'My Subscription', icon: Utensils },
    { key: 'history', label: 'Order History', icon: History },
    { key: 'profile', label: 'Profile Settings', icon: User },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': 
        return (
          <>
            <TodaysMeal />
            <QuickActions />
          </>
        );
      default: 
        return <TodaysMeal />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Enhanced Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.userAvatar}>
            <div className={styles.avatarPlaceholder}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
          <div className={styles.userInfo}>
            <h3 className={styles.welcomeTitle}>
              {isUserLoading ? '...' : (user?.name || 'User')}
            </h3>
            <p className={styles.welcomeEmail}>
              {isUserLoading ? '...' : (user?.email || '...')}
            </p>
            {subscription && (
              <div className={styles.subscriptionBadge}>
                Active Subscription
              </div>
            )}
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`${styles.navButton} ${activeView === item.key ? styles.active : ''}`}
                onClick={() => setActiveView(item.key)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
                <ChevronRight size={16} className={styles.navChevron} />
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {renderView()}
      </main>
    </div>
  );
}