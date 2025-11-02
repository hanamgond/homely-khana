'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useCartStore } from '@/stores/cartStore';
import styles from "./DeliveryFrequency.module.css";
import veg from "@/assets/veg.svg";
import arrow from "@/assets/arrow.svg";

// --- Static data ---
const mealsData = [
    { menu_id: 'homely', name: 'Homely Meal', content: "Traditional recipes and fresh ingredients.", monthlyPrice: 130, weeklyPrice: 135, trialPrice: 140, imagePath: '/meal1.jpg' },
    { menu_id: 'healthy', name: 'Healthy Meal', content: "Nutritious option with fresh vegetables.", monthlyPrice: 150, weeklyPrice: 155, trialPrice: 160, imagePath: '/meal2.jpg' },
    // Add other meals here
];

export default function SubscriptionEditor({ mealType, initialData, onMealChange }) {
    // Migrated to Zustand
    const { addSubscription, removeSubscription, updateQuantity } = useSubscriptionStore();
    const { addToCart, removeFromCart } = useCartStore();

    const [isOpen, setIsOpen] = useState(true);
    const [mealDetails, setMealDetails] = useState(initialData ? mealsData.find(m => m.menu_id === initialData.menu_id) : mealsData[0]);
    const [plan, setPlan] = useState(initialData?.mealNum || 30); // 30, 7, or 3
    const [quantity, setQuantity] = useState(initialData?.quantity || 1);
    const [deliveryDays, setDeliveryDays] = useState(initialData?.deliveryDays || [true, true, true, true, true, false, false]);
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    const [isInCart, setIsInCart] = useState(!!initialData);

    const handleAddToCart = () => {
        if (!mealDetails) {
            toast.error("Please select a meal first");
            return;
        }

        const subscriptionData = {
            subs_id: Date.now(), // Generate unique ID
            menu_id: mealDetails.menu_id,
            name: mealDetails.name,
            meal_num: plan,
            price: getPrice(),
            quantity: quantity,
            deliveryDays: deliveryDays,
            startDate: startDate,
            mealType: mealType
        };

        // Use Zustand store
        addSubscription(mealType, subscriptionData);
        
        // Also add to cart store if needed
        addToCart({
            ...subscriptionData,
            id: Date.now(),
            type: 'subscription'
        });

        setIsInCart(true);
        toast.success(`${mealDetails.name} added to cart!`);
        
        if (onMealChange) {
            onMealChange(subscriptionData);
        }
    };

    const handleRemoveFromCart = () => {
        if (initialData?.subs_id) {
            removeSubscription(mealType, initialData.subs_id);
            removeFromCart(initialData.subs_id);
        }
        setIsInCart(false);
        toast.success("Subscription removed from cart");
        
        if (onMealChange) {
            onMealChange(null);
        }
    };

    const handleUpdateQuantity = (newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveFromCart();
            return;
        }

        setQuantity(newQuantity);
        
        if (initialData?.subs_id) {
            updateQuantity(mealType, initialData.subs_id, newQuantity);
        }
        
        if (onMealChange && initialData) {
            onMealChange({
                ...initialData,
                quantity: newQuantity
            });
        }
    };

    const getPrice = () => {
        if (!mealDetails) return 0;
        switch (plan) {
            case 30: return mealDetails.monthlyPrice;
            case 7: return mealDetails.weeklyPrice;
            case 3: return mealDetails.trialPrice;
            default: return mealDetails.monthlyPrice;
        }
    };

    const toggleDay = (index) => {
        const newDays = [...deliveryDays];
        newDays[index] = !newDays[index];
        setDeliveryDays(newDays);
    };

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <div className={styles.subscriptionEditor}>
            <div className={styles.editorHeader}>
                <h3 className={styles.mealTypeTitle}>
                    {mealType === 'lunch' ? 'Lunch' : 'Dinner'} Subscription
                </h3>
                <button 
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${styles.toggleButton} ${isOpen ? styles.open : ''}`}
                >
                    <Image src={arrow} alt="Toggle" width={16} height={16} />
                </button>
            </div>

            {isOpen && (
                <div className={styles.editorContent}>
                    {/* Meal Selection */}
                    <div className={styles.mealSelection}>
                        <label className={styles.label}>Select Meal:</label>
                        <select 
                            value={mealDetails?.menu_id || ''}
                            onChange={(e) => setMealDetails(mealsData.find(m => m.menu_id === e.target.value))}
                            className={styles.select}
                        >
                            {mealsData.map(meal => (
                                <option key={meal.menu_id} value={meal.menu_id}>
                                    {meal.name} - ₹{getPrice()} per meal
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Plan Selection */}
                    <div className={styles.planSelection}>
                        <label className={styles.label}>Plan:</label>
                        <div className={styles.planOptions}>
                            <button 
                                className={`${styles.planButton} ${plan === 30 ? styles.active : ''}`}
                                onClick={() => setPlan(30)}
                            >
                                Monthly (30 days)
                            </button>
                            <button 
                                className={`${styles.planButton} ${plan === 7 ? styles.active : ''}`}
                                onClick={() => setPlan(7)}
                            >
                                Weekly (7 days)
                            </button>
                            <button 
                                className={`${styles.planButton} ${plan === 3 ? styles.active : ''}`}
                                onClick={() => setPlan(3)}
                            >
                                Trial (3 days)
                            </button>
                        </div>
                    </div>

                    {/* Delivery Days */}
                    <div className={styles.deliveryDays}>
                        <label className={styles.label}>Delivery Days:</label>
                        <div className={styles.daysGrid}>
                            {dayNames.map((day, index) => (
                                <button
                                    key={day}
                                    className={`${styles.dayButton} ${deliveryDays[index] ? styles.active : ''}`}
                                    onClick={() => toggleDay(index)}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className={styles.quantitySection}>
                        <label className={styles.label}>Quantity:</label>
                        <div className={styles.quantityControls}>
                            <button 
                                onClick={() => handleUpdateQuantity(quantity - 1)}
                                className={styles.quantityButton}
                            >
                                -
                            </button>
                            <span className={styles.quantityDisplay}>{quantity}</span>
                            <button 
                                onClick={() => handleUpdateQuantity(quantity + 1)}
                                className={styles.quantityButton}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Start Date */}
                    <div className={styles.startDate}>
                        <label className={styles.label}>Start Date:</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className={styles.dateInput}
                            min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        {!isInCart ? (
                            <button onClick={handleAddToCart} className={styles.addButton}>
                                Add to Cart - ₹{getPrice() * quantity}
                            </button>
                        ) : (
                            <button onClick={handleRemoveFromCart} className={styles.removeButton}>
                                Remove from Cart
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
