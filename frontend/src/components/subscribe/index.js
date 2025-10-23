'use client';

import { useState, useEffect, useContext, useRef } from 'react';
import Image from 'next/image';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import styles from './Subscribe.module.css';
import { toast } from 'sonner';

const mealTypes = [
  { id: 'lunch', name: 'Lunch', delivery: 'Delivery between 12:00 to 14:00' },
  { id: 'dinner', name: 'Dinner', delivery: 'Delivery between 19:00 to 21:00' },
];
const deliveryFrequencies = [
  { id: 'mon-fri', name: 'Mon - Fri', days: 5 },
  { id: 'mon-sat', name: 'Mon - Sat', days: 6 },
  { id: 'mon-sun', name: 'Mon - Sun', days: 7 },
  { id: 'custom', name: 'Custom', days: 0 }, 
];
const daysOfWeek = [
  { key: 'mon', label: 'Mon' }, { key: 'tue', label: 'Tue' }, { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' }, { key: 'fri', label: 'Fri' }, { key: 'sat', label: 'Sat' }, { key: 'sun', label: 'Sun' }
];

// --- UPDATED: Rules now ONLY control discounts ---
const planRules = {
  'Monthly': { discount: 0.20 },
  'Weekly':  { discount: 0.10 },
  'Trial':   { discount: 0.00 }
};
// --------------------------------------------------

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const next15Days = new Date();
next15Days.setDate(tomorrow.getDate() + 14); 

export default function SubscribeClient() {
  const router = useRouter();
  const { addSubscription } = useContext(AppContext);

  // --- State for fetched data ---
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- State for user selections ---
  const [selectedMealType, setSelectedMealType] = useState(mealTypes[0]);
  const [selectedProduct, setSelectedProduct] = useState(null); 
  const [selectedPlan, setSelectedPlan] = useState(null); 
  const [selectedFrequency, setSelectedFrequency] = useState(deliveryFrequencies[0]);
  const [startDate, setStartDate] = useState(tomorrow);
  const [customDays, setCustomDays] = useState({
    mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false
  });
  const [quantity, setQuantity] = useState(1);
  
  // --- UPDATED: Summary state ---
  const [summary, setSummary] = useState({
    totalMeals: 0,
    originalAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    deliveryDaysText: ''
  });
  // ------------------------------
  
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // --- Fetch Products from API (No changes) ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/products?type=Meals`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          const subscriptionProducts = data.data.filter(p =>
            (p.booking_type === 'subscription' || p.booking_type === 'both') && p.plans && p.plans.length > 0
          );
          setProducts(subscriptionProducts);
          if (subscriptionProducts.length > 0) {
            setSelectedProduct(subscriptionProducts[0]);
            const firstValidPlan = subscriptionProducts[0].plans.find(p => planRules[p.plan_name]);
            if (firstValidPlan) {
                setSelectedPlan(firstValidPlan); 
            }
          }
        } else {
          throw new Error(data.error || 'Failed to fetch subscription meals.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        console.error("Error fetching products:", err);
        toast.error("Could not load meals. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);
  
  // --- Calendar Click Outside (No changes) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef]);

  // --- MAJOR UPDATE: Combined calculation logic ---
  useEffect(() => {
    if (!selectedProduct || !selectedPlan) {
      setSummary({ totalMeals: 0, originalAmount: 0, discountAmount: 0, totalAmount: 0, deliveryDaysText: '' });
      return;
    }

    // 1. Get the discount rule (e.g., {discount: 0.20})
    const rule = planRules[selectedPlan.plan_name];

    if (!rule) {
      console.error(`No plan rule found for: ${selectedPlan.plan_name}`);
      setSummary({ totalMeals: 0, originalAmount: 0, discountAmount: 0, totalAmount: 0, deliveryDaysText: 'N/A' });
      return;
    }

    // 2. Get Delivery Days Text (Original Logic)
    let daysPerWeek = 0;
    let deliveryDaysText = '';
    if (selectedFrequency.id === 'custom') {
      const selectedDays = Object.keys(customDays).filter(key => customDays[key]);
      daysPerWeek = selectedDays.length;
      deliveryDaysText = selectedDays.length > 0
        ? selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') 
        : 'None selected';
    } else {
      daysPerWeek = selectedFrequency.days;
      deliveryDaysText = selectedFrequency.name;
    }
    
    // 3. Calculate Total Meals (REVERTED to Original Logic)
    const totalWeeks = selectedPlan.duration_days / 7;
    const totalMeals = Math.round(totalWeeks * daysPerWeek) * quantity;
    
    // 4. Calculate Pricing (NEW Logic)
    const originalAmount = parseFloat(selectedPlan.price) * quantity;
    const discountAmount = originalAmount * rule.discount;
    const totalAmount = originalAmount - discountAmount;

    setSummary({ totalMeals, originalAmount, discountAmount, totalAmount, deliveryDaysText });

  }, [selectedProduct, selectedPlan, selectedFrequency, quantity, customDays]);
  // -----------------------------------------------------

  // --- Handler for custom day toggle (No changes) ---
  const handleCustomDayToggle = (dayKey) => {
    setCustomDays(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };
  
  // --- UPDATED: Proceed to Checkout (with new summary fields) ---
  const handleProceedToCheckout = () => {
    if (!selectedProduct || !selectedPlan || !startDate) {
        toast.error("Please select a meal, plan, and start date.");
        return;
    }

    if (selectedFrequency.id === 'custom' && Object.values(customDays).filter(Boolean).length === 0) {
      toast.error("Please select at least one delivery day for your custom plan.");
      return;
    }
    
    const orderDetails = {
      id: selectedProduct.id,
      name: selectedProduct.name, 
      mealType: selectedMealType.name,
      plan: selectedPlan, 
      frequency: summary.deliveryDaysText, 
      startDate: format(startDate, 'yyyy-MM-dd'), 
      totalMeals: summary.totalMeals, 
      
      // Pass all price components to checkout
      originalAmount: summary.originalAmount,
      discountAmount: summary.discountAmount,
      totalPrice: summary.totalAmount, // This is the final, discounted price
      
      quantity: quantity,
      booking_type: selectedProduct.booking_type,
      base_price: selectedProduct.base_price,
      image_url: selectedProduct.image_url
    };

    console.log("Adding to cart:", orderDetails);
    addSubscription(orderDetails);
    router.push('/checkout');
  };
  
  // --- Helper to calculate price per meal (No changes) ---
  const getPricePerMeal = (plan) => {
    if (!plan || !plan.price || !plan.duration_days) return 0;
    const mealsInPlan = plan.duration_days * (plan.meals_per_day || 1);
    return mealsInPlan > 0 ? (parseFloat(plan.price) / mealsInPlan).toFixed(0) : 0;
  };

  // --- Render ---
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1>Build Your Subscription</h1>
        <p>Customize your meal plan in 4 easy steps</p>
      </div>

      {/* --- Step 1: Meal Type (No changes) --- */}
      <div className={styles.stepBox}>
        {/* ... same as before ... */}
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>1</div>
          <h2>Choose Meal Type</h2>
        </div>
        <div className={styles.buttonGroup}>
          {mealTypes.map(type => (
            <button key={type.id} className={`${styles.optionButton} ${selectedMealType.id === type.id ? styles.active : ''}`} onClick={() => setSelectedMealType(type)}>
              {type.name}
              <span>{type.delivery}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- Step 2: Select Meal (No changes) --- */}
      <div className={styles.stepBox}>
        {/* ... same as before ... */}
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>2</div>
          <h2>Select Your Meal</h2>
        </div>
        {isLoading && <p>Loading meals...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && (
            <>
              <div className={styles.selectionGrid}>
                {products.map(product => {
                  const firstPlan = product.plans?.[0];
                  const pricePerMeal = getPricePerMeal(firstPlan);
                  return (
                    <div
                        key={product.id}
                        className={`${styles.mealCard} ${selectedProduct?.id === product.id ? styles.active : ''}`}
                        onClick={() => {
                            setSelectedProduct(product);
                            const firstValidPlan = product.plans.find(p => planRules[p.plan_name]);
                            setSelectedPlan(firstValidPlan || null); 
                        }}
                    >
                      <Image src={product.image_url || '/meal-placeholder.jpg'} alt={product.name} width={400} height={180} style={{objectFit:'cover'}} />
                      <div className={styles.mealInfo}>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        {pricePerMeal > 0 && <p className={styles.mealPrice}>₹ {pricePerMeal} /- Per Meal</p>}
                        {pricePerMeal === 0 && <p className={styles.mealPrice}>Price varies</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.quantitySelector}>
                <span className={styles.quantityLabel}>Quantity per day:</span>
                <div className={styles.quantityControls}>
                  <button className={styles.quantityButton} onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</button>
                  <span className={styles.quantityDisplay}>{quantity}</span>
                  <button className={styles.quantityButton} onClick={() => setQuantity(q => q + 1)}>+</button>
                </div>
              </div>
            </>
        )}
      </div>

      {/* --- Step 3: Plan, Frequency, Date --- */}
      <div className={styles.stepBox}>
        <p className={styles.stepTitle}>Subscription Plan</p>
        <div className={styles.buttonGroup}>
           {/* --- UPDATED: Plan buttons show duration (original) + discount (new) --- */}
           {selectedProduct?.plans?.map(p => {
              const rule = planRules[p.plan_name];
              if (!rule) return null; 

              const planName = p.plan_name === 'Trial' ? 'Trial Meals' : `${p.plan_name} Plan`;
              const subtext = `${p.duration_days} days`; // REVERTED to duration
              const discountBadge = rule.discount > 0 ? `(${rule.discount * 100}% Off)` : null;
              
              return (
                <button
                    key={p.id} 
                    className={`${styles.optionButton} ${selectedPlan?.id === p.id ? styles.active : ''}`}
                    onClick={() => setSelectedPlan(p)} 
                >
                  {planName} 
                  {discountBadge && <span className={styles.discountBadge}>{discountBadge}</span>}
                  <span>{subtext}</span> {/* Shows duration */}
                </button>
              );
           })}
           {/* ---------------------------------- */}
          {(!selectedProduct || !selectedProduct.plans || selectedProduct.plans.length === 0) && !isLoading && (
            <p>Please select a meal to see available plans.</p>
          )}
        </div>
        <br />
        <p className={styles.stepTitle}>Delivery Frequency</p>
        <div className={styles.buttonGroup}>
           {deliveryFrequencies.map(f => (
            <button
                key={f.id}
                className={`${styles.optionButton} ${selectedFrequency.id === f.id ? styles.active : ''}`}
                onClick={() => setSelectedFrequency(f)}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* --- Custom day selection (No changes) --- */}
        {selectedFrequency.id === 'custom' && (
          <div className={styles.customDayContainer}>
            <p className={styles.stepTitle}>Select delivery days:</p>
            <div className={styles.daySelector}>
              {daysOfWeek.map(day => (
                <button
                  key={day.key}
                  className={`${styles.dayButton} ${customDays[day.key] ? styles.active : ''}`}
                  onClick={() => handleCustomDayToggle(day.key)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <br/>
        <p className={styles.stepTitle}>Start Date</p>
        {/* --- Calendar (No changes) --- */}
        <div className={styles.datePickerContainer} ref={calendarRef}>
            <button className={styles.dateDisplayButton} onClick={() => setCalendarOpen(prev => !prev)}>
                {startDate ? format(startDate, 'do MMMM, yyyy') : 'Select a date'}
            </button>
            {isCalendarOpen && (
                <div className={styles.calendarWrapper}>
                    <DayPicker
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                            if (date) setStartDate(date);
                            setCalendarOpen(false);
                        }}
                        fromDate={tomorrow}
                        toDate={next15Days}
                        modifiersClassNames={{ selected: styles.daySelected }}
                    />
                </div>
            )}
        </div>
      </div>

      {/* --- Step 4: Order Summary --- */}
      <div className={styles.stepBox}>
         <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>4</div>
          <h2>Order Summary</h2>
        </div>
        {/* --- UPDATED: Summary grid with discount --- */}
        <div className={styles.summaryGrid}>
          <span className={styles.summaryLabel}>Meal Type</span>
          <span className={styles.summaryValue}>{selectedMealType.name}</span>
          
          <span className={styles.summaryLabel}>Selected Meal</span>
          <span className={styles.summaryValue}>{selectedProduct?.name || 'N/A'}</span>
          
          <span className={styles.summaryLabel}>Quantity/Day:</span>
          <span className={styles.summaryValue}>{quantity}</span>
          
          <span className={styles.summaryLabel}>Subscription:</span>
          <span className={styles.summaryValue}>{selectedPlan?.plan_name || 'N/A'}</span>
          
          <span className={styles.summaryLabel}>Delivery Days:</span>
          <span className={styles.summaryValue}>{summary.deliveryDaysText || 'N/A'}</span>
          
          <span className={styles.summaryLabel}>Start Date:</span>
          <span className={styles.summaryValue}>{startDate ? format(startDate, 'do MMMM, yyyy') : 'Not selected'}</span>
          
          {/* This now shows the dynamic meal count */}
          <span className={styles.summaryLabel}>Total Meals:</span>
          <span className={styles.summaryValue}>{summary.totalMeals}</span>

          {/* --- NEW PRICE BREAKDOWN --- */}
          <span className={styles.summaryLabel} style={{marginTop: '1rem'}}>Subtotal</span>
          <span className={styles.summaryValue} style={{marginTop: '1rem'}}>
            ₹ {(summary.originalAmount || 0).toLocaleString('en-IN')}
          </span>
          
          {summary.discountAmount > 0 && (
            <>
              <span className={`${styles.summaryLabel} ${styles.discountText}`}>
                Subscription Discount
              </span>
              <span className={`${styles.summaryValue} ${styles.discountText}`}>
                - ₹ {(summary.discountAmount || 0).toLocaleString('en-IN')}
              </span>
            </>
          )}
          {/* ------------------------- */}
          
          <div className={styles.totalAmountRow}>
            <span className={styles.summaryTotalLabel}>Total Amount</span>
            <span className={styles.summaryTotalPrice}>
              ₹ {(summary.totalAmount || 0).toLocaleString('en-IN')}/-
            </span>
          </div>
        </div>
        <button
          className={styles.checkoutButton}
          onClick={handleProceedToCheckout}
          disabled={!selectedProduct || !selectedPlan || !startDate || isLoading}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}