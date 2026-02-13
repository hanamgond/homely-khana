'use client';

import { useState, useEffect, useMemo } from 'react';
import { fetchWithToken } from '@/utils/CookieManagement';
import { format, parseISO } from 'date-fns';
import { 
  ShoppingBag, Download, Loader2, 
  ChevronDown, ChevronUp, MapPin, Package, User, Clock,
  Receipt, Truck, CreditCard
} from 'lucide-react';
import { toast } from "sonner";
import styles from './DashboardHistory.module.css';

export default function OrderHistoryClient() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/userDashboard/bookings`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const transformed = data.data.map(booking => ({
            ...booking,
            uiStatus: booking.cancelled_at ? 'cancelled' : 
                      booking.delivered_at ? 'delivered' : 
                      booking.payment_status === 'pending' ? 'pending' : 'processing'
          }));
          setBookings(transformed);
        }
      } catch (err) {
        toast.error("Failed to sync bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    return bookings.filter(b => b.uiStatus === statusFilter);
  }, [bookings, statusFilter]);

  const getMealIcon = (type) => {
    return String(type).toLowerCase().includes('dinner') ? '🌙' : '☀️';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Order History</h1>
        <p className={styles.subtitle}>Detailed ledger of your meal subscriptions and one-time orders</p>
      </header>

      <nav className={styles.filterBar}>
        {['all', 'delivered', 'processing', 'cancelled'].map(f => (
          <button 
            key={f} 
            className={`${styles.filterBtn} ${statusFilter === f ? styles.activeFilter : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className={styles.loaderContainer}><Loader2 className={styles.spinner} size={40} /></div>
      ) : (
        <div className={styles.ledger}>
          {filteredBookings.map(booking => (
            <div key={booking.id} className={`${styles.ledgerCard} ${expandedBooking === booking.id ? styles.expanded : ''}`}>
              <div 
                className={styles.ledgerMain} 
                onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
              >
                <div className={styles.dateBlock}>
                  <span className={styles.day}>{format(parseISO(booking.created_at), 'dd')}</span>
                  <span className={styles.month}>{format(parseISO(booking.created_at), 'MMM')}</span>
                </div>
                
                <div className={styles.infoBlock}>
                  <span className={styles.orderId}>#{booking.booking_id || booking.id.slice(0, 8)}</span>
                  <span className={styles.planLabel}>{booking.plan_name || 'Standard Plan'}</span>
                </div>

                <div className={styles.statusBlock}>
                  <span className={`${styles.statusBadge} ${styles[booking.uiStatus]}`}>
                    {booking.uiStatus.toUpperCase()}
                  </span>
                </div>

                <div className={styles.priceBlock}>
                  ₹{parseFloat(booking.total_amount).toLocaleString('en-IN')}
                </div>

                <div className={styles.chevron}>
                  {expandedBooking === booking.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>

              {expandedBooking === booking.id && (
                <div className={styles.detailsContent}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.gridCard}>
                      <span className={styles.label}><MapPin size={14} /> Delivery Address</span>
                      <p className={styles.valText}>{booking.address_line_1}, {booking.city}</p>
                    </div>
                    <div className={styles.gridCard}>
                      <span className={styles.label}><User size={14} /> Recipient Info</span>
                      <p className={styles.valText}>{booking.full_name || "Self"}</p>
                      <small className={styles.subText}>{booking.phone || "Profile Phone"}</small>
                    </div>
                  </div>

                  <div className={styles.itemsSection}>
                    <span className={styles.label}><Receipt size={14} /> Items Ordered</span>
                    <div className={styles.itemsWrapper}>
                      {booking.items?.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <div className={styles.itemMeta}>
                            <span className={styles.mealIcon}>{getMealIcon(item.meal_type)}</span>
                            <div>
                              <span className={styles.itemName}>{item.product_name}</span>
                              <span className={styles.itemType}>{item.meal_type}</span>
                            </div>
                          </div>
                          <div className={styles.itemPricing}>
                            <span>{item.quantity} x ₹{item.price_per_unit}</span>
                            <span className={styles.lineTotal}>₹{parseFloat(item.total_price).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <footer className={styles.actions}>
                    <button className={styles.downloadBtn}>
                      <Download size={14} /> Download Invoice
                    </button>
                    <span className={styles.timestamp}>
                      <Clock size={12} /> {format(parseISO(booking.created_at), 'hh:mm a')}
                    </span>
                  </footer>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}