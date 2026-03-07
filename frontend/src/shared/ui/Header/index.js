//frontend/src/shared/ui/Header/index.js
'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppContext } from "@/shared/lib/AppContext";
import {
    Menu, X, ShoppingCart, ChevronDown, MapPin,
    Utensils, ShoppingBag, Building, Phone, BookOpen
} from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
    const { user, logout } = useContext(AppContext);
    const pathname = usePathname();
    const isDashboard = pathname.startsWith("/dashboard");

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMealDropdownOpen, setIsMealDropdownOpen] = useState(false);

    const selectedCity = "Bangalore";

    useEffect(() => {
        setIsDrawerOpen(false);
        setIsMealDropdownOpen(false);
    }, [pathname]);

    useEffect(() => {
        document.body.style.overflow = isDrawerOpen ? 'hidden' : 'unset';
    }, [isDrawerOpen]);

    return (
        <>
            {/* HEADER */}
            <header className={styles.header}>
                <div className={styles.container}>

                    {/* LEFT */}
                    <div className={styles.leftSection}>
                        <button
                            className={styles.burgerBtn}
                            onClick={() => setIsDrawerOpen(true)}
                        >
                            <Menu size={26} color="#374151" />
                        </button>

                        <Link href="/" className={styles.logo}>
                            Homely<span className={styles.accent}>Khana</span>
                        </Link>
                    </div>

                    {/* DESKTOP NAV */}
                    <nav className={styles.desktopNav}>
                        <div
                            className={styles.navItem}
                            onMouseEnter={() => setIsMealDropdownOpen(true)}
                            onMouseLeave={() => setIsMealDropdownOpen(false)}
                        >
                            <Link href="/subscribe" className={styles.navLink}>
                                Subscriptions <ChevronDown size={14} />
                            </Link>

                            {isMealDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    <Link href="/subscribe?plan=trial" className={styles.dropdownLink}>
                                        3-Day Trial Pack
                                    </Link>
                                    <Link href="/subscribe?plan=monthly" className={styles.dropdownLink}>
                                        Monthly Subscription
                                    </Link>
                                </div>
                            )}
                        </div>

                        <Link href="/menu" className={styles.navLink}>Weekly Menu</Link>
                        <Link href="/about" className={styles.navLink}>Our Story</Link>
                        <Link href="/pantry" className={styles.navLink}>
                            The Pantry <span className={styles.newBadge}>NEW</span>
                        </Link>
                        <Link href="/corporate" className={styles.navLink}>Corporate</Link>
                    </nav>

                    {/* RIGHT SECTION */}
                    <div className={styles.rightSection}>

                        <div className={styles.locationWrapper}>
                            <div className={styles.locationBadge}>
                                <MapPin size={16} color="#FF9801" />
                                <span className={styles.cityName}>{selectedCity}</span>
                            </div>
                        </div>

                        <Link href="/checkout" className={styles.iconBtn}>
                            <ShoppingCart size={22} color="#374151" />
                        </Link>

                        <div className={styles.desktopUtils}>
                            {user ? (
                                <Link href="/dashboard" className={styles.profileBtn}>
                                    <div className={styles.avatar}>{user.name[0]}</div>
                                    <span className={styles.userName}>
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                            ) : (
                                <Link href="/login" className={styles.loginBtn}>
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* OVERLAY */}
            <div
                className={`${styles.overlay} ${isDrawerOpen ? styles.showOverlay : ''}`}
                onClick={() => setIsDrawerOpen(false)}
            />

            {/* DRAWER */}
            <div className={`${styles.drawer} ${isDrawerOpen ? styles.openDrawer : ''}`}>

                {/* Drawer Header */}
                <div className={styles.drawerHeader}>
                    {user ? (
                        <Link href="/dashboard" className={styles.drawerProfile}>
                            <div className={styles.avatarLarge}>{user.name[0]}</div>
                            <div>
                                <p className={styles.welcomeText}>
                                    Hello, {user.name.split(' ')[0]}
                                </p>
                                <p className={styles.viewProfile}>
                                    Go to Dashboard
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className={styles.authBox}>
                            <p className={styles.authTitle}>
                                Welcome to HomelyKhana!
                            </p>
                            <Link href="/login" className={styles.drawerLoginBtn}>
                                Login / Sign Up
                            </Link>
                        </div>
                    )}

                    <button
                        className={styles.closeBtn}
                        onClick={() => setIsDrawerOpen(false)}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Drawer Scrollable Content */}
                <div className={styles.drawerScrollable}>

                    {isDashboard ? (
                        <>
                            <div className={styles.drawerSection}>
                                <h4 className={styles.sectionTitle}>Dashboard</h4>

                                <Link href="/dashboard" className={styles.drawerItem}>
                                    📊 Dashboard Overview
                                </Link>
                                <Link href="/dashboard/subscription" className={styles.drawerItem}>
                                    📅 My Subscription
                                </Link>
                                <Link href="/dashboard/history" className={styles.drawerItem}>
                                    📋 Order History
                                </Link>
                                <Link href="/dashboard/profile" className={styles.drawerItem}>
                                    👤 Profile Settings
                                </Link>
                                <Link href="/dashboard/contact" className={styles.drawerItem}>
                                    📞 Contact Support
                                </Link>
                            </div>

                            <button
                                onClick={() => { logout(); setIsDrawerOpen(false); }}
                                className={styles.logoutBtn}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <div className={styles.drawerSection}>
                                <h4 className={styles.sectionTitle}>Eat Daily</h4>

                                <Link href="/subscribe" className={styles.drawerItem}>
                                    <Utensils size={18} className={styles.itemIcon} />
                                    Subscriptions
                                </Link>

                                <Link href="/menu" className={styles.drawerItem}>
                                    📅 Weekly Menu
                                </Link>

                                <Link href="/about" className={styles.drawerItem}>
                                    <BookOpen size={18} className={styles.itemIcon} />
                                    Our Story
                                </Link>
                            </div>

                            <div className={styles.drawerSection}>
                                <h4 className={styles.sectionTitle}>The Pantry</h4>

                                <Link href="/pantry" className={styles.drawerItem}>
                                    <ShoppingBag size={18} className={styles.itemIcon} />
                                    Pickles & Podis
                                </Link>
                            </div>

                            <div className={styles.drawerSection}>
                                <h4 className={styles.sectionTitle}>Support</h4>

                                <Link href="/corporate" className={styles.drawerItem}>
                                    <Building size={18} className={styles.itemIcon} />
                                    Corporate
                                </Link>

                                <Link href="/contact" className={styles.drawerItem}>
                                    <Phone size={18} className={styles.itemIcon} />
                                    Contact
                                </Link>
                            </div>

                            {user && (
                                <button
                                    onClick={() => { logout(); setIsDrawerOpen(false); }}
                                    className={styles.logoutBtn}
                                >
                                    Logout
                                </button>
                            )}
                        </>
                    )}

                </div>
            </div>
        </>
    );
}