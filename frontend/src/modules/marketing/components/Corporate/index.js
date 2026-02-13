//frontend/src/app/(public)/coporate/index.js
'use client';
import { CorporateService } from '../../services/corporateService';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Award, Users, UtensilsCrossed, ShieldCheck, Check, PhoneCall,
  ClipboardList, Utensils, Rocket, Loader2, CheckCircle2 
} from 'lucide-react';
import styles from './Corporate.module.css';

export default function CorporatePage() {
  const [formData, setFormData] = useState({
    organizationName: '',
    contactPerson: '',
    directPhone: '',
    serviceType: 'Daily Lunch',
    totalHeadcount: '',
    specificRequirements: ''
  });

  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [responseMsg, setResponseMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false); // <--- NEW STATE for View Switching

  const brands = [
    { name: 'Infosys', color: '#007CC3' },
    { name: 'TATA MOTORS', color: '#2774AE' },
    { name: 'HDFC BANK', color: '#004C8F' },
    { name: 'Jio', color: '#E30613' },
    { name: 'Tech Mahindra', color: '#D71920' },
    { name: 'Wipro', color: '#563592' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMsg('');

    try {
      // ✅ Use the Service instead of manual fetch
      await CorporateService.createLead(formData);

      // If we get here, it means success (api.js throws error automatically if failed)
      setStatus('success');
      setIsSubmitted(true);
      
    } catch (error) {
      console.error("Corporate Lead Error:", error);
      setStatus('error');
      
      // Extract the specific error message from the backend response
      const msg = error.response?.data?.message || 
                  error.response?.data?.error || 
                  'Failed to submit request. Please try again.';
      setResponseMsg(msg);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setStatus('idle');
    setFormData({
      organizationName: '',
      contactPerson: '',
      directPhone: '',
      serviceType: 'Daily Lunch',
      totalHeadcount: '',
      specificRequirements: ''
    });
  };

  return (
    <div className={styles.pageContainer}>
      
      {/* 1. HERO SECTION */}
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

            {/* RIGHT: FORM or SUCCESS MESSAGE */}
            <div className={styles.stickyFormContainer}>
                <div className={styles.formCard}>
                    
                    {isSubmitted ? (
                        // --- SUCCESS VIEW (NEW) ---
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            padding: '3rem 1rem', 
                            textAlign: 'center',
                            minHeight: '500px' // Keeps height consistent with form
                        }}>
                            <div style={{ 
                                background: '#dcfce7', 
                                padding: '1.5rem', 
                                borderRadius: '50%', 
                                marginBottom: '1.5rem',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                            }}>
                                <CheckCircle2 size={48} color="#15803d" strokeWidth={2.5} />
                            </div>
                            
                            <h3 className={styles.formTitle} style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                                Request Received!
                            </h3>
                            
                            <p className={styles.bodyText} style={{ marginBottom: '2rem', color: '#4b5563' }}>
                                Thank you, <strong>{formData.contactPerson}</strong>.<br/>
                                We have received your inquiry for <strong>{formData.organizationName}</strong>.
                            </p>

                            <div style={{ 
                                background: '#f3f4f6', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                fontSize: '0.9rem', 
                                color: '#1f2937',
                                marginBottom: '2rem',
                                width: '100%'
                            }}>
                                <p style={{ margin: 0 }}>
                                    Our concierge will contact you at <strong>{formData.directPhone}</strong> within 2 hours.
                                </p>
                            </div>

                            <button 
                                onClick={handleReset} 
                                className={styles.submitBtn}
                                style={{ 
                                    backgroundColor: 'transparent', 
                                    border: '1px solid #3e2723', 
                                    color: '#3e2723',
                                    fontWeight: '600'
                                }}
                            >
                                Send Another Request
                            </button>
                        </div>
                    ) : (
                        // --- FORM VIEW (EXISTING) ---
                        <>
                            <div className={styles.formHeader}>
                                <h3 className={styles.formTitle}>Request a Quote</h3>
                                <p className={styles.formSubtitle}>Receive a custom proposal within 2 hours.</p>
                            </div>
                            
                            <form className={styles.formBody} onSubmit={handleSubmit}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Organization Name *</label>
                                    <input 
                                      type="text" 
                                      name="organizationName"
                                      value={formData.organizationName}
                                      onChange={handleChange}
                                      className={styles.input} 
                                      placeholder="Ex: Google India" 
                                      required 
                                    />
                                </div>

                                <div className={styles.row50}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Contact Person *</label>
                                        <input 
                                          type="text" 
                                          name="contactPerson"
                                          value={formData.contactPerson}
                                          onChange={handleChange}
                                          className={styles.input} 
                                          placeholder="Your Name" 
                                          required 
                                        />
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Mobile Number *</label>
                                        {/* FIXED: Country code and input now inside the wrapper */}
                                        <div className={styles.phoneInputWrapper}>
                                          <span className={styles.countryCode}>+91</span>
                                          <input 
                                            type="tel" 
                                            name="directPhone"
                                            value={formData.directPhone}
                                            onChange={(e) => {
                                              // STRICT VALIDATION: Only allow numbers, max 10 digits
                                              const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                              setFormData(prev => ({ ...prev, directPhone: val }));
                                            }}
                                            className={styles.phoneInput}
                                            placeholder="9876543210" 
                                            required 
                                          />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.row50}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Service Type</label>
                                        <div className={styles.selectWrapper}>
                                            <select 
                                              name="serviceType"
                                              value={formData.serviceType}
                                              onChange={handleChange}
                                              className={styles.select}
                                            >
                                                <option value="Daily Lunch">Daily Lunch</option>
                                                <option value="Event Catering">Event Catering</option>
                                                <option value="Snack Boxes">Snack Boxes</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Total Headcount</label>
                                        <input 
                                          type="number" 
                                          name="totalHeadcount"
                                          value={formData.totalHeadcount}
                                          onChange={handleChange}
                                          className={styles.input} 
                                          placeholder="Ex: 50" 
                                        />
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Specific Requirements</label>
                                    <textarea 
                                      rows="2" 
                                      name="specificRequirements"
                                      value={formData.specificRequirements}
                                      onChange={handleChange}
                                      className={styles.textarea} 
                                      placeholder="Cuisines, allergies, delivery time..."
                                    ></textarea>
                                </div>

                                {status === 'error' && (
                                    <div style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
                                        {responseMsg}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className={styles.submitBtn}
                                    disabled={status === 'loading'}
                                    style={{ opacity: status === 'loading' ? 0.7 : 1 }}
                                >
                                    {status === 'loading' ? (
                                        <><Loader2 className="animate-spin" size={18} /> Sending...</>
                                    ) : (
                                        'Submit Request'
                                    )}
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
                        </>
                    )}

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