'use client';
import React from 'react';
import Image from 'next/image';
import { 
  Award, Users, UtensilsCrossed, ShieldCheck, Check, PhoneCall,
  ClipboardList, Utensils, Rocket 
} from 'lucide-react';
import styles from './page.module.css';

export default function CorporatePage() {
  const brands = [
    { name: 'Infosys', color: '#007CC3' },
    { name: 'TATA MOTORS', color: '#2774AE' },
    { name: 'HDFC BANK', color: '#004C8F' },
    { name: 'Jio', color: '#E30613' },
    { name: 'Tech Mahindra', color: '#D71920' },
    { name: 'Wipro', color: '#563592' },
  ];

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. HERO SECTION (Restored Background) */}
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Premium Corporate Catering</span>
            <h1 className={styles.heroTitle}>Authentic Indian Feasts for Your Office</h1>
            <p className={styles.heroSubtitle}>
                Experience the luxury of home-cooked meals at scale. 
                Zero preservatives. 5-Star Hygiene. Delivered with warmth.
            </p>
        </div>
        <div className={styles.heroImageWrapper}>
            {/* Restored the previous image code */}
            <Image 
                src="/why-us-1.jpg" 
                alt="Feast" 
                fill 
                style={{ objectFit: 'cover' }} 
                priority
            />
        </div>
      </div>

      <div className={styles.maxWidthWrapper}>
        <div className={styles.mainGrid}>
            
            {/* LEFT CONTENT */}
            <div className={styles.leftContent}>
                <h2 className={styles.sectionHeading}>The HomelyKhana Distinction</h2>
                <p className={styles.bodyText}>
                    Food is the unspoken language of care in any organization. We don&apos;t just supply meals; we curate culinary experiences. 
                    Prepared in small batches using heirloom recipes, our food brings the nostalgia of <em>Ghar ka Khana</em> to your boardroom.
                </p>

                <div className={styles.promiseGrid}>
                    <div className={styles.promiseItem}>
                        <Award size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
                        <h4>Pure & Pristine</h4>
                        <p>No artificial colors, MSG, or frozen bases. Only fresh produce chopped at dawn.</p>
                    </div>
                    <div className={styles.promiseItem}>
                        <UtensilsCrossed size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
                        <h4>Curated Menus</h4>
                        <p>From royal Hyderabadi Biryanis to comforting Gujarati Thalis, tailored to your team&apos;s palate.</p>
                    </div>
                    <div className={styles.promiseItem}>
                        <ShieldCheck size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
                        <h4>5-Star Hygiene</h4>
                        <p>FSSAI certified kitchens. Mandatory temperature checks and sterile packaging.</p>
                    </div>
                    <div className={styles.promiseItem}>
                        <Users size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
                        <h4>Dedicated Concierge</h4>
                        <p>One point of contact for seamless coordination, menu planning, and delivery.</p>
                    </div>
                </div>
            </div>

            {/* RIGHT: FORM */}
            <div className={styles.stickyFormContainer}>
                <div className={styles.formCard}>
                    <div className={styles.formHeader}>
                        <h3 className={styles.formTitle}>Request a Quote</h3>
                        <p className={styles.formSubtitle}>Receive a custom proposal within 2 hours.</p>
                    </div>
                    
                    <form className={styles.formBody}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Organization Name</label>
                            <input type="text" className={styles.input} placeholder="Ex: Google India" />
                        </div>

                        <div className={styles.row50}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Contact Person</label>
                                <input type="text" className={styles.input} placeholder="Your Name" />
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Direct Phone</label>
                                <input type="tel" className={styles.input} placeholder="+91 999..." />
                            </div>
                        </div>

                        <div className={styles.row50}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Service Type</label>
                                <div className={styles.selectWrapper}>
                                    <select className={styles.select}>
                                        <option>Daily Lunch</option>
                                        <option>Event Catering</option>
                                        <option>Snack Boxes</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Total Headcount</label>
                                <input type="number" className={styles.input} placeholder="Ex: 50" />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Specific Requirements</label>
                            <textarea rows="2" className={styles.textarea} placeholder="Cuisines, allergies, delivery time..."></textarea>
                        </div>

                        <button type="button" className={styles.submitBtn}>
                            Submit Request
                        </button>

                        <div className={styles.tastingNote}>
                            <Check size={14} color="#166534" /> Complimentary tasting session included.
                        </div>

                        <div className={styles.directContactSection}>
                            <div className={styles.dividerOr}><span>OR</span></div>
                            <p className={styles.contactLabel}>Prefer to speak to a human?</p>
                            <a href="tel:+919876543210" className={styles.phoneLink}>
                                <PhoneCall size={18} />
                                <span>+91 98765 43210</span>
                            </a>
                        </div>
                    </form>
                </div>
            </div>

        </div>
    </div>

    {/* 3. LOGO MARQUEE */}
    <div className={styles.trustSection}>
        <div className={styles.maxWidthWrapper}>
            <p className={styles.trustHeader}>TRUSTED BY INDUSTRY LEADERS</p>
        </div>
        <div className={styles.marquee}>
            <div className={styles.marqueeContent}>
                {[...brands, ...brands, ...brands].map((brand, i) => (
                    <span key={i} className={styles.logoItem} style={{ color: brand.color }}>
                        {brand.name}
                    </span>
                ))}
            </div>
        </div>
    </div>

    {/* 4. NEW CATERING JOURNEY (Stepper) */}
    <div className={styles.processSection}>
        <div className={styles.maxWidthWrapper}>
            <h2 className={styles.sectionHeading} style={{textAlign:'center', marginBottom: '60px'}}>The Catering Journey</h2>
            
            <div className={styles.stepperWrapper}>
                {/* Connecting Line (Background) */}
                <div className={styles.stepperLine}></div>

                {/* Step 1 */}
                <div className={styles.stepItem}>
                    <div className={styles.stepIconBox}>
                        <ClipboardList size={28} color="white" />
                    </div>
                    <div className={styles.stepContent}>
                        <h4 className={styles.stepTitle}>Consultation</h4>
                        <p className={styles.stepDesc}>We discuss your budget, team preferences, and dietary needs to design a bespoke menu.</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className={styles.stepItem}>
                    <div className={styles.stepIconBox}>
                        <Utensils size={28} color="white" />
                    </div>
                    <div className={styles.stepContent}>
                        <h4 className={styles.stepTitle}>The Tasting</h4>
                        <p className={styles.stepDesc}>We deliver a signature sample box to your office. Experience the freshness firsthand.</p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className={styles.stepItem}>
                    <div className={styles.stepIconBox}>
                        <Rocket size={28} color="white" />
                    </div>
                    <div className={styles.stepContent}>
                        <h4 className={styles.stepTitle}>Seamless Launch</h4>
                        <p className={styles.stepDesc}>We handle logistics, buffet setup, and daily service. Your team simply enjoys the food.</p>
                    </div>
                </div>

            </div>
        </div>
    </div>

    </div>
  );
}