'use client';

import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css";

// Modular Imports
import Hero from '../Hero';
import WhyUs from '../WhyUs';
import OfferingSection from '../Offering';
import Testimonials from '../Testimonials';
import FAQs from '../FAQs';

export default function HomePageClient() {
  const [offerings, setOfferings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/products?type=Meals`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setOfferings(data.data);
        } else {
          throw new Error(data.error || 'Invalid data structure received.');
        }
      } catch (err) {
        // FIXED syntax error on line 30
        setError(err instanceof Error ? err.message : String(err)); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  return (
    <main className={styles.pageContainer}>
      <Hero />

      {/* --- INEFFECTIVE: Original Why Us (Preserved for reference) ---
      <section className={styles.section}>
          <div className={styles.sectionHeader}>
              <h2>Why HomelyKhana?</h2>
              <p>Experience the warmth of home-cooked meals with the convenience of doorstep delivery</p>
          </div>
          ... (rest of the original Z-pattern layout)
      </section>
      */}
      <WhyUs />

      {/* --- INEFFECTIVE: Original Offerings Grid (Preserved for reference) ---
      <section className={styles.section}>
          ...
      </section>
      */}
      <OfferingSection offerings={offerings} isLoading={isLoading} error={error} />

      {/* --- INEFFECTIVE: Original Testimonials (Preserved for reference) ---
      <section className={styles.section}>
          ...
      </section>
      */}
      <Testimonials />

      {/* --- INEFFECTIVE: Original FAQ Section (Preserved for reference) ---
      <section className={styles.section}>
          ...
      </section>
      */}
      <FAQs />
    </main>
  );
}