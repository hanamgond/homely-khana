'use client';

import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/utils/CookieManagement';
import { format } from 'date-fns';
import { ShoppingBag } from 'lucide-react';

export default function OrderHistoryClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/bookings`);
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom:'2rem' }}>Order History</h2>

        {loading ? <p>Loading orders...</p> : orders.length === 0 ? (
          <div style={styles.emptyContainer}>
              <ShoppingBag size={40} color="#ccc" />
              <p>No past orders found.</p>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.03)' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={styles.th}>Order ID</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Amount</th>
                        <th style={styles.th}>Payment Status</th>
                        <th style={styles.th}>Method</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: '600', color:'#555' }}>
                            #{order.id.slice(0, 8)}
                        </td>
                        <td style={styles.td}>
                            {format(new Date(order.created_at), 'dd MMM yyyy')}
                        </td>
                        <td style={{ ...styles.td, fontWeight: 'bold', color:'#1a1a1a' }}>
                            ₹{order.total_amount}
                        </td>
                        <td style={styles.td}>
                        <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight:'700',
                            background: order.payment_status === 'completed' ? '#dcfce7' : '#fee2e2',
                            color: order.payment_status === 'completed' ? '#166534' : '#991b1b'
                        }}>
                            {order.payment_status.toUpperCase()}
                        </span>
                        </td>
                        <td style={{ ...styles.td, textTransform: 'capitalize', color:'#666' }}>
                            {order.payment_method}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}
      </div>
  );
}

const styles = {
    th: { padding: '1.2rem', fontSize: '0.85rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', letterSpacing: '0.5px' },
    td: { padding: '1.2rem', fontSize: '0.95rem' },
    emptyContainer: { display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'4rem', background:'#f9fafb', borderRadius:'16px', color:'#888' }
};