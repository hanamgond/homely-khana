'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // 1. Use the optimized Image component

// styles (assuming colocation)
import styles from "./ChangeMealDrawer.module.css";

// assets (using the '@/' alias)
import closeBtn from "@/assets/closeBtn.svg";

export default function ChangeMealDrawer({ show, toggleShow, meals, setClickId }) {
    const [isSliding, setIsSliding] = useState(false);

    useEffect(() => {
        if (show) {
            // A tiny delay ensures the component is in the DOM before adding the slide class
            const timer = setTimeout(() => setIsSliding(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsSliding(false);
        }
    }, [show]);

    const handleSelectMeal = (e, menu_id) => {
        e.stopPropagation();
        if (setClickId) {
            setClickId(menu_id);
        }
        closeDrawer();
    };

    const closeDrawer = () => {
        setIsSliding(false);
        // Wait for the slide-out animation to finish before removing from DOM
        setTimeout(() => {
            if (toggleShow) {
                toggleShow(false);
            }
        }, 300);
    };

    // Don't render anything if the drawer is not supposed to be shown
    if (!show) {
        return null;
    }

    return (
        <div className={styles.parent} onClick={closeDrawer}>
            <Image 
                src={closeBtn} 
                width={30} 
                height={30} 
                alt="Close drawer" 
                className={`${styles.closeBtn} ${isSliding ? styles.closeBtnSlide : ""}`} 
            />
            <div className={`${styles.ctn} ${isSliding ? styles.ctnSlide : ""}`} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.drawerTitle}>Change Your Meal</h3>
                {meals && meals.length > 0 ? meals.map((currMeal) => (
                    <div className={styles.row} key={currMeal.menu_id} onClick={(e) => handleSelectMeal(e, currMeal.menu_id)}>
                        <div className={styles.rowBody}>
                            <p className={styles.mealName}>{currMeal.name}</p>
                            <p className={styles.mealCaption}>{currMeal.content}</p>
                            <div className={styles.mealPriceBody}>
                                Starts @ <span className={styles.mealPrice}>₹{currMeal.monthlyPrice}/-</span> per meal
                            </div>
                        </div>

                        <div className={styles.mealImgDiv}>
                            {/* 2. Use the Next.js Image component with correct props */}
                            <Image 
                                src={currMeal.imagePath} 
                                className={styles.mealImg} 
                                alt={currMeal.name} // 3. Add a dynamic, descriptive alt prop
                                width={120} 
                                height={120}
                            />
                            <button className={styles.addBtn}>SELECT</button>
                        </div>
                    </div>
                )) : (
                    <p className={styles.noMealsText}>No other meals available.</p>
                )}
            </div>
        </div>
    );
}