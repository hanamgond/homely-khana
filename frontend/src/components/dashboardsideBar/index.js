'use client';

import React, { useState, useEffect, useContext } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from "next/navigation"; // 1. CORRECTED Router Hooks
import { AppContext } from '@/utils/AppContext'; // 2. Import AppContext

// styles (assuming colocation)
import styles from "./DashboardSideBar.module.css";

// assets (using the '@/' alias)
import hamburger from "@/assets/hamburger.svg";

export default function DashboardSideBar() {
    const [showSidebar, setShowSidebar] = useState(false);
    const [slide, setSlide] = useState(false);

    const router = useRouter();
    const pathname = usePathname(); // 3. Hook to get the current URL path
    const { user, logout } = useContext(AppContext); // 4. Get user and logout from context

    const openSidebar = () => {
        setShowSidebar(true);
        setTimeout(() => { setSlide(true) }, 10);
    };

    const closeSidebar = () => {
        setSlide(false);
        setTimeout(() => { setShowSidebar(false) }, 210);
    };

    const handleLogout = () => {
        if (logout) {
            logout(); // Use the global logout function
        }
        router.push("/");
    };

    // 5. Array of links for easier management
    const navLinks = [
        { href: "/dashboard", text: "Home" },
        { href: "/dashboard/add-ons", text: "Add-Ons" },
        { href: "/dashboard/subscriptions", text: "Subscriptions" },
        { href: "/dashboard/profile", text: "Profile" },
        { href: "/dashboard/contact", text: "Contact Us" },
    ];

    return (
        <>
            {/* --- Desktop Sidebar --- */}
            <aside className={styles.mainDesktop}>
                <div className={styles.ctnDesktop}>
                    <Link className={styles.companyName} href="/">HomelyKhana</Link>
                    {/* 6. Display dynamic user name */}
                    <p className={styles.userName}>Welcome, {user?.name || 'User'}</p>

                    <nav className={styles.btnCtn}>
                        {navLinks.map(link => (
                            // 7. Conditionally apply 'active' class
                            <Link key={link.href} className={`${styles.buttonLink} ${pathname === link.href ? styles.active : ''}`} href={link.href}>
                                {link.text}
                            </Link>
                        ))}
                    </nav>
                </div>
                <button className={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
            </aside>

            {/* --- Mobile Sidebar --- */}
            <div className={styles.mainMobile}>
                <div className={styles.mobileNav}>
                    <button className={styles.burgerButton} onClick={openSidebar}>
                        <Image src={hamburger} alt="Open menu" />
                    </button>
                    <Link className={styles.companyName} href="/">HomelyKhana</Link>
                </div>
                {showSidebar && (
                    <div className={styles.blurCtn} onClick={closeSidebar}>
                        <aside className={`${styles.ctnMobile} ${slide ? styles.ctnMobileSlide : ''}`} onClick={(e) => e.stopPropagation()}>
                            <p className={styles.userNameMobile}>Welcome, {user?.name || 'User'}</p>
                            <nav className={styles.btnCtn}>
                                {navLinks.map(link => (
                                    <Link key={link.href} className={`${styles.mobileBtnLink} ${pathname === link.href ? styles.active : ''}`} href={link.href} onClick={closeSidebar}>
                                        {link.text}
                                    </Link>
                                ))}
                            </nav>
                            <button className={styles.mobileLogoutBtn} onClick={handleLogout}>Log Out</button>
                        </aside>
                    </div>
                )}
            </div>
        </>
    );
}
