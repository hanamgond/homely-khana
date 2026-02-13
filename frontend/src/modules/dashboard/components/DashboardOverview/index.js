//frontend/src/modules/dashboard/componets/DashboardOverview/index.js 
'use client';

import { useState, useEffect, useContext, useCallback } from 'react';
import { z } from 'zod';
import Image from 'next/image';
import { AppContext } from '@/shared/lib/AppContext';
import { Calendar, Package, Clock, MapPin, ChevronRight, SkipForward, MessageCircle, Truck, CheckCircle, XCircle, DollarSign, CreditCard, RefreshCw } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';
import { dashboardAPI, dataFormatters } from '@/shared/lib/api';
import styles from './Overview.module.css';
import { NextDeliverySchema, SubscriptionSchema } from '../../models'; // <--- ADD THIS

export default function DashboardOverview() {
  const { user } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState({
    nextMeal: null,
    stats: { activePlans: 0, mealsLeft: 0, upcomingDeliveries: 0, totalSpent: 0 },
    subscriptions: [],
    upcomingSchedule: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skipLoading, setSkipLoading] = useState(false);

const loadData = useCallback(async () => {
    console.log('🔍 [DashboardOverview] Starting enhanced data load...');
    setError(null);
    setLoading(true);
    
    try {
      // Load all data in parallel
      const [
        nextDeliveryRes,
        enhancedSubsRes,
        recentActivityRes,
        upcomingScheduleRes
      ] = await Promise.allSettled([
        dashboardAPI.getNextDelivery(),
        dashboardAPI.getEnhancedSubscriptions(),
        dashboardAPI.getRecentActivity(),
        dashboardAPI.getUpcomingSchedule()
      ]);
      
      // --- 1. HANDLE NEXT DELIVERY (With Validation) ---
      let nextMeal = null;
      if (nextDeliveryRes.status === 'fulfilled' && nextDeliveryRes.value.success) {
        const rawData = nextDeliveryRes.value.data;
        
        // 🛡️ CONTRACT CHECK
        if (rawData) {
          try {
            NextDeliverySchema.parse(rawData);
            console.log("✅ Contract Passed: Next Delivery");
          } catch (validationError) {
            console.error("🚨 CONTRACT BREACH: Next Delivery data invalid", validationError.errors);
            // In strict mode, you might want to throw here. For now, we log loud errors.
          }
        }

        nextMeal = dataFormatters.formatNextDelivery(rawData);
      }
      
      // --- 2. HANDLE SUBSCRIPTIONS (With Validation) ---
      let subscriptions = [];
      let stats = { activePlans: 0, mealsLeft: 0, upcomingDeliveries: 0, totalSpent: 0 };
      
      if (enhancedSubsRes.status === 'fulfilled' && enhancedSubsRes.value.success) {
        const rawData = enhancedSubsRes.value.data;

        // 🛡️ CONTRACT CHECK
        try {
          // Validate that rawData is an Array of Subscriptions
          z.array(SubscriptionSchema).parse(rawData);
          console.log("✅ Contract Passed: Subscriptions");
        } catch (validationError) {
          console.error("🚨 CONTRACT BREACH: Subscription data invalid", validationError.errors);
        }

        subscriptions = dataFormatters.formatSubscriptions(rawData);
        
        // Calculate stats (Existing logic)
        const activeSubs = subscriptions.filter(s => s.remaining_meals > 0);
        const totalMealsLeft = activeSubs.reduce((acc, curr) => acc + curr.remaining_meals, 0);
        const totalSpent = subscriptions.reduce((acc, curr) => acc + curr.total_amount, 0);
        
        stats = {
          activePlans: activeSubs.length,
          mealsLeft: totalMealsLeft,
          upcomingDeliveries: 0,
          totalSpent: totalSpent
        };
      }
      
      // --- 3. HANDLE UPCOMING SCHEDULE ---
      let upcomingSchedule = [];
      if (upcomingScheduleRes.status === 'fulfilled' && upcomingScheduleRes.value.success) {
        // Note: We skip validation here for now as upcomingSchedule is complex derived data
        upcomingSchedule = dataFormatters.formatUpcomingSchedule(upcomingScheduleRes.value.data);
        
        stats.upcomingDeliveries = upcomingSchedule.reduce(
          (acc, day) => acc + day.meals.length, 0
        );
      }
      
      // --- 4. HANDLE RECENT ACTIVITY ---
      let recentActivity = [];
      if (recentActivityRes.status === 'fulfilled' && recentActivityRes.value.success) {
        recentActivity = dataFormatters.formatRecentActivity(recentActivityRes.value.data);
      }
      
      setDashboardData({
        nextMeal,
        stats,
        subscriptions,
        upcomingSchedule,
        recentActivity
      });
      
      console.log('✅ Enhanced dashboard data loaded successfully');
      
    } catch (e) { 
      console.error("❌ [DashboardOverview Error]:", e); 
      setError(e.message || 'Failed to load dashboard data');
    } finally { 
      setLoading(false); 
    }
  }, []);

  const handleSkipNextMeal = async () => {
    if (!dashboardData.nextMeal) return;
    
    setSkipLoading(true);
    try {
      // TODO: Implement actual skip API
      // await api.post(`/api/userDashboard/skip/${dashboardData.nextMeal.delivery_id}`);
      alert('Skip meal functionality coming soon!');
    } catch (error) {
      alert('Failed to skip meal. Please try again.');
    } finally {
      setSkipLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get icon component based on type
  const getActivityIcon = (iconType) => {
    switch (iconType) {
      case 'skip':
        return <SkipForward size={16} />;
      case 'delivered':
        return <CheckCircle size={16} />;
      case 'delivery':
        return <Truck size={16} />;
      case 'payment':
        return <CreditCard size={16} />;
      case 'payment-pending':
        return <Clock size={16} />;
      default:
        return <RefreshCw size={16} />;
    }
  };

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

  // Render meal details section
  const renderMealDetails = (meal) => {
    if (!meal) return null;
    
    return (
      <div className={styles.mealDetailsCard}>
        <div className={styles.mealDetailRow}>
          <div className={styles.mealDetailItem}>
            <span className={styles.detailLabel}>Meal Session:</span>
            <span className={styles.detailValue}>{meal.meal_session || 'Lunch'}</span>
          </div>
          <div className={styles.mealDetailItem}>
            <span className={styles.detailLabel}>Meal Type:</span>
            <span className={styles.detailValue}>{meal.product_name || 'Standard Meal'}</span>
          </div>
        </div>
        
        <div className={styles.mealDetailRow}>
          <div className={styles.mealDetailItem}>
            <span className={styles.detailLabel}>Plan:</span>
            <span className={styles.detailValue}>{meal.plan_name || 'Standard Plan'}</span>
          </div>
          <div className={styles.mealDetailItem}>
            <span className={styles.detailLabel}>Payment:</span>
            <span className={styles.detailValue}>
              {meal.payment_method === 'online' ? 'Online' : 'COD'} • {meal.payment_status || 'Completed'}
            </span>
          </div>
        </div>
        
        {meal.delivery_slot && (
          <div className={styles.mealDetailRow}>
            <div className={styles.mealDetailItem}>
              <span className={styles.detailLabel}>Delivery Time:</span>
              <span className={styles.detailValue}>{meal.delivery_time}</span>
            </div>
          </div>
        )}
        
        <div className={styles.mealDetailRow}>
          <div className={styles.mealDetailItem} style={{ width: '100%' }}>
            <span className={styles.detailLabel}>Delivery Address:</span>
            <span className={styles.detailValue}>{meal.address}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className={styles.subtitle}>
            Loading your dashboard...
          </p>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Fetching your meal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className={styles.subtitle}>
          Here&apos;s what&apos;s happening with your food today.
          <span className={styles.date}>
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className={styles.errorCard}>
          <XCircle size={20} />
          <div className={styles.errorContent}>
            <strong>Error Loading Data:</strong> {error}
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
              {dashboardData.stats.activePlans}
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
              {dashboardData.stats.mealsLeft}
            </h3>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{
                width: `${Math.min((dashboardData.stats.mealsLeft / 60) * 100, 100)}%`,
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
            <h3 className={styles.statValue}>
              {dashboardData.nextMeal ? 
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

        {/* Total Spent Card */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#f3e8ff' }}>
            <DollarSign color="#7c3aed" size={22} />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Spent</p>
            <h3 className={styles.statValue}>
              ₹{dashboardData.stats.totalSpent.toLocaleString('en-IN')}
            </h3>
            <p className={styles.statSubtext}>across all plans</p>
          </div>
        </div>
      </div>

      {/* Today's Meal Card */}
      <div className={styles.mealSection}>
        <h3 className={styles.sectionTitle}>Today&apos;s Meal</h3>
        {dashboardData.nextMeal && isToday(new Date(dashboardData.nextMeal.delivery_date)) ? (
          <>
            <div className={styles.mealCard}>
              <div className={styles.mealContent}>
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
                      <span>{dashboardData.nextMeal.address}</span>
                    </div>
                    <button className={styles.trackButton}>
                      Track Delivery <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Meal Details Section */}
            {renderMealDetails(dashboardData.nextMeal)}
          </>
        ) : (
          <div className={styles.emptyMealCard}>
            <Calendar size={40} color="#9ca3af" />
            <h3>No meal today</h3>
            <p>
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
          <h3 className={styles.sectionTitle}>Upcoming Schedule</h3>
          <div className={styles.calendarCard}>
            <div className={styles.calendarGrid}>
              {dashboardData.upcomingSchedule.map((day, index) => (
                <div 
                  key={index} 
                  className={`${styles.calendarDay} ${day.isToday ? styles.today : ''}`}
                >
                  <div className={styles.calendarDayHeader}>
                    <div className={styles.dayName}>
                      {day.dayName}
                    </div>
                    <div className={styles.dateNum}>
                      {day.dateNum}
                    </div>
                  </div>
                  <div className={styles.calendarMeals}>
                    {day.meals.length > 0 ? (
                      day.meals.map((meal, mealIdx) => (
                        <div 
                          key={mealIdx} 
                          className={`${styles.mealIndicator} ${meal.isSkipped ? styles.skipped : ''} ${meal.type === 'lunch' ? styles.lunch : styles.dinner}`}
                          title={`${meal.session}: ${meal.name}`}
                        >
                          {meal.isSkipped ? '✕' : meal.session.charAt(0)}
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
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div 
                    className={styles.activityIcon}
                    style={{ background: `${activity.iconColor}20`, color: activity.iconColor }}
                  >
                    {getActivityIcon(activity.iconType)}
                  </div>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{activity.action}</p>
                    <span className={styles.activityTime}>{activity.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyActivity}>
                <p>No recent activity</p>
                <small>Your activity will appear here</small>
              </div>
            )}
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