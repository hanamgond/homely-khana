'use client'; // Required for hooks like useRouter

import Image from "next/image";
import Link from "next/link";
import React, { useContext } from 'react'; // Added useContext
import { useRouter } from "next/navigation";

//components
import DashboardSideBar from "@/components/dashboardsideBar";

//styles
import styles from "./DashboardSubscriptions.module.css"; // CORRECTED PATH

//utils
import { AppContext } from "@/utils/AppContext"; // Import AppContext

export default function SubscriptionsClient() { // Renamed component
    const router = useRouter();
    const { logout } = useContext(AppContext); // Get logout from context

    const handleLogout = () => {
        logout(); // Use the logout function from context
        router.push("/");
    };

    return (
        <div className={styles.main}>
            <DashboardSideBar />

            <div className={styles.mainRight}>
                <div className={styles.rightParent}>
                    <p className={styles.rightTitle}>Lunch</p>
                    <div className={styles.rightChipCtn}>
                        {/* --- Example Active Subscription --- */}
                        <div className={styles.rightChip}>
                            <div className={styles.rightChipFlexCtn}>
                                <p className={styles.chipMealName}>Paneer Meal</p>
                                <p className={styles.chipActiveLabel}>Active</p>
                            </div>
                            <div className={styles.rightChipFlexCtn}>
                                <div>
                                    <div className={styles.chipCaption}><span>Quantity</span><span>:</span><span>1</span></div>
                                    <div className={styles.chipCaption}><span>Plan Type</span><span>:</span><span>Monthly</span></div>
                                    <div className={styles.chipCaption}><span>Start Date</span><span>:</span><span>21/02/2025</span></div>
                                    <div className={styles.chipCaption}><span>End Date</span><span>:</span><span>21/03/2025</span></div>
                                </div>
                                <Image src="/healthyMeal.jpeg" alt="Healthy Meal" height={100} width={100} className={styles.mealImg} />
                            </div>
                            <div>
                                <p>Delivery Days</p>
                                <p className={styles.chipCaption}>Mon, Tue, Wed, Thu, Sat, Sun</p>
                            </div>
                            <div className={styles.chipMealNum}>Number of meals remaining: 30</div>
                            <div>
                                <p>Delivery Information</p>
                                <p className={styles.chipAdd}>GN Residency, Palava, Lodha, 560095</p>
                                <p className={styles.chipCaption}>Sid, 7567567567</p>
                            </div>
                            <button className={styles.rateBtn}>
                                Rate Meal 
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                    <path d="M4 12h14m-5-5l5 5-5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        {/* --- Example Expired Subscription --- */}
                        <div className={styles.rightChip}>
                            <div className={styles.rightChipFlexCtn}>
                                <p className={styles.chipMealName}>Homely Meal</p>
                                <p className={styles.chipExpiredLabel}>Expired</p>
                            </div>
                            <div className={styles.rightChipFlexCtn}>
                                <div>
                                    <div className={styles.chipCaption}><span>Quantity</span><span>:</span><span>1</span></div>
                                    <div className={styles.chipCaption}><span>Plan Type</span><span>:</span><span>Weekly</span></div>
                                    <div className={styles.chipCaption}><span>Start Date</span><span>:</span><span>14/01/2025</span></div>
                                    <div className={styles.chipCaption}><span>End Date</span><span>:</span><span>21/01/2025</span></div>
                                </div>
                                <Image src="/meal1.jpg" alt="Homely Meal" height={100} width={100} className={styles.mealImg} />
                            </div>
                            <button className={styles.rateBtn}>Rate Meal</button>
                        </div>
                    </div>
                </div>

                <div className={styles.rightParent}>
                    <p className={styles.rightTitle}>Dinner</p>
                    <div className={styles.rightChipCtn}>
                        <p>No active dinner subscriptions.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
