'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import Image from 'next/image';
import { fetchWithToken } from '@/utils/CookieManagement';
import { AppContext } from '@/utils/AppContext';
import { Calendar, Package, Clock, MapPin, ChevronRight, SkipForward, MessageCircle, Truck, CheckCircle, XCircle } from 'lucide-react';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import styles from './Dashboard.module.css';

export default function DashboardClient() {
  const { user } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState({
    nextMeal: null,
    stats: { activePlans: 0, mealsLeft: 0, upcomingDeliveries: 0 },
    subscriptions: [],
    upcomingSchedule: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);

  // Safe number parser to prevent "0307" bug
  const safeParseInt = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Generate upcoming schedule (next 7 days)
  const generateUpcomingSchedule = (subscriptions) => {
    const schedule = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const dayMeals = [];
      
      // Check each subscription for deliveries on this date
      subscriptions.forEach(sub => {
        if (sub.remaining_meals > 0) {
          // Simplified logic - in production, check actual delivery schedule
          const deliveryDays = sub.delivery_days || ['monday', 'wednesday', 'friday'];
          const dayName = format(date, 'EEEE').toLowerCase();
          
          if (deliveryDays.includes(dayName)) {
            dayMeals.push({
              type: sub.meal_type || 'lunch',
              name: sub.product_name,
              isSkipped: Math.random() > 0.8 && i > 0 // Random skip for demo
            });
          }
        }
      });
      
      schedule.push({
        date,
        dayName: format(date, 'EEE'),
        dateNum: format(date, 'd'),
        meals: dayMeals,
        isToday: i === 0,
        isTomorrow: i === 1
      });
    }
    
    return schedule;
  };

  // Generate recent activity
  const generateRecentActivity = () => {
    return [
      { id: 1, action: 'Skipped tomorrow&apos;s dinner', time: '2 hours ago', icon: SkipForward, type: 'user' },
      { id: 2, action: 'Address updated to "Work"', time: '1 day ago', icon: MapPin, type: 'user' },
      { id: 3, action: 'Subscription renewed for 30 days', time: '2 days ago', icon: CheckCircle, type: 'system' },
      { id: 4, action: 'Meal delivered successfully', time: '3 days ago', icon: Truck, type: 'system' }
    ];
  };

  const loadData = useCallback(async () => {
    console.log('🔍 [DashboardClient] Starting data load...');
    setError(null);
    
    try {
      // 1. Load next delivery
      const mealUrl = `${process.env.NEXT_PUBLIC_URL}/api/userDashboard/next-delivery`;
      const mealRes = await fetchWithToken(mealUrl);
      
      if (!mealRes.ok) throw new Error(`Next delivery API failed: ${mealRes.status}`);
      
      const mealText = await mealRes.text();
      if (mealText.trim().startsWith('<!DOCTYPE') || mealText.trim().startsWith('<html')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      const mealData = JSON.parse(mealText);
      
      // 2. Load subscriptions
      const subUrl = `${process.env.NEXT_PUBLIC_URL}/api/userDashboard/subscriptions`;
      const subRes = await fetchWithToken(subUrl);
      
      if (!subRes.ok) throw new Error(`Subscriptions API failed: ${subRes.status}`);
      
      const subText = await subRes.text();
      if (subText.trim().startsWith('<!DOCTYPE') || subText.trim().startsWith('<html')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      const subData = JSON.parse(subText);
      
      if (mealData.success && subData.success) {
        // Calculate stats SAFELY (prevent "0307" bug)
        const activeSubs = subData.data.filter(s => safeParseInt(s.remaining_meals) > 0);
        const totalMealsLeft = activeSubs.reduce((acc, curr) => acc + safeParseInt(curr.remaining_meals), 0);
        
        // Generate upcoming schedule
        const upcomingSchedule = generateUpcomingSchedule(subData.data);
        
        // Generate recent activity
        const recentActivity = generateRecentActivity();
        
        setDashboardData({
          nextMeal: mealData.data,
          stats: {
            activePlans: activeSubs.length,
            mealsLeft: totalMealsLeft,
            upcomingDeliveries: upcomingSchedule.filter(day => day.meals.length > 0).length
          },
          subscriptions: subData.data,
          upcomingSchedule,
          recentActivity
        });
        
        console.log('✅ Dashboard data loaded successfully');
      } else {
        throw new Error(mealData.error || subData.error || 'API returned success:false');
      }
      
    } catch (e) { 
      console.error("❌ [DashboardClient Error]:", e); 
      setError(e.message);
      
      // Fallback to demo data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Loading demo data for development...');
        setDashboardData({
          nextMeal: {
            delivery_date: addDays(new Date(), 1),
            product_name: 'Healthy Meal - Lunch',
            image_url: '/meal-placeholder.jpg',
            items_description: 'Rice, Dal, Sabzi, Roti, Salad',
            delivery_time: '12:30 PM',
            address: 'Home - 123 Main St, Mumbai'
          },
          stats: { activePlans: 2, mealsLeft: 14, upcomingDeliveries: 5 },
          subscriptions: [],
          upcomingSchedule: generateUpcomingSchedule([]),
          recentActivity: generateRecentActivity()
        });
      }
    } finally { 
      setLoading(false); 
    }
  }, []);

  const handleSkipNextMeal = async () => {
    if (!dashboardData.nextMeal) return;
    
    setSkipLoading(true);
    try {
      // In production: Call skip API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // Update local state
      setDashboardData(prev => ({
        ...prev,
        recentActivity: [
          { id: Date.now(), action: 'Skipped next meal', time: 'Just now', icon: SkipForward, type: 'user' },
          ...prev.recentActivity
        ]
      }));
      
      alert('Next meal skipped successfully!');
    } catch (error) {
      alert('Failed to skip meal. Please try again.');
    } finally {
      setSkipLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick actions data
  const quickActions = [
    { 
      label: 'Skip Next Meal', 
      icon: SkipForward, 
      action: handleSkipNextMeal,
      loading: skipLoading,
      color: '#f59e0b'
    },
    { 
      label: 'Contact Support', 
      icon: MessageCircle, 
      action: () => window.location.href = '/dashboard/contact',
      color: '#3b82f6'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem 3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', paddingTop: '1rem' }}>
        <h1 className={styles.headerTitle}>
          Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className={styles.headerSubtitle}>
          Here&apos;s what&apos;s happening with your food today.
          <span style={{ color: '#666', fontSize: '0.9rem', marginLeft: '1rem' }}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorCard}>
          <XCircle size={20} />
          <div>
            <strong>Error Loading Data:</strong> {error}
            <br />
            <small style={{ color: '#666' }}>
              Showing demo data. Make sure backend is running.
            </small>
          </div>
          <button 
            onClick={loadData} 
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid - 4 Cards */}
      <div className={styles.statsGrid}>
        {/* Active Plans Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#e0f2fe' }}>
            <Package color="#0284c7" size={22} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Active Plans</p>
            <h3 className={styles.statValue}>
              {loading ? '...' : dashboardData.stats.activePlans}
            </h3>
            <p className={styles.statSubtext}>across lunch &amp; dinner</p>
          </div>
        </div>

        {/* Meals Remaining Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#dcfce7' }}>
            <Calendar color="#16a34a" size={22} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Meals Remaining</p>
            <h3 className={styles.statValue}>
              {loading ? '...' : dashboardData.stats.mealsLeft}
            </h3>
            <div className={styles.progressBar}>
              <div style={{
                width: `${Math.min((dashboardData.stats.mealsLeft / 30) * 100, 100)}%`,
                height: '4px',
                background: '#16a34a',
                borderRadius: '2px'
              }} />
            </div>
          </div>
        </div>

        {/* Next Delivery Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
            <Clock color="#d97706" size={22} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Next Delivery</p>
            <h3 className={styles.statValue} style={{ fontSize: '1.1rem' }}>
              {loading ? '...' : dashboardData.nextMeal ? 
                (isToday(new Date(dashboardData.nextMeal.delivery_date)) ? 'Today' :
                 isTomorrow(new Date(dashboardData.nextMeal.delivery_date)) ? 'Tomorrow' :
                 format(new Date(dashboardData.nextMeal.delivery_date), 'MMM d')) 
                : 'None'}
            </h3>
            <p className={styles.statSubtext}>
              {dashboardData.nextMeal?.delivery_time || 'Not scheduled'}
            </p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className={styles.statCard}>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Quick Actions</p>
            <div className={styles.quickActions}>
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.action}
                  disabled={action.loading}
                  className={styles.quickActionButton}
                  style={{ borderColor: action.color }}
                >
                  <action.icon size={16} color={action.color} />
                  <span style={{ color: action.color, fontSize: '0.85rem' }}>
                    {action.loading ? 'Processing...' : action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Meal Card */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 className={styles.sectionTitle}>Today&apos;s Meal</h3>
        {loading ? (
          <div className={styles.loadingCard}>
            <div className={styles.spinner} />
            <p>Loading today&apos;s meal...</p>
          </div>
        ) : dashboardData.nextMeal && isToday(new Date(dashboardData.nextMeal.delivery_date)) ? (
          <div className={styles.mainCard}>
            <div className={styles.mealCardContent}>
              <Image 
                src={dashboardData.nextMeal.image_url || "/meal-placeholder.jpg"} 
                width={140} 
                height={140} 
                alt="Today's Meal" 
                className={styles.mealImage}
              />
              <div className={styles.mealDetails}>
                <div className={styles.mealHeader}>
                  <span className={styles.tag}>TODAY&apos;S MEAL</span>
                  <span className={styles.timeBadge}>
                    <Clock size={14} /> {dashboardData.nextMeal.delivery_time}
                  </span>
                </div>
                <h3 className={styles.mealTitle}>{dashboardData.nextMeal.product_name}</h3>
                <p className={styles.mealDescription}>{dashboardData.nextMeal.items_description}</p>
                <div className={styles.mealFooter}>
                  <div className={styles.addressInfo}>
                    <MapPin size={16} color="#666" />
                    <span>{dashboardData.nextMeal.address || 'Home - 123 Main St, Mumbai'}</span>
                  </div>
                  <button className={styles.trackButton}>
                    Track Delivery <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyMealCard}>
            <Calendar size={40} color="#9ca3af" />
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>No meal today</h3>
            <p style={{ color: '#6b7280' }}>
              {dashboardData.nextMeal ? 
                `Your next meal is on ${format(new Date(dashboardData.nextMeal.delivery_date), 'MMM d')}` : 
                'No upcoming meals scheduled'}
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout for Upcoming & Activity */}
      <div className={styles.twoColumnGrid}>
        {/* Upcoming Deliveries */}
        <div>
          <h3 className={styles.sectionTitle}>Upcoming Deliveries</h3>
          <div className={styles.calendarCard}>
            <div className={styles.calendarGrid}>
              {dashboardData.upcomingSchedule.map((day, index) => (
                <div 
                  key={index} 
                  className={styles.calendarDay}
                  style={{
                    background: day.isToday ? '#FF9801' : 'transparent',
                    color: day.isToday ? 'white' : '#333'
                  }}
                >
                  <div className={styles.calendarDayHeader}>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: '600',
                      opacity: day.isToday ? 1 : 0.7 
                    }}>
                      {day.dayName}
                    </div>
                    <div style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '700',
                      marginTop: '0.2rem'
                    }}>
                      {day.dateNum}
                    </div>
                  </div>
                  <div className={styles.calendarMeals}>
                    {day.meals.length > 0 ? (
                      day.meals.map((meal, mealIdx) => (
                        <div 
                          key={mealIdx} 
                          className={styles.mealIndicator}
                          style={{
                            background: meal.isSkipped ? '#fee2e2' : 
                                      meal.type === 'lunch' ? '#dbeafe' : '#f0fdf4',
                            color: meal.isSkipped ? '#dc2626' : 
                                  meal.type === 'lunch' ? '#1d4ed8' : '#047857'
                          }}
                        >
                          {meal.isSkipped ? 'Skipped' : meal.type.charAt(0).toUpperCase()}
                        </div>
                      ))
                    ) : (
                      <div className={styles.noMealIndicator}>–</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.calendarLegend}>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: '#dbeafe' }} />
                <span>Lunch</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: '#f0fdf4' }} />
                <span>Dinner</span>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ background: '#fee2e2' }} />
                <span>Skipped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          <div className={styles.activityCard}>
            {dashboardData.recentActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon} style={{
                    background: activity.type === 'user' ? '#e0f2fe' : '#f0fdf4'
                  }}>
                    <Icon size={16} color={activity.type === 'user' ? '#0284c7' : '#10b981'} />
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{activity.action}</p>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              );
            })}
            <button 
              className={styles.viewAllButton}
              onClick={() => window.location.href = '/dashboard/history'}
            >
              View Full History <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}