'use client';

import React, { useContext } from 'react';
import { useRouter } from "next/navigation";

import styles from "./DeliveryFrequency.module.css";
import SubscriptionEditor from './SubscriptionEditor';
import { AppContext } from '@/utils/AppContext';

export default function DeliveryFrequency() {
    const router = useRouter();
    const { cart } = useContext(AppContext);

    // Find if there's already a lunch or dinner subscription in the cart
    const lunchSub = cart.lunch.length > 0 ? cart.lunch[0] : null;
    const dinnerSub = cart.dinner.length > 0 ? cart.dinner[0] : null;

    return (
        <div>
            <form className={styles.formCtn}>
                <SubscriptionEditor mealType="lunch" initialData={lunchSub} />
                <SubscriptionEditor mealType="dinner" initialData={dinnerSub} />
            </form>

            <div className={styles.checkoutFooter}>
                <button className={styles.checkoutNowBtn} onClick={() => router.push('/checkout')}>
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}