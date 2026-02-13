//frontend/sc/components/subscribe/index.js
'use client';

import { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/shared/lib/AppContext';
import styles from './Subscribe.module.css';
import { toast } from 'sonner';
import { Check, Clock, Calendar, ArrowRight, Edit2, Info, ShieldCheck } from 'lucide-react';

// --- CONSTANTS ---
const mealTypes = [
  { id: 'lunch', name: 'Lunch', timeRange: '12:00 PM - 02:00 PM' },
  { id: 'dinner', name: 'Dinner', timeRange: '07:30 PM - 09:30 PM' },
];

const deliveryFrequencies = [
  { id: 'mon-fri', name: 'Mon - Fri', days: 5 },
  { id: 'mon-sat', name: 'Mon - Sat', days: 6 },
  { id: 'mon-sun', name: 'Mon - Sun', days: 7 },
  { id: 'custom', name: 'Custom', days: 0 }, 
];

const daysOfWeek = [
  { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'Sa' }, { key: 'sun', label: 'Su' }
];

const planRules = {
  'Monthly': { discount: 0.20, label: 'Best Value', isTrial: false },
  'Weekly':  { discount: 0.10, label: 'Popular', isTrial: false },
  'Trial':   { discount: 0.00, label: null, isTrial: true }
};

export default function SubscribeClient() {
  const router = useRouter();
  const { addSubscription } = useContext(AppContext);

  // --- STATE ---
  const [currentStep, setCurrentStep] = useState(1);
  const [minDateStr, setMinDateStr] = useState('');
  const [maxDateStr, setMaxDateStr] = useState('');

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selections, setSelections] = useState({
    mealType: null,
    product: null,
    plan: null,
    frequency: deliveryFrequencies[0],
    customDays: { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false },
    startDate: '',
    quantity: 1
  });

  const [summary, setSummary] = useState({
    totalMeals: 0,
    originalAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    deliveryDaysText: ''
  });

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const fmt = (d) => d.toISOString().split('T')[0];
    const minStr = fmt(tomorrow);

    const maxDate = new Date(tomorrow);
    maxDate.setDate(maxDate.getDate() + 14);

    setMinDateStr(minStr);
    setMaxDateStr(fmt(maxDate));
    
    setSelections(prev => ({ ...prev, startDate: minStr }));

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/products?type=Meals`);
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          const validProducts = data.data.filter(p =>
            (p.booking_type === 'subscription' || p.booking_type === 'both') && p.plans?.length > 0
          );
          setProducts(validProducts);
        }
      } catch (err) {
        toast.error("Could not load meals.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- 2. CALCULATIONS ---
  useEffect(() => {
    const { product, plan, frequency, customDays, quantity } = selections;
    if (!product || !plan) return;

    const rule = planRules[plan.plan_name] || { discount: 0, isTrial: false };
    
    let daysPerWeek = 0;
    let deliveryDaysText = '';

    if (rule.isTrial) {
        daysPerWeek = 7;
        deliveryDaysText = 'Consecutive Days';
    } else {
        if (frequency.id === 'custom') {
            const selectedDays = Object.keys(customDays).filter(key => customDays[key]);
            daysPerWeek = selectedDays.length;
            deliveryDaysText = selectedDays.length > 0
                ? selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') 
                : 'None selected';
        } else {
            daysPerWeek = frequency.days;
            deliveryDaysText = frequency.name;
        }
    }
    
    const totalWeeks = plan.duration_days / 7;
    const calculatedMeals = Math.round(totalWeeks * daysPerWeek) * quantity;
    
    const originalAmount = parseFloat(plan.price) * quantity;
    const discountAmount = originalAmount * rule.discount;
    const totalAmount = originalAmount - discountAmount;

    setSummary({ totalMeals: calculatedMeals, originalAmount, discountAmount, totalAmount, deliveryDaysText });
  }, [selections]);

  // --- HANDLERS ---
  const handleTypeSelect = (type) => {
    setSelections(prev => ({ ...prev, mealType: type }));
    setCurrentStep(2);
  };

  const handleProductSelect = (product) => {
    const firstValidPlan = product.plans.find(p => planRules[p.plan_name]) || product.plans[0];
    setSelections(prev => ({ ...prev, product: product, plan: firstValidPlan }));
    setCurrentStep(3);
  };

  const handlePlanSelect = (plan) => {
      setSelections(prev => ({ ...prev, plan: plan }));
  };

  const handleCustomDayToggle = (dayKey) => {
    setSelections(prev => ({
      ...prev,
      customDays: { ...prev.customDays, [dayKey]: !prev.customDays[dayKey] }
    }));
  };

  const handleProceedToCheckout = () => {
    const { product, mealType, plan, startDate, quantity } = selections;
    const rule = planRules[plan?.plan_name];

    if (!product || !plan || !startDate) return toast.error("Please complete all steps.");
    
    if (!rule?.isTrial && selections.frequency.id === 'custom' && summary.deliveryDaysText === 'None selected') {
      return toast.error("Please select at least one delivery day.");
    }
    
    addSubscription({
      id: product.id,
      name: product.name, 
      mealType: mealType.name,
      plan: plan, 
      frequency: summary.deliveryDaysText, 
      startDate: startDate, 
      totalMeals: summary.totalMeals, 
      originalAmount: summary.originalAmount,
      discountAmount: summary.discountAmount,
      totalPrice: summary.totalAmount,
      quantity: quantity,
      booking_type: product.booking_type,
      base_price: product.base_price,
      image_url: product.image_url
    });
    router.push('/checkout');
  };

  const getPricePerMeal = (plan) => {
    if (!plan?.price || !plan?.duration_days) return 0;
    const mealsInPlan = plan.duration_days * (plan.meals_per_day || 1);
    return mealsInPlan > 0 ? (parseFloat(plan.price) / mealsInPlan).toFixed(0) : 0;
  };

  const isTrialSelected = planRules[selections.plan?.plan_name]?.isTrial;

  return (
    <div className={styles.pageContainer}>
      
      {/* --- HERO SECTION --- */}
      <div className={styles.heroSection}>
        {/* Note: Image is now handled via CSS background for better overlay control */}
        
        <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Meal Plans</span>
            <h1 className={styles.heroTitle}>Your Daily Dose of Home</h1>
            <p className={styles.heroSubtitle}>
                Forget grocery shopping and cooking. Subscribe to healthy, <br className="hidden md:block"/>
                homely meals delivered right to your doorstep.
            </p>
        </div>
      </div>

      {/* --- OVERLAP CONTAINER --- */}
      <div className={styles.contentWrapper}>
        <div className={styles.mainCard}>
            
            {/* --- STEP 1: MEAL TYPE --- */}
            <div className={`${styles.stepSection} ${currentStep >= 1 ? styles.activeStep : ''}`}>
                <div className={styles.stepHeader}>
                    <div className={styles.stepNum}>1</div>
                    <h3 className={styles.stepTitle}>Choose Meal Session</h3>
                    {currentStep > 1 && <button className={styles.editBtn} onClick={() => setCurrentStep(1)}><Edit2 size={14} /> Edit</button>}
                </div>
                {/* Always show Step 1 content if currentStep is 1, or collapse it if > 1 (optional, here we keep logic same) */}
                {currentStep === 1 && (
                    <div className={styles.stepContent}>
                        <div className={styles.typeGrid}>
                            {mealTypes.map((type) => (
                                <button key={type.id} className={`${styles.typeBtn} ${selections.mealType?.id === type.id ? styles.selectedType : ''}`} onClick={() => handleTypeSelect(type)}>
                                    <div className={styles.typeInfo}>
                                        <span className={styles.typeName}>{type.name}</span>
                                        <span className={styles.typeTime}><Clock size={14}/> {type.timeRange}</span>
                                    </div>
                                    {selections.mealType?.id === type.id && <Check size={20} />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- STEP 2: SELECT MEAL --- */}
            <div className={`${styles.stepSection} ${currentStep >= 2 ? styles.activeStep : styles.lockedStep}`}>
                <div className={styles.stepHeader}>
                    <div className={styles.stepNum}>2</div>
                    <h3 className={styles.stepTitle}>Select Your Meal</h3>
                    {currentStep > 2 && <button className={styles.editBtn} onClick={() => setCurrentStep(2)}><Edit2 size={14} /> Edit</button>}
                </div>
                {currentStep === 2 && (
                    <div className={`${styles.stepContent} ${styles.fadeIn}`}>
                        {isLoading ? <div className={styles.loadingState}>Loading menu...</div> : (
                            <>
                            <div className={styles.mealsGrid}>
                                {products.map((product) => {
                                    const price = getPricePerMeal(product.plans?.[0]);
                                    const isSelected = selections.product?.id === product.id;
                                    return (
                                        <div key={product.id} className={`${styles.mealCard} ${isSelected ? styles.selectedCard : ''}`} onClick={() => handleProductSelect(product)}>
                                            <div className={styles.imageWrapper}>
                                                <Image src={product.image_url || '/meal-placeholder.jpg'} alt={product.name} fill className={styles.mealImg}/>
                                                {isSelected && <div className={styles.selectedOverlay}>Selected</div>}
                                            </div>
                                            <div className={styles.cardBody}>
                                                <h4>{product.name}</h4>
                                                <span className={styles.priceTag}>{price > 0 ? `₹ ${price} / meal` : 'Price Varies'}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className={styles.quantitySection}>
                                <span className={styles.label}>Quantity Per Day</span>
                                <div className={styles.qtyControls}>
                                    <button onClick={() => setSelections(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))}>-</button>
                                    <span>{selections.quantity}</span>
                                    <button onClick={() => setSelections(p => ({...p, quantity: p.quantity + 1}))}>+</button>
                                </div>
                            </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* --- STEP 3: PLAN & SCHEDULE --- */}
            <div className={`${styles.stepSection} ${currentStep >= 3 ? styles.activeStep : styles.lockedStep}`}>
                <div className={styles.stepHeader}>
                    <div className={styles.stepNum}>3</div>
                    <h3 className={styles.stepTitle}>Plan & Schedule</h3>
                    {currentStep > 3 && <button className={styles.editBtn} onClick={() => setCurrentStep(3)}><Edit2 size={14} /> Edit</button>}
                </div>
                
                {currentStep === 3 && selections.product && (
                    <div className={`${styles.stepContent} ${styles.fadeIn}`}>
                        
                        {/* A. PLAN SELECTION */}
                        <div className={styles.sectionBlock}>
                            <label className={styles.sectionLabel}>Select Duration</label>
                            <div className={styles.planCardsGrid}>
                                {selections.product.plans?.map(p => {
                                    const rule = planRules[p.plan_name];
                                    if (!rule) return null;
                                    const isSelected = selections.plan?.id === p.id;
                                    return (
                                        <button key={p.id} className={`${styles.planCard} ${isSelected ? styles.planCardActive : ''}`} onClick={() => handlePlanSelect(p)}>
                                            {rule.label && <span className={styles.planBadge}>{rule.label}</span>}
                                            <span className={styles.planName}>{p.plan_name}</span>
                                            <span className={styles.planDuration}>{p.duration_days} Days</span>
                                            {rule.discount > 0 && <span className={styles.planDiscount}>{rule.discount * 100}% Savings</span>}
                                            {isSelected && <div className={styles.checkIcon}><Check size={14}/></div>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* B. FREQUENCY */}
                        {!isTrialSelected && (
                            <div className={styles.sectionBlock}>
                                <label className={styles.sectionLabel}>Delivery Days</label>
                                <div className={styles.freqContainer}>
                                    {deliveryFrequencies.map(f => (
                                        <button key={f.id} className={`${styles.freqSegment} ${selections.frequency.id === f.id ? styles.freqActive : ''}`} onClick={() => setSelections(prev => ({...prev, frequency: f}))}>
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* C. CUSTOM DAYS */}
                        {!isTrialSelected && selections.frequency.id === 'custom' && (
                            <div className={styles.customDayWrapper}>
                                <p className={styles.miniLabel}>Select specific days of the week:</p>
                                <div className={styles.daySelector}>
                                    {daysOfWeek.map(day => (
                                        <button key={day.key} className={`${styles.dayCircle} ${selections.customDays[day.key] ? styles.activeDay : ''}`} onClick={() => handleCustomDayToggle(day.key)}>
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {isTrialSelected && (
                            <div className={styles.trialInfoBox}>
                                <Info size={16} />
                                <span>Trial meals are delivered on <strong>3 consecutive days</strong> starting from your selected date.</span>
                            </div>
                        )}

                        {/* D. DATE INPUT */}
                        <div className={styles.sectionBlock}>
                            <label className={styles.sectionLabel}>Start Date</label>
                            <div className={styles.premiumDateInput} onClick={() => document.getElementById('nativeDate').showPicker()}>
                                <div className={styles.dateIconBox}>
                                    <Calendar size={20} color="#d97706" />
                                </div>
                                <div className={styles.dateInfo}>
                                    <span className={styles.dateLabel}>First Meal On</span>
                                    <input 
                                        id="nativeDate"
                                        type="date"
                                        className={styles.hiddenNativeInput}
                                        min={minDateStr}
                                        max={maxDateStr}
                                        value={selections.startDate}
                                        onChange={(e) => setSelections(prev => ({...prev, startDate: e.target.value}))}
                                    />
                                    <span className={styles.displayDate}>
                                        {selections.startDate || "Select a date"}
                                    </span>
                                </div>
                                <div className={styles.dateHint}>
                                    <Info size={14} /> Max 15 days in advance
                                </div>
                            </div>
                        </div>

                        <button className={styles.continueBtn} onClick={() => setCurrentStep(4)}>Continue to Summary</button>
                    </div>
                )}
            </div>

            {/* --- STEP 4: SUMMARY --- */}
            {currentStep >= 4 && (
                <div className={`${styles.stepSection} ${styles.summarySection} ${styles.fadeIn}`}>
                    <div className={styles.stepHeader} style={{borderBottom:'none', background:'#2c1810', color:'white', borderRadius: '8px 8px 0 0'}}>
                        <div className={styles.stepNum} style={{background:'white', color:'#2c1810'}}>4</div>
                        <h3 className={styles.stepTitle} style={{color:'white'}}>Order Summary</h3>
                    </div>
                    
                    <div className={styles.summaryBox}>
                        <div className={styles.summaryRow}><span>Meal Session</span><strong>{selections.mealType?.name}</strong></div>
                        <div className={styles.summaryRow}><span>Delivery Slot</span><strong>{selections.mealType?.timeRange}</strong></div>
                        <div className={styles.summaryRow}><span>Selected Meal</span><strong>{selections.product?.name}</strong></div>
                        <div className={styles.summaryRow}><span>Plan</span><strong>{selections.plan?.plan_name}</strong></div>
                        <div className={styles.summaryRow}><span>Frequency</span><strong>{summary.deliveryDaysText}</strong></div>
                        <div className={styles.summaryRow}><span>Total Meals</span><strong>{summary.totalMeals}</strong></div>
                        <div className={styles.divider}></div>
                        <div className={styles.summaryRow}><span>Subtotal</span><span>₹ {summary.originalAmount}</span></div>
                        {summary.discountAmount > 0 && <div className={`${styles.summaryRow} ${styles.greenText}`}><span>Discount</span><span>- ₹ {summary.discountAmount}</span></div>}
                        <div className={styles.totalRow}><span>Total Amount</span><span className={styles.finalPrice}>₹ {summary.totalAmount}</span></div>
                    </div>

                    <div className={styles.trustRow}>
                        <ShieldCheck size={16} color="#15803d"/> 
                        <span>Free cancellation before 24 hours of delivery.</span>
                    </div>

                    <button className={styles.checkoutBtn} onClick={handleProceedToCheckout}>Proceed to Checkout <ArrowRight size={20} /></button>
                </div>
            )}
            
        </div>
      </div>
    </div>
  );
}