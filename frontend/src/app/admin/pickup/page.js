// src/app/admin/pickup/page.js
import Link from "next/link";
import React from 'react';

//styles - using the alias path for consistency
import styles from "@/styles/Admin.module.css";

// This is a Server Component, so we can export metadata directly
export const metadata = {
    title: 'Admin Dashboard - HomelyKhana',
};

export default function AdminPage() {
    return (
        <div className={styles.main}>
            <aside className={styles.mainLeft}>
                <div>
                    <p className={styles.companyName}>HomelyKhana</p>
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
                <h1 className={styles.rightTitle}>Dashboard Overview</h1>
                {/* Add dashboard summary components here */}
            </main>
        </div>
    );
}

