'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// --- CORRECTED PATHS using the '@/' alias ---
import styles from "./AddExistingDrawer.module.css";
import mapPin from "@/assets/mapPin.png";
import homePin from "@/assets/homePin.png";
import hotelPin from "@/assets/hotelPin.png";
import workPin from "@/assets/workPin.png";
import closeBtn from "@/assets/closeBtn.svg";

// A simple loading spinner component
const Spinner = () => <div className={styles.spinner}></div>;

export default function AddExistingDrawer({ showDiv, setShowDiv, addresses, setAddresses, onSelectAddress, setShowAddNewDiv }) {

    const [isSlide, setIsSlide] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FIX 1: useCallback for stable function reference ---
    const fetchAddresses = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            // In a real app, you'd use your authenticated fetch utility here
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/addresses/all`);
            if (!response.ok) {
                throw new Error('Failed to fetch addresses. Please try again.');
            }
            const res = await response.json();
            if (setAddresses) {
                setAddresses(res.data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [setAddresses]); // Dependency on setAddresses prop

    // Slide animation and data fetching effect
    useEffect(() => {
        if (showDiv) {
            setTimeout(() => setIsSlide(true), 25);
            fetchAddresses(); // Fetch addresses when drawer opens
        }
    }, [showDiv, fetchAddresses]); // --- FIX 1 (cont.): Safely add fetchAddresses here ---

    // Hide drawer function
    const hideDrawer = () => {
        setIsSlide(false);
        setTimeout(() => {
            if (setShowDiv) {
                setShowDiv(false);
            }
        }, 300);
    };

    // --- Helper functions remain the same ---
    const getAddressIcon = (type) => { /* ... */ };
    const getAddressText = (type) => { /* ... */ };

    // Function to handle address selection
    const handleSelectAddress = (address) => {
        if (onSelectAddress) {
            onSelectAddress(address);
        }
        hideDrawer(); // Close drawer after selecting address
    };

    const handleAddNew = () => {
        hideDrawer();
        if (setShowAddNewDiv) {
            setShowAddNewDiv(true);
        }
    };
    
    if (!showDiv) {
        return null;
    }

    return (
        <div className={styles.parentCtn} onClick={hideDrawer}>
            <div className={`${styles.ctn} ${isSlide ? styles.ctnSlide : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <p className={styles.title}>Select Delivery Address</p>
                    <button onClick={hideDrawer} className={styles.closeBtn}>
                        <Image src={closeBtn} width={25} height={25} alt="Close" />
                    </button>
                </div>

                <div className={styles.content}>
                    <button className={styles.addAddressBtn} onClick={handleAddNew}>
                        + Add a New Address
                    </button>

                    {/* --- Improved Loading and Error States --- */}
                    {loading && <div className={styles.centeredState}><Spinner /></div>}
                    {error && <p className={styles.errorText}>{error}</p>}

                    <div className={styles.chipCtn}>
                        {!loading && addresses.map((address) => (
                            // --- FIX 3: Correctly pass the iterated 'address' object ---
                            <div key={address.id || address.content} className={styles.chip} onClick={() => handleSelectAddress(address)}>
                                {/* --- FIX 2: Added descriptive alt props --- */}
                                <Image src={getAddressIcon(address.address_type)} className={styles.chipImg} alt={`${getAddressText(address.address_type)} icon`} width={40} height={40} />
                                <div>
                                    <p className={styles.chipTitle}>{getAddressText(address.address_type)}</p>
                                    <p className={styles.chipBody}>{address.content}</p>
                                    <p className={styles.chipCaption}>{address.rec_name}, {address.number}</p>
                                </div>
                            </div>
                        ))}

                        {/* Empty state if no addresses */}
                        {!loading && !error && addresses.length === 0 && <p className={styles.centeredState}>No saved addresses found.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
