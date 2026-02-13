//frontend/src/shared/lib/api.js
import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("Unauthorized! Token might be invalid.");
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Enhanced Dashboard API functions
// ============================================

export const dataFormatters = {
  // Format enhanced next delivery data
  formatNextDelivery(backendData) {
    if (!backendData) return null;
    
    // Extract address
    let address = 'Address not specified';
    if (backendData.delivery_address) {
      try {
        const addr = typeof backendData.delivery_address === 'string' 
          ? JSON.parse(backendData.delivery_address)
          : backendData.delivery_address;
        
        address = `${addr.address_line_1 || ''}, ${addr.city || ''}`.trim();
        if (address.endsWith(',')) address = address.slice(0, -1);
      } catch (e) {
        console.error('Error parsing address:', e);
      }
    }
    
    return {
      delivery_id: backendData.delivery_id || backendData.id,
      delivery_date: backendData.delivery_date,
      product_name: backendData.product_name || 'Upcoming Meal',
      plan_name: backendData.plan_name || 'Standard Plan',
      image_url: backendData.image_url || '/meal-placeholder.jpg',
      items_description: backendData.items_description || 'Meal details coming soon',
      delivery_time: backendData.delivery_slot === 'lunch' ? '12:00 PM - 2:00 PM' : 
                    backendData.delivery_slot === 'dinner' ? '7:00 PM - 9:00 PM' : 
                    backendData.delivery_slot || '12:00 PM',
      address: address,
      meal_type: backendData.meal_type || 'lunch',
      meal_session: backendData.meal_type === 'lunch' ? 'Lunch' : 'Dinner',
      status: backendData.status || 'scheduled',
      delivery_slot: backendData.delivery_slot,
      payment_method: backendData.payment_method || 'online',
      payment_status: backendData.payment_status || 'completed'
    };
  },

  // Format enhanced subscriptions data
  formatSubscriptions(backendSubscriptions) {
    return backendSubscriptions.map(sub => {
      // Parse delivery address
      let deliveryAddress = {};
      let deliveryDays = sub.delivery_days || [];
      let frequency = sub.frequency || 'Custom schedule';
      
      try {
        if (sub.delivery_address) {
          deliveryAddress = typeof sub.delivery_address === 'string' 
            ? JSON.parse(sub.delivery_address) 
            : sub.delivery_address;
        }
      } catch (e) {
        console.error('Error parsing subscription data:', e);
      }
      
      // Format payment method
      const paymentMethod = sub.payment_method === 'online' ? 'Online Payment' :
                           sub.payment_method === 'cod' ? 'Cash on Delivery' :
                           sub.payment_method || 'Not specified';
      
      // Calculate progress
      const totalMeals = parseInt(sub.total_meals) || parseInt(sub.duration_days) || 30;
      const remainingMeals = parseInt(sub.remaining_meals) || 0;
      const consumed = totalMeals - remainingMeals;
      const progressPercent = Math.round((consumed / totalMeals) * 100);
      
      return {
        id: sub.booking_item_id || sub.id,
        product_name: sub.product_name || 'Subscription',
        plan_name: sub.plan_name || 'Standard Plan',
        plan_price: parseFloat(sub.plan_price) || 0,
        remaining_meals: remainingMeals,
        total_meals: totalMeals,
        progress_percent: progressPercent,
        end_date: sub.end_date,
        start_date: sub.start_date,
        booking_date: sub.booking_date,
        image_url: sub.image_url || '/meal-placeholder.jpg',
        delivery_address: deliveryAddress,
        delivery_days: deliveryDays,
        frequency: frequency,
        meal_type: sub.meal_type?.toLowerCase() || 'lunch',
        meal_session: sub.meal_type === 'lunch' ? 'Lunch' : 'Dinner',
        payment_method: sub.payment_method,
        payment_method_display: paymentMethod,
        payment_status: sub.payment_status,
        total_amount: parseFloat(sub.total_amount) || 0,
        duration_days: parseInt(sub.duration_days) || 30
      };
    });
  },

  // Format upcoming schedule
  formatUpcomingSchedule(backendSchedule) {
    const scheduleByDate = {};
    
    backendSchedule.forEach(delivery => {
      const date = delivery.delivery_date;
      if (!scheduleByDate[date]) {
        scheduleByDate[date] = [];
      }
      
      // Parse address
      let address = 'Address not specified';
      if (delivery.delivery_address) {
        try {
          const addr = typeof delivery.delivery_address === 'string' 
            ? JSON.parse(delivery.delivery_address)
            : delivery.delivery_address;
          
          address = `${addr.address_line_1 || ''}`;
        } catch (e) {
          console.error('Error parsing address:', e);
        }
      }
      
      scheduleByDate[date].push({
        id: delivery.id,
        meal_type: delivery.meal_type || 'lunch',
        meal_session: delivery.meal_type === 'lunch' ? 'Lunch' : 'Dinner',
        product_name: delivery.product_name || 'Meal',
        plan_name: delivery.plan_name || 'Plan',
        delivery_slot: delivery.delivery_slot,
        status: delivery.status,
        address: address
      });
    });
    
    // Convert to array format for calendar display
    const today = new Date();
    const scheduleArray = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = date.getDate();
      
      const meals = scheduleByDate[dateString] || [];
      
      scheduleArray.push({
        date: dateString,
        dayName: dayName,
        dateNum: dateNum,
        meals: meals.map(meal => ({
          type: meal.meal_type,
          name: meal.product_name,
          session: meal.meal_session,
          isSkipped: meal.status === 'skipped'
        })),
        isToday: i === 0,
        isTomorrow: i === 1
      });
    }
    
    return scheduleArray;
  },

  // Format recent activity
  formatRecentActivity(backendActivity) {
    return backendActivity.map(activity => {
      // Determine icon based on activity type
      let iconType = 'default';
      let iconColor = '#666';
      
      if (activity.activity_type === 'delivery') {
        if (activity.status === 'skipped') {
          iconType = 'skip';
          iconColor = '#f59e0b';
        } else if (activity.status === 'delivered') {
          iconType = 'delivered';
          iconColor = '#10b981';
        } else if (activity.status === 'out_for_delivery') {
          iconType = 'delivery';
          iconColor = '#3b82f6';
        }
      } else if (activity.activity_type === 'booking') {
        if (activity.payment_status === 'completed') {
          iconType = 'payment';
          iconColor = '#10b981';
        } else if (activity.payment_status === 'pending') {
          iconType = 'payment-pending';
          iconColor = '#f59e0b';
        }
      }
      
      // Format time
      const activityDate = new Date(activity.activity_date);
      const now = new Date();
      const diffMs = now - activityDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      let timeText = '';
      if (diffDays > 0) {
        timeText = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        timeText = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMins > 0) {
        timeText = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else {
        timeText = 'Just now';
      }
      
      return {
        id: activity.activity_id,
        action: activity.action,
        time: timeText,
        iconType: iconType,
        iconColor: iconColor,
        type: activity.activity_type,
        timestamp: activity.activity_date
      };
    });
  },

  // Format bookings/history data
  formatBookings(backendBookings) {
    return backendBookings.map(booking => ({
      id: booking.id,
      booking_id: booking.booking_id || booking.id?.substring?.(0, 8)?.toUpperCase() || booking.id,
      created_at: booking.created_at,
      total_amount: parseFloat(booking.total_amount) || 0,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      payment_method_display: booking.payment_method === 'online' ? 'Online Payment' : 
                            booking.payment_method === 'cod' ? 'Cash on Delivery' : 
                            booking.payment_method || 'Not specified',
      notes: booking.notes,
      uiStatus: this.getBookingStatus(booking),
      address_line_1: booking.address_line_1,
      city: booking.city,
      full_name: booking.full_name,
      phone: booking.phone,
      items: booking.items || []
    }));
  },

  getBookingStatus(booking) {
    if (booking.payment_status === 'failed' || booking.payment_status === 'refunded') return 'cancelled';
    if (booking.payment_status === 'completed') return 'delivered';
    if (booking.payment_status === 'pending') return 'pending';
    return 'processing';
  }
};

