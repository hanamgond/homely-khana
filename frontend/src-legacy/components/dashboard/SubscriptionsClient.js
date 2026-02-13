'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchWithToken } from '@/utils/CookieManagement';
import { format, addDays, isAfter, isBefore, parseISO } from 'date-fns';
import { Calendar, MapPin, Package, Clock, Zap, SkipForward, Edit, ExternalLink, Plus } from 'lucide-react';
import styles from './DashboardSubscriptions.module.css';

export default function SubscriptionsClient() {
  const [lunchSubs, setLunchSubs] = useState([]);
  const [dinnerSubs, setDinnerSubs] = useState([]);
  const [pastSubs, setPastSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fix: Added safe number parser
  const safeParseInt = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Get subscription status
  const getSubscriptionStatus = (sub) => {
    const mealsLeft = safeParseInt(sub.remaining_meals);
    const endDate = sub.end_date ? parseISO(sub.end_date) : null;
    const today = new Date();
    
    if (mealsLeft === 0) return 'completed';
    if (endDate && isBefore(endDate, addDays(today, 7))) return 'ending_soon';
    return 'active';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className={styles.badgeActive}>ACTIVE</span>;
      case 'ending_soon':
        return <span className={styles.badgeEndingSoon}>ENDING SOON</span>;
      case 'completed':
        return <span className={styles.badgeInactive}>COMPLETED</span>;
      default:
        return <span className={styles.badgeInactive}>INACTIVE</span>;
    }
  };

  // Get progress percentage
  const getProgressPercentage = (sub) => {
    const totalMeals = safeParseInt(sub.total_meals) || 30;
    const remainingMeals = safeParseInt(sub.remaining_meals);
    const consumed = totalMeals - remainingMeals;
    return Math.round((consumed / totalMeals) * 100);
  };

  // Parse delivery days from schedule
  const getDeliveryDays = (sub) => {
    // If schedule exists in data, use it
    if (sub.delivery_schedule) {
      try {
        return JSON.parse(sub.delivery_schedule);
      } catch (e) {
        return [];
      }
    }
    
    // Fallback based on meal type
    return sub.meal_type === 'dinner' 
      ? ['Monday', 'Wednesday', 'Friday'] 
      : ['Tuesday', 'Thursday', 'Saturday'];
  };

  // Get current day (for highlighting in schedule)
  const getCurrentDay = () => {
    return format(new Date(), 'EEEE');
  };

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        // FIXED: Changed "useDashboard" to "userDashboard"
        const res = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/userDashboard/subscriptions`);
        
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.success) {
          const subscriptions = data.data;
          
          // Filter by meal type (case-insensitive)
          const lunch = subscriptions.filter(s => 
            s.meal_type && s.meal_type.toLowerCase() === 'lunch'
          );
          const dinner = subscriptions.filter(s => 
            s.meal_type && s.meal_type.toLowerCase() === 'dinner'
          );
          
          // Separate active and past subscriptions
          const activeLunch = lunch.filter(s => getSubscriptionStatus(s) !== 'completed');
          const activeDinner = dinner.filter(s => getSubscriptionStatus(s) !== 'completed');
          const pastSubscriptions = [...lunch, ...dinner].filter(s => 
            getSubscriptionStatus(s) === 'completed'
          );
          
          setLunchSubs(activeLunch);
          setDinnerSubs(activeDinner);
          setPastSubs(pastSubs);
          
          console.log('✅ Subscriptions loaded:', {
            lunch: activeLunch.length,
            dinner: activeDinner.length,
            past: pastSubs.length
          });
        } else {
          throw new Error(data.error || 'Failed to load subscriptions');
        }
      } catch (err) {
        console.error("Error loading subscriptions", err);
        setError(err.message);
        
        // Demo data for development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Loading demo subscription data...');
          setLunchSubs([
            {
              id: 1,
              product_name: 'Healthy Meal - Lunch',
              plan_name: 'PRO Plan',
              remaining_meals: '12',
              total_meals: '30',
              end_date: addDays(new Date(), 20).toISOString(),
              image_url: '/meal-placeholder.jpg',
              delivery_address: JSON.stringify({
                address_line_1: '123 Main Street',
                city: 'Mumbai'
              }),
              meal_type: 'lunch'
            }
          ]);
          setDinnerSubs([
            {
              id: 2,
              product_name: 'Healthy Meal - Dinner',
              plan_name: 'PREMIUM Plan',
              remaining_meals: '8',
              total_meals: '20',
              end_date: addDays(new Date(), 10).toISOString(),
              image_url: '/meal-placeholder.jpg',
              delivery_address: JSON.stringify({
                address_line_1: 'Business Bay',
                city: 'Navi Mumbai'
              }),
              meal_type: 'dinner'
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  // Handle skip delivery
  const handleSkipDelivery = async (subscriptionId) => {
    try {
      // In production: Call skip API endpoint
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('Next delivery skipped successfully!');
    } catch (error) {
      alert('Failed to skip delivery. Please try again.');
    }
  };

  // Handle edit subscription
  const handleEditSubscription = (subscriptionId) => {
    // Navigate to edit page or show modal
    console.log('Edit subscription:', subscriptionId);
  };

  // Render subscription card
  const renderSubscriptionCard = (sub) => {
    let address = {};
    try { 
      address = typeof sub.delivery_address === 'string' 
        ? JSON.parse(sub.delivery_address) 
        : sub.delivery_address || {}; 
    } catch(e){}
    
    const status = getSubscriptionStatus(sub);
    const progressPercent = getProgressPercentage(sub);
    const deliveryDays = getDeliveryDays(sub);
    const currentDay = getCurrentDay();
    const mealsLeft = safeParseInt(sub.remaining_meals);
    const nextDelivery = sub.next_delivery_date || 
                       (sub.end_date ? format(parseISO(sub.end_date), 'MMM d') : 'N/A');

    return (
      <div key={sub.id || sub.booking_item_id} className={styles.subscriptionCard}>
        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div className={styles.planInfo}>
            <Image 
              src={sub.image_url || "/meal-placeholder.jpg"} 
              alt="Meal" 
              height={70} 
              width={70} 
              className={styles.mealImage}
            />
            <div className={styles.planDetails}>
              <h4>{sub.product_name || 'Healthy Meal'}</h4>
              <p>{sub.plan_name || 'Standard Plan'}</p>
            </div>
          </div>
          {getStatusBadge(status)}
        </div>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>
            <span>Progress</span>
            <span>{progressPercent}% completed</span>
          </div>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{
                width: `${progressPercent}%`,
                background: status === 'ending_soon' ? '#f59e0b' : 
                           status === 'active' ? '#10b981' : '#9ca3af'
              }}
            />
          </div>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <Package size={16} color="#FF9801"/>
            <span>Remaining: <b>{mealsLeft}</b> meals</span>
          </div>
          <div className={styles.infoItem}>
            <Calendar size={16} color="#FF9801"/>
            <span>Ends: {sub.end_date ? format(parseISO(sub.end_date), 'MMM d') : 'N/A'}</span>
          </div>
          <div className={styles.infoItem}>
            <Clock size={16} color="#FF9801"/>
            <span>Next: {nextDelivery}</span>
          </div>
          <div className={styles.infoItem}>
            <Zap size={16} color="#FF9801"/>
            <span>Status: <b>{status.replace('_', ' ')}</b></span>
          </div>
        </div>

        {/* Delivery Schedule */}
        <div className={styles.deliverySchedule}>
          <p className={styles.scheduleTitle}>Delivery Days</p>
          <div className={styles.daysGrid}>
            {deliveryDays.map((day, idx) => (
              <span 
                key={idx}
                className={`${styles.dayPill} ${day === currentDay ? styles.active : ''}`}
              >
                {day.slice(0, 3)}
              </span>
            ))}
          </div>
        </div>

        {/* Delivery Address */}
        <div className={styles.addressSection}>
          <MapPin size={16} color="#888" />
          <span className={styles.addressText}>
            {address.address_line_1}, {address.city || 'Mumbai'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionButton} ${styles.secondaryButton}`}
            onClick={() => handleEditSubscription(sub.id)}
          >
            <Edit size={16} /> Manage
          </button>
          {status === 'active' && (
            <button 
              className={`${styles.actionButton} ${styles.warningButton}`}
              onClick={() => handleSkipDelivery(sub.id)}
            >
              <SkipForward size={16} /> Skip Next
            </button>
          )}
          <button 
            className={`${styles.actionButton} ${styles.primaryButton}`}
            onClick={() => window.location.href = `/subscription/${sub.id}`}
          >
            <ExternalLink size={16} /> Details
          </button>
        </div>
      </div>
    );
  };

  // Render past subscription item
  const renderPastSubscription = (sub, index) => {
    return (
      <div key={index} className={styles.historyItem}>
        <div>
          <div className={styles.historyName}>
            {sub.product_name || 'Healthy Meal'} - {sub.plan_name || 'Standard'}
          </div>
          <div className={styles.historyDetails}>
            {sub.end_date ? format(parseISO(sub.end_date), 'MMM yyyy') : 'Previous'}
          </div>
        </div>
        <span className={`${styles.historyStatus} ${styles.statusCompleted}`}>
          COMPLETED
        </span>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div>
        <h2 className={styles.headerTitle}>My Subscriptions</h2>
        <p className={styles.headerSubtitle}>Manage all your active meal plans</p>
      </div>

      {error && (
        <div className={styles.errorCard}>
          <p>Error: {error}</p>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p>Loading your subscriptions...</p>
        </div>
      ) : (
        <>
          {/* Active Subscriptions Section */}
          <div>
            <h3 className={styles.sectionTitle}>Lunch Plans</h3>
            {lunchSubs.length > 0 ? (
              <div className={styles.subscriptionGrid}>
                {lunchSubs.map(renderSubscriptionCard)}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Package size={40} className={styles.emptyStateIcon} />
                <p>No active lunch plans.</p>
                <button className={styles.ctaButton}>
                  <Plus size={18} /> Add Lunch Plan
                </button>
              </div>
            )}
          </div>

          <div style={{ marginTop: '2.5rem' }}>
            <h3 className={styles.sectionTitle}>Dinner Plans</h3>
            {dinnerSubs.length > 0 ? (
              <div className={styles.subscriptionGrid}>
                {dinnerSubs.map(renderSubscriptionCard)}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <Package size={40} className={styles.emptyStateIcon} />
                <p>No active dinner plans.</p>
                <button className={styles.ctaButton}>
                  <Plus size={18} /> Add Dinner Plan
                </button>
              </div>
            )}
          </div>

          {/* Past Subscriptions Section */}
          {pastSubs.length > 0 && (
            <div className={styles.historySection}>
              <h3 className={styles.sectionTitle}>Subscription History</h3>
              <div className={styles.historyList}>
                {pastSubs.slice(0, 5).map(renderPastSubscription)}
              </div>
              {pastSubs.length > 5 && (
                <button className={styles.viewAllButton}>
                  View All Past Subscriptions ({pastSubs.length})
                </button>
              )}
            </div>
          )}

          {/* Add New Plan CTA */}
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button 
              className={styles.ctaButton}
              onClick={() => window.location.href = '/pricing'}
            >
              <Plus size={20} /> Explore More Plans
            </button>
          </div>
        </>
      )}
    </div>
  );
}