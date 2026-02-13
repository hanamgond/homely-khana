'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  ShoppingBag, Download, Loader2, 
  ChevronDown, ChevronUp, MapPin, Package, User, Clock,
  Receipt, Truck, CreditCard
} from 'lucide-react';
import { toast } from "sonner";
import { dashboardAPI, dataFormatters } from '@/shared/lib/api';
import styles from './History.module.css';

export default function OrderHistoryClient() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await dashboardAPI.getBookings();
        
        if (data.success && data.data) {
          const formattedBookings = dataFormatters.formatBookings(data.data);
          setBookings(formattedBookings);
        } else {
          throw new Error(data.error || 'Failed to load order history');
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        toast.error(err.message || "Failed to load order history");
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

  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Order History</h1>
          <p className={styles.subtitle}>Detailed ledger of your meal subscriptions and one-time orders</p>
        </header>
        <div className={styles.loaderContainer}>
          <Loader2 className={styles.spinner} size={40} />
          <p>Loading your order history...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Order History</h1>
          <p className={styles.subtitle}>Detailed ledger of your meal subscriptions and one-time orders</p>
        </header>
        <div className={styles.emptyState}>
          <ShoppingBag size={48} className={styles.emptyIcon} />
          <h3>No Orders Yet</h3>
          <p>You haven&apos;t placed any orders yet.</p>
          <button 
            className={styles.ctaButton}
            onClick={() => window.location.href = '/pricing'}
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

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
                <span className={styles.orderId}>#{booking.booking_id}</span>
                <span className={styles.planLabel}>
                  {booking.items?.[0]?.product_name || 'Meal Order'}
                </span>
              </div>

              <div className={styles.statusBlock}>
                <span className={`${styles.statusBadge} ${styles[booking.uiStatus]}`}>
                  {booking.uiStatus.toUpperCase()}
                </span>
              </div>

              <div className={styles.priceBlock}>
                ₹{booking.total_amount.toLocaleString('en-IN')}
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
                    <p className={styles.valText}>
                      {booking.address_line_1 || 'Address not specified'}, {booking.city || ''}
                    </p>
                  </div>
                  <div className={styles.gridCard}>
                    <span className={styles.label}><User size={14} /> Recipient Info</span>
                    <p className={styles.valText}>{booking.full_name || "Recipient"}</p>
                    <small className={styles.subText}>{booking.phone || "Phone not provided"}</small>
                  </div>
                </div>

                <div className={styles.itemsSection}>
                  <span className={styles.label}><Receipt size={14} /> Items Ordered</span>
                  <div className={styles.itemsWrapper}>
                    {booking.items?.length > 0 ? (
                      booking.items.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <div className={styles.itemMeta}>
                            <span className={styles.mealIcon}>{getMealIcon(item.meal_type)}</span>
                            <div>
                              <span className={styles.itemName}>{item.product_name || 'Meal'}</span>
                              <span className={styles.itemType}>{item.meal_type || 'Standard'}</span>
                            </div>
                          </div>
                          <div className={styles.itemPricing}>
                            <span>{item.quantity || 1} x ₹{item.price_per_unit || 0}</span>
                            <span className={styles.lineTotal}>₹{parseFloat(item.total_price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noItems}>
                        <p>No item details available</p>
                      </div>
                    )}
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
    </div>
  );
}