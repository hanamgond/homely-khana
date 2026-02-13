// src/app/admin/page.js
'use client'; // Essential for pages using hooks (useState, useRef)

import Image from "next/image";
import Link from "next/link";
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';

// --- CORRECTED PATHS ---
import styles from "@/styles/Admin.module.css";
import searchIcon from "@/assets/search.svg";

export default function AdminClient() {
    const orders = Array.from({ length: 30 }, (_, i) => i + 1);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const popupRef = useRef(null);

    const handleCheckboxClick = (event, orderId) => {
        const rect = event.target.getBoundingClientRect();
        setPopupPosition({ top: rect.top + window.scrollY + 25, left: rect.left + window.scrollX + 20 });
        setSelectedOrder(orderId);
        const isChecked = event.target.checked;
        setShowPopup(isChecked);
    };

    const handleConfirm = () => {
        toast.success("Order moved successfully");
        setShowPopup(false);
    };

    const handleCancel = () => {
        setShowPopup(false);
    };

    return (
        <div className={styles.main}>
            <aside className={styles.mainLeft}>
                <div>
                    <Link className={styles.companyName} href={"/"}>HomelyKhana</Link>
                    <p className={styles.userName}>Welcome, Admin</p>

                    <nav className={styles.sidebarBtnCtn}>
                        <Link href="/admin" className={`${styles.sideBarLink} ${styles.active}`}>Home</Link>
                        <Link href="/admin/pickup" className={styles.sideBarLink}>Pick Up</Link>
                        <Link href="#" className={styles.sideBarLink}>Delivery</Link>
                        <Link href="#" className={styles.sideBarLink}>Delivered</Link>
                        <Link href="#" className={styles.sideBarLink}>Cancelled</Link>
                    </nav>
                </div>

                <button className={styles.sideBarLogoutBtn}>Log Out</button>
            </aside>

            <main className={styles.mainRight}>
                <div className={styles.filterMain}>
                    <div className={styles.filterInputCtn}>
                        <Image src={searchIcon} alt="Search" className={styles.filterInputImg} />
                        <label htmlFor="orderId" className={styles.filterInputLabel}>Order ID</label>
                        <input type="text" name="orderId" className={styles.filterInput} />
                    </div>

                    <div className={styles.filterInputCtn}>
                        <Image src={searchIcon} alt="Search" className={styles.filterInputImg} />
                        <label htmlFor="custId" className={styles.filterInputLabel}>Customer ID</label>
                        <input type="text" name="custId" className={styles.filterInput} />
                    </div>

                    <div className={styles.filterInputCtn}>
                        <Image src={searchIcon} alt="Search" className={styles.filterInputImg} />
                        <label htmlFor="custNum" className={styles.filterInputLabel}>Customer Number</label>
                        <input type="text" name="custNum" className={styles.filterInput} />
                    </div>

                    <select className={styles.filterDropDown}>
                        <option>Select Meal Type</option>
                        <option>Meal Type 1</option>
                        <option>Meal Type 2</option>
                    </select>

                    <select className={styles.filterDropDown}>
                        <option>Select Order Type</option>
                        <option>Order Type 1</option>
                        <option>Order Type 2</option>
                    </select>
                </div>

                <div className={styles.tableMain}>
                    <div className={styles.rowheader}>
                        <div className={styles.rowOrderId}>Order ID</div>
                        <div className={styles.rowCustName}>Customer Name</div>
                        <div className={styles.rowCustNum}>Customer Number</div>
                        <div className={styles.rowMealType}>Meal Type</div>
                        <div className={styles.rowDelivery}>Delivery Address</div>
                        <div className={styles.rowReady}>Ready</div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.rowOrderId}>123456789</div>
                        <div className={styles.rowCustName}>Nikhil Soni</div>
                        <div className={styles.rowCustNum}>9876543210</div>
                        <div className={styles.rowMealType}>Lunch</div>
                        <div className={styles.rowDelivery}>Koramangala, Bangalore</div>
                        <div className={styles.rowReady}><input type="checkbox" onClick={(event) => handleCheckboxClick(event, -1)}/></div>
                    </div>

                    {orders.map((order) => (
                        <div className={styles.row} key={order}>
                            <div className={styles.rowOrderId}>Order ID {order}</div>
                            <div className={styles.rowCustName}>Customer Name</div>
                            <div className={styles.rowCustNum}>Customer Number</div>
                            <div className={styles.rowMealType}>Meal Type</div>
                            <div className={styles.rowDelivery}>Delivery Address</div>
                            <div className={styles.rowReady}><input type="checkbox" onClick={(event) => handleCheckboxClick(event, order)} /></div>
                        </div>
                    ))}

                    {showPopup && (
                        <div ref={popupRef} className={styles.popup} style={{ top: popupPosition.top, left: popupPosition.left }}>
                            <p>Confirm Order {selectedOrder} as ready?</p>
                            <div className={styles.popupBtnCtn}>
                                <button onClick={handleConfirm} className={styles.confirmBtn}>Yes</button>
                                <button onClick={handleCancel} className={styles.confirmBtn}>No</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
