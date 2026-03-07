//frontend/src/modules/marketing/components/WhyUs/index.js
'use client';

import Image from "next/image";
import styles from "./WhyUs.module.css";

export default function WhyUs() {
    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Why HomelyKhana?</h2>
                <p>Experience the warmth of home-cooked meals with the convenience of doorstep delivery</p>
            </div>

            <div className={styles.featureContainer}>
                {/* GROUP 1: Home & Health */}
                <div className={styles.featureGroup}>
                    <div className={styles.groupImage}>
                        <Image src="/why-us-1.jpg" alt="Home Style Cooking" width={600} height={450} priority />
                    </div>
                    <div className={styles.groupList}>
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>🧡</div>
                            <div>
                                <h3>Authentic Home-Style Cooking</h3>
                                <p>Every meal is prepared with love, just like your mom would make it at home</p>
                            </div>
                        </div>
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>✅</div>
                            <div>
                                <h3>100% Natural & Safe</h3>
                                <p>Absolutely no preservatives, artificial colors, or harmful additives</p>
                            </div>
                        </div>
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>🛡️</div>
                            <div>
                                <h3>Hygienic Preparation</h3>
                                <p>Prepared in FSSAI-certified kitchens with strict hygiene protocols</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* GROUP 2: Quality & Service (Reversed on Desktop) */}
                <div className={`${styles.featureGroup} ${styles.reverse}`}>
                    <div className={styles.groupImage}>
                        <Image src="/why-us-2.jpg" alt="Fresh Ingredients" width={600} height={450} />
                    </div>
                    <div className={styles.groupList}>
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>🌿</div>
                            <div>
                                <h3>Farm-Fresh Ingredients</h3>
                                <p>We source the freshest vegetables and ingredients daily from local farms</p>
                            </div>
                        </div>
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>🕒</div>
                            <div>
                                <h3>On-Time Hot Delivery</h3>
                                <p>Piping hot meals delivered punctually to your doorstep every day</p>
                            </div>
                        </div>
                        {/* RESTORED: Third reason for Group 2 */}
                        <div className={styles.groupItem}>
                            <div className={styles.itemIcon}>🧑‍🤝‍🧑</div>
                            <div>
                                <h3>Trusted by Thousands</h3>
                                <p>Join 10,000+ happy customers enjoying healthy meals daily</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}