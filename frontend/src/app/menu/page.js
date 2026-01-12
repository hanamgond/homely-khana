'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Sun, Moon, Leaf, Flame, Info, CalendarDays, 
  ChevronRight, Star, Filter 
} from 'lucide-react';
import styles from './page.module.css';

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState('this-week');
  const [dietFilter, setDietFilter] = useState('all'); // all, veg, non-veg

  // Sample Data based on the "Koramangala Optimized" Menu
  const menuData = [
    {
      day: 'Monday',
      date: 'Oct 12',
      lunch: {
        title: 'Paneer & Peas Matar',
        desc: 'Homely style Matar Paneer, Yellow Dal Tadka, Phulkas, Steamed Rice, Green Salad.',
        tags: ['High Protein', 'Bestseller'],
        calories: '450 kcal'
      },
      dinner: {
        title: 'Light Aloo Methi',
        desc: 'Fenugreek potatoes (Aloo Methi), Arhar Dal Fry, Phulkas, Cucumber Raita.',
        tags: ['Light Digest', 'Detox'],
        calories: '380 kcal'
      }
    },
    {
      day: 'Tuesday',
      date: 'Oct 13',
      lunch: {
        title: 'Rajma Masala Feast',
        desc: 'The Classic Rajma, Jeera Rice, Carrot-Cucumber Salad, Phulkas.',
        tags: ['Comfort Food'],
        calories: '500 kcal'
      },
      dinner: {
        title: 'Bhindi Do Pyaza',
        desc: 'Okra with onions, Light Moong Dal, Phulkas, Steamed Rice.',
        tags: ['Low Carb Option'],
        calories: '350 kcal'
      }
    },
    {
      day: 'Wednesday',
      date: 'Oct 14',
      lunch: {
        title: 'Veg Jalfrezi Superbowl',
        desc: 'Mix veg with bell peppers, Dal Palak (Spinach), Rice, Phulkas.',
        tags: ['Fiber Rich'],
        calories: '420 kcal'
      },
      dinner: {
        title: 'Egg Curry / Paneer Lababdar',
        desc: 'Choice of protein in rich gravy, Steamed Rice, Phulkas, Roasted Papad.',
        tags: ['Protein Kick'],
        calories: '480 kcal'
      }
    },
    {
      day: 'Thursday',
      date: 'Oct 15',
      lunch: {
        title: 'Kadhi Pakora & Rice',
        desc: 'Yogurt based curry, Steamed Rice, Dry Aloo Jeera, Fried Chilly.',
        tags: ['Fan Favorite'],
        calories: '460 kcal'
      },
      dinner: {
        title: 'Lauki Chana Dal',
        desc: 'Bottle Gourd with lentils (very light), Baingan Bharta, Phulkas.',
        tags: ['Gut Health'],
        calories: '320 kcal'
      }
    },
    {
      day: 'Friday',
      date: 'Oct 16',
      lunch: {
        title: 'Chole Masala Treat',
        desc: 'Rich Chickpea curry, Veg Pulao, Onion Salad, Phulkas.',
        tags: ['Indulgent'],
        calories: '550 kcal'
      },
      dinner: {
        title: 'Dal Makhani Special',
        desc: 'Creamy black lentils, Laccha Paratha, Jeera Rice, Small Sweet.',
        tags: ['Weekend Vibes'],
        calories: '600 kcal'
      }
    },
  ];

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. HERO HEADER */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Weekly Selection</span>
            <h1 className={styles.heroTitle}>This Week&apos;s Menu</h1>
            <p className={styles.heroSubtitle}>
                Fresh, diverse, and nutritionist-approved meals. 
                <br />Designed for the busy professional.
            </p>
        </div>
      </div>

      <div className={styles.maxWidthWrapper}>
        
        {/* 2. STICKY FILTER BAR */}
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

        {/* 3. MENU GRID */}
        <div className={styles.menuGrid}>
            {menuData.map((item, index) => (
                <div key={index} className={styles.dayCard}>
                    
                    {/* DATE COLUMN */}
                    <div className={styles.dateCol}>
                        <span className={styles.dayName}>{item.day.substring(0, 3)}</span>
                        <span className={styles.dayDate}>{item.date.split(' ')[1]}</span>
                    </div>

                    {/* LUNCH SECTION */}
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
                            <span className={styles.calTag}>{item.lunch.calories}</span>
                        </div>
                    </div>

                    {/* DIVIDER (Visible on Desktop) */}
                    <div className={styles.verticalDivider}></div>

                    {/* DINNER SECTION */}
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
                            <span className={styles.calTag}>{item.dinner.calories}</span>
                        </div>
                    </div>

                </div>
            ))}
        </div>

        {/* 4. BOTTOM CTA */}
        <div className={styles.ctaSection}>
            <div className={styles.ctaCard}>
                <div>
                    <h2 className={styles.ctaTitle}>Ready to subscribe?</h2>
                    <p className={styles.ctaText}>Get these meals delivered to your door starting at ₹120/meal.</p>
                </div>
                <button className={styles.ctaButton}>
                    View Plans <ChevronRight size={18} />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}