'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import styles from './Checkout.module.css';
import pencil from "@/assets/pencil.png";

export default function SubscriptionGroup({ title, subscriptions, mealType }) {
    const router = useRouter();
    
    // Migrated to Zustand
    const { 
        setEditSubId, 
        setSubStep, 
        removeSubscription, 
        updateQuantity 
    } = useSubscriptionStore();

    const handleEdit = (subs_id) => {
        if (setEditSubId && setSubStep) {
            setEditSubId(subs_id);
            setSubStep(1);
            router.push("/subscribe");
        }
    };

    const handleQuantityChange = (sub, newQuantity) => {
        if (newQuantity < 1) {
            if (removeSubscription) removeSubscription(mealType, sub.subs_id);
        } else if (updateQuantity) {
            updateQuantity(mealType, sub.subs_id, newQuantity);
        }
    };

    const getSubscriptionType = (mealNum) => {
        switch (mealNum) {
            case 1: return "Breakfast";
            case 2: return "Lunch";
            case 3: return "Dinner";
            default: return "Custom";
        }
    };

    return (
        <div className={styles.subscriptionGroup}>
            <h3 className={styles.subscriptionGroupTitle}>{title}</h3>
            {subscriptions && subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                    <div key={sub.subs_id} className={styles.subscriptionItem}>
                        <div className={styles.subscriptionInfo}>
                            <span className={styles.subscriptionName}>
                                {sub.name} ({getSubscriptionType(sub.meal_num)})
                            </span>
                            <span className={styles.subscriptionPrice}>₹{sub.price}</span>
                        </div>
                        <div className={styles.subscriptionActions}>
                            <div className={styles.quantityControls}>
                                <button 
                                    onClick={() => handleQuantityChange(sub, sub.quantity - 1)}
                                    className={styles.quantityBtn}
                                >
                                    -
                                </button>
                                <span className={styles.quantity}>{sub.quantity || 1}</span>
                                <button 
                                    onClick={() => handleQuantityChange(sub, (sub.quantity || 1) + 1)}
                                    className={styles.quantityBtn}
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                onClick={() => handleEdit(sub.subs_id)}
                                className={styles.editBtn}
                            >
                                <Image src={pencil} alt="Edit" width={16} height={16} />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className={styles.noSubscriptions}>No subscriptions added</p>
            )}
        </div>
    );
}
