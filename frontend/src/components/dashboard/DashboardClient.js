'use client';

import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { fetchWithToken } from '@/utils/CookieManagement';
import { AppContext } from '@/utils/AppContext';
import { Calendar, Package, Clock } from 'lucide-react';

export default function DashboardClient() {
  const { user } = useContext(AppContext);
  const [nextMeal, setNextMeal] = useState(null);
  const [stats, setStats] = useState({ activePlans: 0, mealsLeft: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        try {
            const [mealRes, subRes] = await Promise.all([
                fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/user-dashboard/next-delivery`),
                fetchWithToken(`${process.env.NEXT_PUBLIC_URL}/api/user-dashboard/subscriptions`)
            ]);
            
            const mealData = await mealRes.json();
            const subData = await subRes.json();

            if (mealData.success) setNextMeal(mealData.data);
            if (subData.success) {
                const active = subData.data.filter(s => s.remaining_meals > 0).length;
                const left = subData.data.reduce((acc, curr) => acc + curr.remaining_meals, 0);
                setStats({ activePlans: active, mealsLeft: left }); 
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    loadData();
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom:'2rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1a1a1a', marginBottom:'0.5rem' }}>
                Welcome, {user?.name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p style={{ color: '#666' }}>Here is what’s happening with your food today.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={styles.statCard}>
                <div style={styles.iconBox('#e0f2fe')}><Package color="#0284c7" size={24}/></div>
                <div>
                    <p style={styles.statLabel}>Active Plans</p>
                    <h3 style={styles.statValue}>{stats.activePlans}</h3>
                </div>
            </div>
            <div style={styles.statCard}>
                <div style={styles.iconBox('#dcfce7')}><Calendar color="#16a34a" size={24}/></div>
                <div>
                    <p style={styles.statLabel}>Meals Remaining</p>
                    <h3 style={styles.statValue}>{stats.mealsLeft}</h3>
                </div>
            </div>
            <div style={styles.statCard}>
                <div style={styles.iconBox('#fef3c7')}><Clock color="#d97706" size={24}/></div>
                <div>
                    <p style={styles.statLabel}>Next Delivery</p>
                    <h3 style={{...styles.statValue, fontSize:'1.1rem'}}>
                        {nextMeal ? new Date(nextMeal.delivery_date).toLocaleDateString() : 'None'}
                    </h3>
                </div>
            </div>
        </div>

        {/* Next Meal Section */}
        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color:'#333' }}>Your Next Meal</h3>
        
        {loading ? <p>Loading...</p> : nextMeal ? (
            <div style={styles.mainCard}>
               <div style={{display:'flex', gap:'1.5rem', alignItems:'center', flexWrap:'wrap'}}>
                   <Image 
                     src={nextMeal.image_url || "/meal-placeholder.jpg"} 
                     width={120} height={120} 
                     alt="Meal" 
                     style={{borderRadius:'12px', objectFit:'cover'}} 
                   />
                   <div>
                       <span style={styles.tag}>{nextMeal.meal_type}</span>
                       <h3 style={{margin:'0.5rem 0 0.2rem', fontSize:'1.3rem'}}>{nextMeal.product_name}</h3>
                       <p style={{color:'#666', fontSize:'0.9rem'}}>{nextMeal.items_description}</p>
                   </div>
               </div>
            </div>
        ) : (
            <div style={{...styles.mainCard, textAlign:'center', padding:'3rem'}}>
                <div style={{background:'#f3f4f6', width:'60px', height:'60px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem'}}>
                    <Calendar color="#9ca3af" size={30} />
                </div>
                <h3 style={{color:'#374151', marginBottom:'0.5rem'}}>No meals scheduled</h3>
                {/* FIXED THE ERROR BELOW */}
                <p style={{color:'#6b7280', marginBottom:'1.5rem'}}>You don&apos;t have any deliveries scheduled for upcoming days.</p>
            </div>
        )}
    </div>
  );
}

const styles = {
    statCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #f0f0f0' },
    mainCard: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #eee' },
    iconBox: (color) => ({ width: '50px', height: '50px', borderRadius: '12px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }),
    statLabel: { color: '#64748b', fontSize: '0.9rem', margin: 0, fontWeight: '500' },
    statValue: { color: '#0f172a', fontSize: '1.5rem', fontWeight: 'bold', margin: '0.2rem 0 0' },
    tag: { background:'#FF9801', color:'white', padding:'4px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'bold', textTransform:'uppercase' }
};