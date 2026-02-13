'use client';

import React, { useState, useContext } from 'react';
import Image from 'next/image'; // 1. Use the optimized Image component

// styles (assumes colocation)
import styles from "./ChooseMeal.module.css";

// components (using the '@/' alias for robustness)
import DetailsPopup from "@/components/DetailsPopup";
import { AppContext } from '@/utils/AppContext';

// 2. Destructure props for better readability
export default function ChooseMeal({ menu_id, name, caption, monthlyPrice, weeklyPrice, trialPrice, imgSrc, items, details }) {

    const { setMenuId, setSubStep } = useContext(AppContext);
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
        <>
            <div className={styles.row} onClick={moveToNextStep}>
                <div className={styles.rowBody}>
                    <p className={styles.mealName}>{name}</p>
                    <p className={styles.mealCaption}>{caption}</p>
                    <div className={styles.mealPriceBody}>
                        Starts @ <span className={styles.mealPrice}>₹{monthlyPrice}/-</span> per meal
                    </div>
                    <button className={styles.detailsBtn} onClick={togglePopUp}>View Details</button>
                </div>

                <div className={styles.mealImgDiv}>
                    {/* 3. Use the Next.js Image component with correct props */}
                    <Image 
                        src={imgSrc} 
                        className={styles.mealImg} 
                        alt={name} // 4. Add a dynamic, descriptive alt prop
                        width={140} 
                        height={140}
                    />
                    <button className={styles.addBtn}>SELECT</button>
                </div>
            </div>
            {showPopUp && (
                <DetailsPopup 
                    imageSrc={imgSrc} 
                    items={items} 
                    details={details} 
                    name={name} 
                    monthlyPrice={parseFloat(monthlyPrice)} 
                    weeklyPrice={parseFloat(weeklyPrice)} 
                    trialPrice={parseFloat(trialPrice)} 
                    toggleClose={togglePopUp}
                />
            )}
        </>
    );
}

