'use client';

import React, { useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import styles from './Checkout.module.css'; // This component reuses the main checkout styles
import pencil from "@/assets/pencil.png";

export default function SubscriptionGroup({ title, subscriptions, mealType }) {
    const { setEditSubId, setSubStep, removeSubscription, updateQuantity } = useContext(AppContext);
    const router = useRouter();

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
        if (mealNum === 30) return "Monthly";
        if (mealNum === 7) return "Weekly";
        if (mealNum === 3) return "Trial";
        return "Custom";
    };

    return (
        <div className={styles.parent}>
            <p className={styles.parentTitle}>{title}</p>
            <div className={styles.subscriptionBody}>
                {subscriptions.map((sub) => (
                    <div key={sub.subs_id} className={styles.orderSumRow}>
                        <div className={styles.orderSumLeft}>
                            <p>{sub.selectedMeal}</p>
                            <p className={styles.orderSumCaption}>
                                Subscription: {getSubscriptionType(sub.mealNum)}
                            </p>
                            <button className={styles.editBtn} onClick={() => handleEdit(sub.subs_id)}>
                                Edit <Image src={pencil} alt="Edit" className={styles.pencilImg} width={16} height={16} />
                            </button>
                        </div>
                        <div className={styles.orderSumMiddle}>
                            <div className={styles.quantWrapper}>
                                <button className={styles.quantSubBtn} onClick={() => handleQuantityChange(sub, sub.quantity - 1)}>-</button>
                                <p className={styles.mealQuant}>{sub.quantity}</p>
                                <button className={styles.quantAddBtn} onClick={() => handleQuantityChange(sub, sub.quantity + 1)}>+</button>
                            </div>
                        </div>
                        <div className={styles.orderSumRight}>
                            <p>₹{sub.totalAmount.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}