// Enhanced Dashboard API functions
export const dashboardAPI = {
  // Get next delivery
  async getNextDelivery() {
    try {
      const response = await api.get('/api/userDashboard/next-delivery');
      return response.data;
    } catch (error) {
      console.error('Error fetching next delivery:', error);
      throw error;
    }
  },

  // Get enhanced subscriptions with schedule and payment info
  async getEnhancedSubscriptions() {
    try {
      const response = await api.get('/api/userDashboard/enhanced-subscriptions');
      return response.data;
    } catch (error) {
      console.error('Error fetching enhanced subscriptions:', error);
      // Fallback to basic subscriptions
      const response = await api.get('/api/userDashboard/subscriptions');
      return response.data;
    }
  },

  // Get recent activity
  async getRecentActivity() {
    try {
      const response = await api.get('/api/userDashboard/recent-activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  },

  // Get upcoming schedule
  async getUpcomingSchedule() {
    try {
      const response = await api.get('/api/userDashboard/upcoming-schedule');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming schedule:', error);
      throw error;
    }
  },

  // Get bookings/order history
  async getBookings() {
    try {
      const response = await api.get('/api/userDashboard/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Address APIs
  async getAddresses() {
    try {
      const response = await api.get('/api/addresses/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw error;
    }
  },

  async setDefaultAddress(addressId) {
    try {
      const response = await api.post(`/api/address/default/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Error setting default address:', error);
      throw error;
    }
  },

  async addAddress(data) {
    try {
      const response = await api.post('/api/addresses/add', data);
      return response.data;
    } catch (error) {
      console.error('Error adding address:', error);
      throw error;
    }
  },

  async updateAddress(addressId, data) {
    try {
      const response = await api.put(`/api/addresses/edit/${addressId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  },

  async deleteAddress(addressId) {
    try {
      const response = await api.delete(`/api/address/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }
};

// Export the main axios instance
export default api;
