'use client';

import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';

import styles from "./DeliveryFrequency.module.css";
import { AppContext } from '@/utils/AppContext';
import veg from "@/assets/veg.svg";
import arrow from "@/assets/arrow.svg";

// --- Static data ---
const mealsData = [
    { menu_id: 'homely', name: 'Homely Meal', content: "Traditional recipes and fresh ingredients.", monthlyPrice: 130, weeklyPrice: 135, trialPrice: 140, imagePath: '/meal1.jpg' },
    { menu_id: 'healthy', name: 'Healthy Meal', content: "Nutritious option with fresh vegetables.", monthlyPrice: 150, weeklyPrice: 155, trialPrice: 160, imagePath: '/meal2.jpg' },
    // Add other meals here
];

export default function SubscriptionEditor({ mealType, initialData, onMealChange }) {
    const { addSubscription, removeSubscription, updateQuantity } = useContext(AppContext);

    const [isOpen, setIsOpen] = useState(true);
    const [mealDetails, setMealDetails] = useState(initialData ? mealsData.find(m => m.menu_id === initialData.menu_id) : mealsData[0]);
    const [plan, setPlan] = useState(initialData?.mealNum || 30); // 30, 7, or 3
    const [quantity, setQuantity] = useState(initialData?.quantity || 1);
    const [deliveryDays, setDeliveryDays] = useState(initialData?.deliveryDays || [true, true, true, true, true, false, false]);
    const [startDate, setStartDate] = useState(initialData?.startDate || new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    const [isInCart, setIsInCart] = useState(!!initialData);

    const handleAddToCart = () => {
        const priceMap = { 30: mealDetails.monthlyPrice, 7: mealDetails.weeklyPrice, 3: mealDetails.trialPrice };
        const totalAmount = quantity * priceMap[plan] * (plan === 30 ? 4 : 1) * deliveryDays.filter(Boolean).length;

        const subscription = {
            name: mealDetails.name,
            quantity,
            menu_id: mealDetails.menu_id,
            mealNum: plan,
            deliveryDays,
            startDate,
            price: totalAmount,
            mealType: mealType, // 'lunch' or 'dinner'
        };

        if (addSubscription) {
            addSubscription(subscription);
            setIsInCart(true);
            toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} meal added to cart!`);
        }
    };

    // ... (other handlers like handleRemoveFromCart, handleQuantityChange would go here)

    return (
        <div className={`${styles["parent"]} ${isOpen ? styles["parentExpand"] : ""}`}>
            <div className={styles.mealTypeParent}>
                <div className={styles.mealTypeDiv}>
                    <Image src={veg} alt="Veg icon" />
                    {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    <p>({mealType === 'lunch' ? '12:00-14:00' : '19:00-21:00'})</p>
                </div>
                <button className={styles.expandBtn} onClick={() => setIsOpen(prev => !prev)}>
                    <Image src={arrow} alt="Toggle view" className={`${styles["arrow"]} ${isOpen ? styles["active"] : ""}`} />
                </button>
            </div>

            {isOpen && (
                <div>
                    {/* (All the form JSX for choosing meal, plan, frequency, etc. goes here) */}
                    {/* This is a simplified version */}
                    <p className={styles.innerTitle}>Chosen Meal:</p>
                    <div className={styles.mealNameCtn}>
                         <Image src={mealDetails.imagePath} className={styles.mealImg} alt={mealDetails.name} width={80} height={80} />
                         <div className={styles.mealInfo}>
                            {mealDetails.name}
                            <p className={styles.mealCaption}>{mealDetails.content}</p>
                         </div>
                    </div>
                    {/* ... other form elements ... */}

                    <div className={styles.endBtnCtn}>
                        {isInCart ? (
                            <button className={styles.removeButton} onClick={() => { /* remove logic */ }}>In Cart</button>
                        ) : (
                            <button className={styles.subscribeButton} onClick={handleAddToCart}>Add to Cart</button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}