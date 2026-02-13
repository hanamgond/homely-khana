//frontend/src/components/header/index.js
'use client';

import React, { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppContext } from '@/utils/AppContext';
import { 
    Menu, X, ShoppingCart, User, ChevronDown, MapPin, 
    Utensils, ShoppingBag, Building, ShieldCheck, Phone, BookOpen 
} from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
    const { user, logout } = useContext(AppContext);
    const pathname = usePathname();

    // State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isMealDropdownOpen, setIsMealDropdownOpen] = useState(false);
    
    // Location State
    const [isLocationOpen, setIsLocationOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState("Navi Mumbai");
    const cities = ["Navi Mumbai", "Mumbai", "Pune", "Bangalore", "Hyderabad"];

    // Close menus when route changes
    useEffect(() => {
        setIsDrawerOpen(false);
        setIsMealDropdownOpen(false);
        setIsLocationOpen(false);
    }, [pathname]);

    // Prevent body scroll when drawer is open
    useEffect(() => {
        if (isDrawerOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
    }, [isDrawerOpen]);

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setIsLocationOpen(false);
    };

    return (
        <>
            <header className={styles.header}>
                <div className={styles.container}>
                    
                    {/* LEFT: Burger & Logo */}
                    <div className={styles.leftSection}>
                        <button className={styles.burgerBtn} onClick={() => setIsDrawerOpen(true)}>
                            <Menu size={26} color="#374151" />
                        </button>
                        <Link href="/" className={styles.logo}>
                            Homely<span className={styles.accent}>Khana</span>
                        </Link>
                    </div>

                    {/* CENTER: Desktop Navigation */}
                    <nav className={styles.desktopNav}>
                        <div 
                            className={styles.navItem} 
                            onMouseEnter={() => setIsMealDropdownOpen(true)}
                            onMouseLeave={() => setIsMealDropdownOpen(false)}
                        >
                            {/* CHANGE 1: Renamed 'Meal Plans' to 'Subscriptions' */}
                            <Link href="/subscribe" className={styles.navLink}>
                                Subscriptions <ChevronDown size={14} />
                            </Link>
                            {isMealDropdownOpen && (
                                <div className={styles.dropdownMenu}>
                                    <Link href="/subscribe?plan=trial" className={styles.dropdownLink}>3-Day Trial Pack</Link>
                                    <Link href="/subscribe?plan=monthly" className={styles.dropdownLink}>Monthly Subscription</Link>
                                </div>
                            )}
                        </div>

                        <Link href="/menu" className={styles.navLink}>Weekly Menu</Link>
                        
                        {/* CHANGE 2: Added 'Our Story' Link */}
                        <Link href="/about" className={styles.navLink}>Our Story</Link>
                        
                        <Link href="/pantry" className={styles.navLink}>
                            The Pantry <span className={styles.newBadge}>NEW</span>
                        </Link>
                        
                        <Link href="/corporate" className={styles.navLink}>Corporate</Link>
                    </nav>

                    {/* RIGHT: Utilities */}
                    <div className={styles.rightSection}>
                        
                        {/* Location Dropdown */}
                        <div 
                            className={styles.locationWrapper}
                            onClick={() => setIsLocationOpen(!isLocationOpen)}
                            onMouseLeave={() => setIsLocationOpen(false)}
                        >
                            <div className={styles.locationBadge}>
                                <MapPin size={16} color="#FF9801" />
                                <span>{selectedCity}</span>
                                <ChevronDown size={14} color="#d97706" />
                            </div>

                            {isLocationOpen && (
                                <div className={styles.locationDropdown}>
                                    {cities.map((city) => (
                                        <div 
                                            key={city} 
                                            className={`${styles.cityItem} ${selectedCity === city ? styles.activeCity : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation(); 
                                                handleCitySelect(city);
                                            }}
                                        >
                                            {city}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link href="/cart" className={styles.iconBtn}>
                            <ShoppingCart size={22} color="#374151" />
                        </Link>

                        {user ? (
                            <Link href="/dashboard" className={styles.profileBtn}>
                                <div className={styles.avatar}>{user.name[0]}</div>
                                <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                            </Link>
                        ) : (
                            <Link href="/login" className={styles.loginBtn}>
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* --- MOBILE DRAWER --- */}
            <div className={`${styles.overlay} ${isDrawerOpen ? styles.showOverlay : ''}`} onClick={() => setIsDrawerOpen(false)} />

            <div className={`${styles.drawer} ${isDrawerOpen ? styles.openDrawer : ''}`}>
                <div className={styles.drawerHeader}>
                    {user ? (
                        <Link href="/dashboard" className={styles.drawerProfile}>
                            <div className={styles.avatarLarge}>{user.name[0]}</div>
                            <div>
                                <p className={styles.welcomeText}>Hello, {user.name.split(' ')[0]}</p>
                                <p className={styles.viewProfile}>Go to Dashboard</p>
                            </div>
                        </Link>
                    ) : (
                        <div className={styles.authBox}>
                            <p className={styles.authTitle}>Welcome to HomelyKhana!</p>
                            <Link href="/login" className={styles.drawerLoginBtn}>Login / Sign Up</Link>
                        </div>
                    )}
                    <button className={styles.closeBtn} onClick={() => setIsDrawerOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.drawerScrollable}>
                    <div className={styles.drawerSection}>
                        <h4 className={styles.sectionTitle}>Eat Daily</h4>
                        {/* Updated Mobile Label as well */}
                        <Link href="/subscribe" className={styles.drawerItem}>
                            <Utensils size={18} className={styles.itemIcon} />
                            Subscriptions
                        </Link>
                        <Link href="/menu" className={styles.drawerItem}>
                            <span style={{fontSize:'1.1rem'}}>📅</span>
                            Weekly Menu
                        </Link>
                         {/* Added Mobile Link for Our Story */}
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
                            <span className={styles.comingSoon}>Coming Soon</span>
                        </Link>
                    </div>

                    <div className={styles.drawerSection}>
                        <h4 className={styles.sectionTitle}>Partner with Us</h4>
                        <Link href="/corporate" className={styles.drawerItem}>
                            <Building size={18} className={styles.itemIcon} />
                            Corporate Catering
                        </Link>
                    </div>

                    <div className={styles.drawerSection}>
                        <h4 className={styles.sectionTitle}>Support</h4>
                        <Link href="/contact" className={styles.drawerItem}>
                            <Phone size={18} className={styles.itemIcon} />
                            Contact Support
                        </Link>
                    </div>

                    {user && (
                        <button onClick={() => { logout(); setIsDrawerOpen(false); }} className={styles.logoutBtn}>
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}