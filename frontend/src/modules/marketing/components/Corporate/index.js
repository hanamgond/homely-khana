//frontend/src/app/(public)/coporate/index.js
'use client';
import { CorporateService } from '../../services/corporateService';
import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Award, Users, UtensilsCrossed, ShieldCheck, Check, PhoneCall,
  ClipboardList, Utensils, Rocket, Loader2, CheckCircle2, 
  Building2, User, Users2, Phone, MessageSquare, Calendar, Truck, Heart
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const brands = [
    { name: 'Infosys', color: '#007CC3' },
    { name: 'HDFC BANK', color: '#004C8F' },
    { name: 'Jio', color: '#E30613' },
    { name: 'Tech Mahindra', color: '#D71920' },
    { name: 'Wipro', color: '#563592' },
    { name: 'OLA', color: '#563552' },
    { name: 'SHADOWFAX', color: '#004C4F' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    // Only allow numbers, max 10 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, directPhone: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setResponseMsg('');

    try {
      await CorporateService.createLead(formData);
      setStatus('success');
      setIsSubmitted(true);
    } catch (error) {
      console.error("Corporate Lead Error:", error);
      setStatus('error');
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
                <div className={styles.promiseItem}>
                <Truck size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
                <h4>Bulk Ordering</h4>
                <p>Special corporate pricing for orders 50+. Flexible billing, monthly invoicing, and dedicated account management.</p>
                </div>
                <div className={styles.promiseItem}>
            <Heart size={32} color="#d97706" style={{marginBottom:'15px'}} strokeWidth={1.5} />
            <h4>Employee Wellness</h4>
            <p>Nutritious meals designed with corporate wellness in mind. Dietitian-approved options for health-conscious teams.</p>
        </div>
            </div>
          </div>

          {/* RIGHT: FORM or SUCCESS MESSAGE */}
          <div className={styles.stickyFormContainer}>
            <div className={styles.formCard}>
              
              {isSubmitted ? (
                // --- SUCCESS VIEW ---
                <div className={styles.successView}>
                  <div className={styles.successIconWrapper}>
                    <CheckCircle2 size={48} color="#15803d" strokeWidth={2.5} />
                  </div>
                  
                  <h3 className={styles.formTitle}>Request Received!</h3>
                  
                  <p className={styles.successMessage}>
                    Thank you, <strong>{formData.contactPerson}</strong>.<br/>
                    We have received your inquiry for <strong>{formData.organizationName}</strong>.
                  </p>

                  <div className={styles.successInfoBox}>
                    <p>
                      Our concierge will contact you at <strong>{formData.directPhone}</strong> within 2 hours.
                    </p>
                  </div>

                  <button 
                    onClick={handleReset} 
                    className={styles.resetBtn}
                  >
                    Send Another Request
                  </button>
                </div>
              ) : (
                // --- FORM VIEW ---
                <>
                  <div className={styles.formHeader}>
                    <h3 className={styles.formTitle}>Request a Quote</h3>
                    <p className={styles.formSubtitle}>Receive a custom proposal within 2 hours.</p>
                  </div>
                  
                  <form className={styles.formBody} onSubmit={handleSubmit}>
                    {/* Organization Name */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Organization Name <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={`${styles.inputWrapper} ${focusedField === 'org' ? styles.inputWrapperFocused : ''}`}>
                        <Building2 size={18} className={styles.inputIcon} />
                        <input 
                          type="text" 
                          name="organizationName"
                          value={formData.organizationName}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('org')}
                          onBlur={() => setFocusedField(null)}
                          className={styles.input} 
                          placeholder="e.g., Google India" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Contact Person */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Contact Person <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={`${styles.inputWrapper} ${focusedField === 'person' ? styles.inputWrapperFocused : ''}`}>
                        <User size={18} className={styles.inputIcon} />
                        <input 
                          type="text" 
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('person')}
                          onBlur={() => setFocusedField(null)}
                          className={styles.input} 
                          placeholder="Your full name" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Mobile Number */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Mobile Number <span className={styles.requiredStar}>*</span>
                      </label>
                      <div className={`${styles.phoneInputWrapper} ${focusedField === 'phone' ? styles.phoneInputWrapperFocused : ''}`}>
                        <Phone size={18} className={styles.phoneIcon} />
                        <span className={styles.countryCode}>+91</span>
                        <input 
                          type="tel" 
                          name="directPhone"
                          value={formData.directPhone}
                          onChange={handlePhoneChange}
                          onFocus={() => setFocusedField('phone')}
                          onBlur={() => setFocusedField(null)}
                          className={styles.phoneInput}
                          placeholder="98765 43210" 
                          inputMode="numeric"
                          pattern="[0-9]{10}"
                          maxLength="10"
                          required 
                        />
                      </div>
                    </div>

                    {/* Service Type & Headcount */}
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
                        <div className={`${styles.inputWrapper} ${focusedField === 'headcount' ? styles.inputWrapperFocused : ''}`}>
                          <Users2 size={18} className={styles.inputIcon} />
                          <input 
                            type="number" 
                            name="totalHeadcount"
                            value={formData.totalHeadcount}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('headcount')}
                            onBlur={() => setFocusedField(null)}
                            className={styles.input} 
                            placeholder="e.g., 50" 
                            min="1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Specific Requirements */}
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>Specific Requirements</label>
                      <div className={`${styles.textareaWrapper} ${focusedField === 'requirements' ? styles.textareaWrapperFocused : ''}`}>
                        <MessageSquare size={18} className={styles.textareaIcon} />
                        <textarea 
                          rows="3" 
                          name="specificRequirements"
                          value={formData.specificRequirements}
                          onChange={handleChange}
                          onFocus={() => setFocusedField('requirements')}
                          onBlur={() => setFocusedField(null)}
                          className={styles.textarea} 
                          placeholder="Cuisines, allergies, delivery time, special requests..."
                        ></textarea>
                      </div>
                    </div>

                    {status === 'error' && (
                      <div className={styles.errorMessage}>
                        {responseMsg}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className={styles.submitBtn}
                      disabled={status === 'loading'}
                    >
                      {status === 'loading' ? (
                        <><Loader2 className={styles.spinner} size={18} /> Sending Request...</>
                      ) : (
                        'Submit Request'
                      )}
                    </button>

                    <div className={styles.tastingNote}>
                      <Check size={14} color="#166534" /> Complimentary tasting session included
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
          <p className={styles.trustHeader}>TRUSTED BY EMPLOYEES FROM INDUSTRY LEADERS</p>
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

      {/* 4. CATERING JOURNEY */}
      <div className={styles.processSection}>
        <div className={styles.maxWidthWrapper}>
          <h2 className={styles.sectionHeading}>The Catering Journey</h2>
          
          <div className={styles.stepperWrapper}>
            <div className={styles.stepperLine}></div>

            <div className={styles.stepItem}>
              <div className={styles.stepIconBox}>
                <ClipboardList size={28} color="white" />
              </div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>Consultation</h4>
                <p className={styles.stepDesc}>We discuss your budget, team preferences, and dietary needs to design a bespoke menu.</p>
              </div>
            </div>

            <div className={styles.stepItem}>
              <div className={styles.stepIconBox}>
                <Utensils size={28} color="white" />
              </div>
              <div className={styles.stepContent}>
                <h4 className={styles.stepTitle}>The Tasting</h4>
                <p className={styles.stepDesc}>We deliver a signature sample box to your office. Experience the freshness firsthand.</p>
              </div>
            </div>

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