//frontend/src/modules/subscribe/components/MenuClient.js
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sun, Moon, ChevronRight, Filter 
} from 'lucide-react';
import styles from './Menu.module.css';
import api from '@/shared/lib/api';

// --- HELPER: Get date for a specific day ---
const getDateForDay = (dayName, isNextWeek) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const now = new Date();
  const currentDayIndex = now.getDay(); 
  
  // Calculate distance to previous Monday
  const distToMonday = (currentDayIndex + 6) % 7; 
  const currentMonday = new Date(now);
  currentMonday.setDate(now.getDate() - distToMonday);

  // Find target day index
  const targetDayIndex = days.indexOf(dayName.toLowerCase());
  const adjustedTargetIndex = targetDayIndex === 0 ? 6 : targetDayIndex - 1;

  // Set target date
  const targetDate = new Date(currentMonday);
  targetDate.setDate(currentMonday.getDate() + adjustedTargetIndex);

  // Add 7 days if "Next Week"
  if (isNextWeek) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('this-week');
  const [dietFilter, setDietFilter] = useState('all'); 
  
  const [rawData, setRawData] = useState([]); 
  const [displayData, setDisplayData] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    async function fetchMenu() {
      try {
        // Matches the backend route we just added: router.get('/', ...)

        // Replace the lines above with this:
        const res = await api.get('/api/menu');
        const data = res.data;
        const items = data.data ? data.data : data;
        
        setRawData(items); 
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Could not load the menu. Please try again later.');
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  // --- 2. TRANSFORM DATA ---
  useEffect(() => {
    if (!rawData || rawData.length === 0) return;

    const isNextWeek = activeTab === 'next-week';
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const grouped = {};

    rawData.forEach(item => {
      // Filter Logic
      if (dietFilter === 'veg' && !item.is_veg) return;
      if (dietFilter === 'non-veg' && item.is_veg) return;

      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = {
          day: item.day_of_week,
          date: getDateForDay(item.day_of_week, isNextWeek), 
          lunch: null,
          dinner: null
        };
      }

      // Safe Tag Parsing
      let tagsArray = [];
      try {
        tagsArray = typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []);
      } catch (e) {
        tagsArray = [];
      }

      const mealData = {
        title: item.title,
        desc: item.description,
        tags: tagsArray,
        calories: item.calories ? `${item.calories} kcal` : ''
      };

      if (item.meal_type === 'Lunch') {
        grouped[item.day_of_week].lunch = mealData;
      } else if (item.meal_type === 'Dinner') {
        grouped[item.day_of_week].dinner = mealData;
      }
    });

    const sortedData = dayOrder
      .map(day => grouped[day])
      .filter(item => item !== undefined);

    setDisplayData(sortedData);

  }, [rawData, activeTab, dietFilter]);

  if (loading) return <div className="p-10 text-center">Loading fresh menu...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Weekly Selection</span>
            <h1 className={styles.heroTitle}>
               {activeTab === 'this-week' ? "This Week's Menu" : "Next Week's Menu"}
            </h1>
            <p className={styles.heroSubtitle}>
                Experience the warmth of home-cooked meals. 
                <br />Fresh ingredients, traditional recipes, zero preservatives.
            </p>
        </div>
      </div>

      <div className={styles.maxWidthWrapper}>
        <div className={styles.stickyBar}>
            <div className={styles.weekToggle}>
                <button 
                    className={`${styles.toggleBtn} ${activeTab === 'this-week' ? styles.active : ''}`}
                    onClick={() => setActiveTab('this-week')}
                >
                    This Week
                </button>
                <button 
                    className={`${styles.toggleBtn} ${activeTab === 'next-week' ? styles.active : ''}`}
                    onClick={() => setActiveTab('next-week')}
                >
                    Next Week
                </button>
            </div>

            <div className={styles.dietFilter}>
                <Filter size={16} color="#666" />
                <select 
                    className={styles.filterSelect}
                    value={dietFilter}
                    onChange={(e) => setDietFilter(e.target.value)}
                >
                    <option value="all">Show All</option>
                    <option value="veg">Pure Veg</option>
                    <option value="non-veg">Contains Egg/Non-Veg</option>
                </select>
            </div>
        </div>

        <div className={styles.menuGrid}>
            {displayData.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No menu items found for this selection.</p>
                </div>
            )}
            
            {displayData.map((item, index) => (
                <div key={index} className={styles.dayCard}>
                    <div className={styles.dateCol}>
                        <span className={styles.dayName}>{item.day.substring(0, 3)}</span>
                        <span className={styles.dayDate}>{item.date.split(' ')[1]}</span>
                    </div>

                    {item.lunch ? (
                      <div className={styles.mealSection}>
                          <div className={styles.mealHeader}>
                              <div className={styles.iconWrapper} style={{background:'#FFF7ED'}}>
                                  <Sun size={20} color="#F59E0B" />
                              </div>
                              <span className={styles.mealType}>LUNCH</span>
                          </div>
                          <h3 className={styles.dishTitle}>{item.lunch.title}</h3>
                          <p className={styles.dishDesc}>{item.lunch.desc}</p>
                          <div className={styles.tagRow}>
                              {item.lunch.tags.map((tag, i) => (
                                  <span key={i} className={styles.tag}>{tag}</span>
                              ))}
                              {item.lunch.calories && <span className={styles.calTag}>{item.lunch.calories}</span>}
                          </div>
                      </div>
                    ) : (
                      <div className={styles.mealSection}>
                         <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">No Lunch</div>
                      </div>
                    )}

                    <div className={styles.verticalDivider}></div>

                    {item.dinner ? (
                      <div className={styles.mealSection}>
                          <div className={styles.mealHeader}>
                              <div className={styles.iconWrapper} style={{background:'#F1F5F9'}}>
                                  <Moon size={20} color="#475569" />
                              </div>
                              <span className={styles.mealType}>DINNER</span>
                          </div>
                          <h3 className={styles.dishTitle}>{item.dinner.title}</h3>
                          <p className={styles.dishDesc}>{item.dinner.desc}</p>
                          <div className={styles.tagRow}>
                              {item.dinner.tags.map((tag, i) => (
                                  <span key={i} className={styles.tag}>{tag}</span>
                              ))}
                              {item.dinner.calories && <span className={styles.calTag}>{item.dinner.calories}</span>}
                          </div>
                      </div>
                    ) : (
                       <div className={styles.mealSection}>
                         <div className="h-full flex items-center justify-center text-gray-300 italic text-sm">No Dinner</div>
                      </div>
                    )}
                </div>
            ))}
        </div>

        <div className={styles.ctaSection}>
            <div className={styles.ctaCard}>
                <div>
                    <h2 className={styles.ctaTitle}>Ready to subscribe?</h2>
                    <p className={styles.ctaText}>Get these meals delivered to your door starting at ₹120/meal.</p>
                </div>
                <Link href="/subscribe" className={styles.ctaButton}>
                    View Plans <ChevronRight size={18} />
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}