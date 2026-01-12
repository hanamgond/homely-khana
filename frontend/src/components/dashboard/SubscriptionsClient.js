'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchWithToken } from '@/utils/CookieManagement';
import { format } from 'date-fns';
import { Calendar, MapPin, Package } from 'lucide-react'; // Import icons

export default function SubscriptionsClient() {
  const [lunchSubs, setLunchSubs] = useState([]);
  const [dinnerSubs, setDinnerSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const res = await fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/user-dashboard/subscriptions`);
        const data = await res.json();
        if (data.success) {
          // FIX: Lowercase comparison to avoid bugs if API returns "Lunch" or "LUNCH"
          setLunchSubs(data.data.filter(s => s.meal_type.toLowerCase() === 'lunch'));
          setDinnerSubs(data.data.filter(s => s.meal_type.toLowerCase() === 'dinner'));
        }
      } catch (err) {
        console.error("Error loading subscriptions", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, []);

  const renderCard = (sub) => {
    let address = {};
    try { 
        address = typeof sub.delivery_address === 'string' 
        ? JSON.parse(sub.delivery_address) 
        : sub.delivery_address || {}; 
    } catch(e){}

    const isActive = sub.remaining_meals > 0;

    return (
      <div key={sub.booking_item_id} style={styles.card}>
         {/* Header: Name + Status */}
         <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
             <div style={{display:'flex', gap:'1rem', alignItems:'center'}}>
                <Image 
                    src={sub.image_url || "/meal-placeholder.jpg"} 
                    alt="Meal" height={60} width={60} 
                    style={{borderRadius:'10px', objectFit:'cover'}}
                />
                <div>
                    <h4 style={{fontSize:'1.1rem', fontWeight:'700', margin:0, color:'#333'}}>{sub.product_name}</h4>
                    <p style={{color:'#666', fontSize:'0.9rem', margin:0}}>{sub.plan_name}</p>
                </div>
             </div>
             <span style={isActive ? styles.badgeActive : styles.badgeInactive}>
                {isActive ? 'Active' : 'Completed'}
             </span>
         </div>

         {/* Info Grid */}
         <div style={styles.infoGrid}>
             <div style={styles.infoItem}>
                 <Package size={16} color="#FF9801"/>
                 <span>Remaining: <b>{sub.remaining_meals}</b> meals</span>
             </div>
             <div style={styles.infoItem}>
                 <Calendar size={16} color="#FF9801"/>
                 <span>Ends: {sub.end_date ? format(new Date(sub.end_date), 'dd MMM yyyy') : 'N/A'}</span>
             </div>
             <div style={{...styles.infoItem, gridColumn:'1 / -1', borderTop:'1px solid #eee', paddingTop:'0.8rem', marginTop:'0.5rem'}}>
                 <MapPin size={16} color="#888" style={{minWidth:'16px'}}/>
                 <span style={{fontSize:'0.85rem', color:'#555'}}>
                     {address.address_line_1}, {address.city}
                 </span>
             </div>
         </div>
      </div>
    );
  };

  return (
       <div style={{maxWidth:'1000px', margin:'0 auto'}}>
         <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom:'2rem' }}>My Subscriptions</h2>

         {loading ? <p>Loading your plans...</p> : (
           <div style={{display:'grid', gap:'2rem'}}>
             
             {/* Lunch Section */}
             <div>
                 <h3 style={styles.sectionTitle}>Lunch Plans</h3>
                 {lunchSubs.length > 0 ? (
                     <div style={styles.gridContainer}>
                         {lunchSubs.map(renderCard)}
                     </div>
                 ) : (
                     <p style={styles.emptyState}>No active lunch plans.</p>
                 )}
             </div>

             {/* Dinner Section */}
             <div>
                 <h3 style={styles.sectionTitle}>Dinner Plans</h3>
                 {dinnerSubs.length > 0 ? (
                     <div style={styles.gridContainer}>
                         {dinnerSubs.map(renderCard)}
                     </div>
                 ) : (
                     <p style={styles.emptyState}>No active dinner plans.</p>
                 )}
             </div>

           </div>
         )}
       </div>
  );
}

const styles = {
    sectionTitle: { fontSize:'1.2rem', fontWeight:'600', marginBottom:'1rem', color:'#444', borderBottom:'1px solid #eee', paddingBottom:'0.5rem' },
    gridContainer: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:'1.5rem' },
    card: { background:'white', borderRadius:'16px', padding:'1.5rem', border:'1px solid #f0f0f0', boxShadow:'0 2px 8px rgba(0,0,0,0.04)', transition:'transform 0.2s' },
    badgeActive: { background:'#dcfce7', color:'#166534', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'bold' },
    badgeInactive: { background:'#f3f4f6', color:'#6b7280', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'bold' },
    infoGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.8rem', marginTop:'1rem' },
    infoItem: { display:'flex', alignItems:'center', gap:'8px', fontSize:'0.9rem', color:'#555' },
    emptyState: { color:'#888', fontStyle:'italic', background:'#f9fafb', padding:'1.5rem', borderRadius:'12px', border:'1px dashed #ddd', textAlign:'center' }
};