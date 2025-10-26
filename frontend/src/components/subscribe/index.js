'use client';

import React, { useState, useEffect, useContext, useRef } from 'react';
import Image from 'next/image';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import styles from './Subscribe.module.css';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../../store/cartStore';
import { fetchProducts } from '../../lib/api';

// Static Data
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
  { key: 'mon', label: 'M' }, { key: 'tue', label: 'T' }, { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' }, { key: 'fri', label: 'F' }, { key: 'sat', label: 'S' }, { key: 'sun', label: 'S' }
];

// Updated Plan Rules with proper order and styling
const planRules = {
  'Monthly': { 
    discount: 0.20, 
    description: 'Best value - 20% off',
    popular: true,
    order: 1
  },
  'Weekly':  { 
    discount: 0.10, 
    description: '10% off weekly plan',
    popular: false,
    order: 2
  },
  'Trial':   { 
    discount: 0.00, 
    description: '3 trial meals',
    popular: false,
    order: 3,
    fixedMeals: 3 // Trial always has 3 meals
  }
};

// Date configuration - tomorrow to next 15 days
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const next15Days = new Date();
next15Days.setDate(tomorrow.getDate() + 14);

export default function SubscribeClient() {
  const router = useRouter();
  const { addToCart } = useCartStore();

  // Local State
  const [selectedMealType, setSelectedMealType] = useState(mealTypes[0]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedFrequency, setSelectedFrequency] = useState(deliveryFrequencies[0]);
  const [startDate, setStartDate] = useState(tomorrow);
  const [customDays, setCustomDays] = useState({
    mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false
  });
  const [quantity, setQuantity] = useState(1);
  const [summary, setSummary] = useState({
    totalMeals: 0,
    originalAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    deliveryDaysText: ''
  });
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef(null);

  // React Query for Fetching Products
  const {
    data: rawProducts,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products', 'Meals'],
    queryFn: () => fetchProducts('Meals'),
    onError: (err) => {
      toast.error(`Could not load meals: ${err.message}`);
    }
  });

  // Filter for subscription products
  const products = React.useMemo(() => {
    if (!rawProducts) return [];
    return rawProducts.filter(p =>
      (p.booking_type === 'subscription' || p.booking_type === 'both') && p.plans && p.plans.length > 0
    );
  }, [rawProducts]);

  // Sort plans in correct order: Monthly -> Weekly -> Trial
  const sortedPlans = React.useMemo(() => {
    if (!selectedProduct?.plans) return [];
    return [...selectedProduct.plans].sort((a, b) => {
      const orderA = planRules[a.plan_name]?.order || 999;
      const orderB = planRules[b.plan_name]?.order || 999;
      return orderA - orderB;
    });
  }, [selectedProduct]);

  // Set default selections after data loads - Default to Monthly plan
  useEffect(() => {
    if (products && products.length > 0 && !selectedProduct) {
      const firstProduct = products[0];
      setSelectedProduct(firstProduct);
    }
  }, [products, selectedProduct]);

  // Set default Monthly plan when product changes
  useEffect(() => {
    if (selectedProduct && sortedPlans.length > 0) {
      const monthlyPlan = sortedPlans.find(p => p.plan_name === 'Monthly');
      if (monthlyPlan) {
        setSelectedPlan(monthlyPlan);
      } else if (sortedPlans.length > 0) {
        setSelectedPlan(sortedPlans[0]);
      }
    }
  }, [selectedProduct, sortedPlans]);

  // Calendar Click Outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [calendarRef]);

  // Calculation Logic with Trial meal fix
  useEffect(() => {
    if (!selectedProduct || !selectedPlan) {
      setSummary({ totalMeals: 0, originalAmount: 0, discountAmount: 0, totalAmount: 0, deliveryDaysText: '' });
      return;
    }
    
    const rule = planRules[selectedPlan.plan_name];
    if (!rule) { return; }
    
    let daysPerWeek = 0;
    let deliveryDaysText = '';
    
    if (selectedFrequency.id === 'custom') {
      const selectedDays = Object.keys(customDays).filter(key => customDays[key]);
      daysPerWeek = selectedDays.length;
      deliveryDaysText = selectedDays.length > 0 ? selectedDays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ') : 'None selected';
    } else {
      daysPerWeek = selectedFrequency.days;
      deliveryDaysText = selectedFrequency.name;
    }

    // Special handling for Trial plan - always 3 meals
    let totalMeals;
    if (selectedPlan.plan_name === 'Trial') {
      totalMeals = 3; // Trial always has exactly 3 meals
    } else {
      const durationDays = Number(selectedPlan.duration_days) || 0;
      const totalWeeks = durationDays > 0 ? durationDays / 7 : 0;
      totalMeals = Math.round(totalWeeks * daysPerWeek) * quantity;
    }

    const originalAmount = parseFloat(selectedPlan.price || 0) * quantity;
    const discountAmount = originalAmount * rule.discount;
    const totalAmount = originalAmount - discountAmount;
    
    setSummary({ 
      totalMeals, 
      originalAmount, 
      discountAmount, 
      totalAmount, 
      deliveryDaysText 
    });

  }, [selectedProduct, selectedPlan, selectedFrequency, quantity, customDays]);

  // Custom day toggle
  const handleCustomDayToggle = (dayKey) => {
    setCustomDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  // Proceed to Checkout
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
      originalAmount: summary.originalAmount,
      discountAmount: summary.discountAmount,
      totalPrice: summary.totalAmount,
      quantity: quantity,
      booking_type: selectedProduct.booking_type,
      base_price: selectedProduct.base_price,
      image_url: selectedProduct.image_url,
      price: summary.totalAmount
    };
    
    addToCart(orderDetails);
    toast.success("Subscription added to cart!");
    router.push('/checkout');
  };

  // getPricePerMeal helper
  const getPricePerMeal = (plan) => {
    if (!plan || !plan.price) return 0;
    
    // For Trial plan, calculate price per meal based on 3 meals
    if (plan.plan_name === 'Trial') {
      return (parseFloat(plan.price) / 3).toFixed(0);
    }
    
    if (!plan.duration_days) return 0;
    
    const durationDays = Number(plan.duration_days) || 0;
    const mealsInPlan = durationDays * (plan.meals_per_day || 1);
    return mealsInPlan > 0 ? (parseFloat(plan.price) / mealsInPlan).toFixed(0) : 0;
  };

  // Format price with Indian numbering system
  const formatPrice = (price) => {
    return parseInt(price).toLocaleString('en-IN');
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Build Your Subscription</h1>
        <p>Customize your meal plan in 4 easy steps</p>
      </div>

      {/* Step 1: Meal Type */}
      <div className={styles.stepBox}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>1</div>
          <h2>Choose Meal Type</h2>
        </div>
        <div className={styles.mealTypeGrid}>
          {mealTypes.map(type => (
            <button 
              key={type.id} 
              className={`${styles.mealTypeButton} ${selectedMealType.id === type.id ? styles.mealTypeActive : ''}`} 
              onClick={() => setSelectedMealType(type)}
            >
              <span className={styles.mealTypeName}>{type.name}</span>
              <span className={styles.mealTypeDelivery}>{type.delivery}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Meal */}
      <div className={styles.stepBox}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>2</div>
          <h2>Select Your Meal</h2>
        </div>
        {isLoading && <p>Loading meals...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
        {!isLoading && !error && (
            <>
              <div className={styles.selectionGrid}>
                {products.map(product => {
                  const firstPlan = product.plans?.[0];
                  const pricePerMeal = getPricePerMeal(firstPlan);
                  return (
                    <div
                        key={product.id}
                        className={`${styles.mealCard} ${selectedProduct?.id === product.id ? styles.mealCardActive : ''}`}
                        onClick={() => {
                            setSelectedProduct(product);
                        }}
                    >
                      <Image 
                        src={product.image_url || '/meal-placeholder.jpg'} 
                        alt={product.name} 
                        width={400} 
                        height={200} 
                        className={styles.mealImage}
                      />
                      <div className={styles.mealInfo}>
                        <h3>{product.name}</h3>
                        <p className={styles.mealDescription}>{product.description}</p>
                        {pricePerMeal > 0 && (
                          <p className={styles.mealPrice}>₹ {pricePerMeal}/- Per Meal</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className={styles.quantitySelector}>
                <span className={styles.quantityLabel}>Quantity per day:</span>
                <div className={styles.quantityControls}>
                  <button 
                    className={styles.quantityButton} 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <span className={styles.quantityDisplay}>{quantity}</span>
                  <button 
                    className={styles.quantityButton} 
                    onClick={() => setQuantity(q => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </>
        )}
      </div>

      {/* Step 3: Plan, Frequency, Date */}
      <div className={styles.stepBox}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>3</div>
          <h2>Subscription Plan</h2>
        </div>

        {/* Subscription Plans - Sorted Order */}
        <div className={styles.plansContainer}>
          {sortedPlans.map(p => {
            const rule = planRules[p.plan_name];
            if (!rule) return null;
            
            const isTrial = p.plan_name === 'Trial';
            const mealsText = isTrial ? '3 meals' : `${p.duration_days} days`;
            const discountText = rule.discount > 0 ? `${rule.discount * 100}% OFF` : null;
            const isPopular = rule.popular;

            return (
              <div
                key={p.id}
                className={`${styles.planCard} ${selectedPlan?.id === p.id ? styles.planCardActive : ''} ${isPopular ? styles.planCardPopular : ''}`}
                onClick={() => setSelectedPlan(p)}
              >
                {isPopular && <div className={styles.popularBadge}>MOST POPULAR</div>}
                <div className={styles.planHeader}>
                  <span className={styles.planName}>{p.plan_name} Plan</span>
                  {discountText && <span className={styles.discountBadge}>{discountText}</span>}
                </div>
                <div className={styles.planDetails}>
                  <span className={styles.planDuration}>{mealsText}</span>
                  <span className={styles.planDescription}>{rule.description}</span>
                </div>
                <div className={styles.planPrice}>
                  ₹{formatPrice(p.price)}/-
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.sectionDivider}></div>

        {/* Delivery Frequency */}
        <div className={styles.stepHeader}>
          <h3>Delivery Frequency</h3>
        </div>
        <div className={styles.frequencyGrid}>
          {deliveryFrequencies.map(f => (
            <button
                key={f.id}
                className={`${styles.frequencyButton} ${selectedFrequency.id === f.id ? styles.frequencyButtonActive : ''}`}
                onClick={() => setSelectedFrequency(f)}
            >
              {f.name}
            </button>
          ))}
        </div>

        {selectedFrequency.id === 'custom' && (
          <div className={styles.customDayContainer}>
            <p className={styles.customDaysLabel}>Select delivery days:</p>
            <div className={styles.daySelector}>
              {daysOfWeek.map(day => (
                <button
                  key={day.key}
                  className={`${styles.dayButton} ${customDays[day.key] ? styles.dayButtonActive : ''}`}
                  onClick={() => handleCustomDayToggle(day.key)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={styles.sectionDivider}></div>

        {/* Start Date */}
        <div className={styles.stepHeader}>
          <h3>Start Date</h3>
        </div>
        <div className={styles.datePickerContainer} ref={calendarRef}>
            <button 
              className={styles.dateDisplayButton} 
              onClick={() => setCalendarOpen(prev => !prev)}
            >
              {startDate ? format(startDate, 'do MMMM, yyyy') : 'Select a date'}
            </button>
            {isCalendarOpen && (
                <div className={styles.calendarWrapper}>
                    <DayPicker
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                            if (date) {
                              setStartDate(date);
                              setCalendarOpen(false);
                            }
                        }}
                        fromDate={tomorrow}
                        toDate={next15Days}
                        showOutsideDays
                        className={styles.calendar}
                    />
                </div>
            )}
        </div>
      </div>

      {/* Step 4: Order Summary */}
      <div className={styles.stepBox}>
        <div className={styles.stepHeader}>
          <div className={styles.stepNumber}>4</div>
          <h2>Order Summary</h2>
        </div>

        {/* Summary Table - Matching Screenshot Layout */}
        <div className={styles.summaryContainer}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Meal Type:</span>
              <span className={styles.summaryValue}>{selectedMealType.name}</span>
              <span className={styles.summaryLabel}>Start Date:</span>
              <span className={styles.summaryValue}>{startDate ? format(startDate, 'do MMMM, yyyy') : 'Not selected'}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Selected Meal:</span>
              <span className={styles.summaryValue}>{selectedProduct?.name || 'N/A'}</span>
              <span className={styles.summaryLabel}>Total Meals:</span>
              <span className={styles.summaryValue}>{summary.totalMeals}</span>
            </div>
            
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Subscription:</span>
              <span className={styles.summaryValue}>{selectedPlan?.plan_name || 'N/A'}</span>
              <span className={styles.summaryLabel}>Delivery Days:</span>
              <span className={styles.summaryValue}>{summary.deliveryDaysText || 'N/A'}</span>
            </div>
          </div>

          {/* Total Amount - Matching Screenshot */}
          <div className={styles.totalContainer}>
            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Amount:</span>
              <span className={styles.totalAmount}>₹ {formatPrice(summary.totalAmount)}/-</span>
            </div>
          </div>
        </div>

        {/* Checkout Button - Green as per screenshot */}
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