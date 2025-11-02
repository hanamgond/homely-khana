'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import styles from "./ChooseMeal.module.css";
import DetailsPopup from "@/components/DetailsPopup";

export default function ChooseMeal({ menu_id, name, caption, monthlyPrice, weeklyPrice, trialPrice, imgSrc, items, details }) {

    // Migrated to Zustand
    const { setMenuId, setSubStep } = useSubscriptionStore();
    const [showPopUp, setShowPopUp] = useState(false);

    const togglePopUp = (e) => {
        e.stopPropagation();
        setShowPopUp((prevState) => !prevState);
    };

    const moveToNextStep = () => {
        if (setMenuId && setSubStep) {
            setMenuId(menu_id);
            setSubStep(1);
        }
    };

    return (
        <div className={styles.chooseMeal}>
            <div className={styles.mealImageContainer}>
                <Image 
                    src={imgSrc} 
                    alt={name}
                    width={300}
                    height={200}
                    className={styles.mealImage}
                />
            </div>
            
            <div className={styles.mealInfo}>
                <h3 className={styles.mealName}>{name}</h3>
                <p className={styles.mealCaption}>{caption}</p>
                
                <div className={styles.pricing}>
                    <div className={styles.priceOption}>
                        <span className={styles.priceLabel}>Monthly:</span>
                        <span className={styles.priceValue}>₹{monthlyPrice}/meal</span>
                    </div>
                    <div className={styles.priceOption}>
                        <span className={styles.priceLabel}>Weekly:</span>
                        <span className={styles.priceValue}>₹{weeklyPrice}/meal</span>
                    </div>
                    <div className={styles.priceOption}>
                        <span className={styles.priceLabel}>Trial:</span>
                        <span className={styles.priceValue}>₹{trialPrice}/meal</span>
                    </div>
                </div>

                <div className={styles.mealActions}>
                    <button 
                        onClick={moveToNextStep}
                        className={styles.selectButton}
                    >
                        Select Plan
                    </button>
                    <button 
                        onClick={togglePopUp}
                        className={styles.detailsButton}
                    >
                        View Details
                    </button>
                </div>
            </div>

            {showPopUp && (
                <DetailsPopup 
                    details={details}
                    onClose={togglePopUp}
                />
            )}
        </div>
    );
}
