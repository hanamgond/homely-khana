'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import styles from "./HomePage.module.css"; // Make sure this path is correct

import Offering from "@/components/offering"; // Check path if needed
import Footer from "@/components/footer"; // Check path if needed

// Static data for Testimonials and FAQs
const testimonials = [
    { name: 'Priya Sharma', role: 'Software Engineer', initials: 'PS', review: '"HomelyKhana has been a lifesaver! The food tastes just like my mom\'s cooking. The freshness and quality are unmatched. I\'ve been subscribing for 6 months now and couldn\'t be happier!"' },
    { name: 'Rahul Verma', role: 'Marketing Manager', initials: 'RV', review: '"As someone who works long hours, having healthy homemade meals delivered daily has changed my life. The variety is great and the delivery is always on time. Highly recommend!"' },
    { name: 'Anjali Patel', role: 'Teacher', initials: 'AP', review: '"I was skeptical at first, but the trial convinced me. The meals are delicious, portions are perfect, and it\'s so convenient. My family loves the food too!"' },
    { name: 'Amit Kumar', role: 'Entrepreneur', initials: 'AK', review: '"Great service with authentic taste. The subscription flexibility is excellent. I can pause or modify my plan anytime. The customer service is also very responsive."' },
];
const faqsData = [
    { q: 'What is HomelyKhana?', a: 'HomelyKhana is a subscription-based meal delivery service that provides fresh, healthy, and delicious home-cooked meals right to your doorstep.' },
    { q: 'How do I subscribe to a meal plan?', a: 'You can subscribe by clicking on the "Start Your Subscription" button, choosing your meal type, plan, and delivery frequency, and then proceeding to checkout.' },
    { q: 'What meal plans do you offer?', a: 'We offer Monthly, Weekly, and Trial plans. You can customize the delivery frequency to match your schedule.' },
    { q: 'Can I customize my meals?', a: 'While full customization isn\'t available yet, you can choose between our different meal types like Homely Meal and Healthy Meal to best suit your preferences.' },
    { q: 'Do you cater to specific dietary restrictions?', a: 'Please contact our customer support to discuss any specific dietary needs. We do our best to accommodate requests where possible.' }
];

// Reusable FAQ Item Component
const FaqItem = ({ faq, index, toggleFAQ, isOpen }) => (
    <div className={styles.faqItem}>
        {/* Added aria-expanded for accessibility and potential CSS targeting */}
        <button
            className={styles.faqQuestion}
            onClick={() => toggleFAQ(index)}
            aria-expanded={isOpen}
        >
            {faq.q}
            {/* Using a span for the icon */}
            <span>{isOpen ? '−' : '+'}</span>
        </button>
        <div className={`${styles.faqAnswer} ${isOpen ? styles.open : ''}`}>
             {/* Use dangerouslySetInnerHTML if 'a' contains HTML, otherwise just {faq.a} */}
             {faq.a}
        </div>
    </div>
);


export default function HomePageClient() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const toggleFAQ = index => { setOpenFAQ(openFAQ === index ? null : index); };

  // State for fetching offerings from the API
  const [offerings, setOfferings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch offerings on component mount
  useEffect(() => {
    console.log("HomePage useEffect is running. Starting fetch..."); // Keep for debugging if needed

    const fetchOfferings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/products?type=Meals`);
        if (!response.ok) { // Check if response status is OK (200-299)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        console.log("API Response Data:", data); // Keep for debugging if needed

        if (data.success && Array.isArray(data.data)) { // Ensure data.data is an array
          setOfferings(data.data);
        } else {
          // If success is false or data is not an array, treat as error
          throw new Error(data.error || 'Invalid data structure received.');
        }
      } catch (err) {
        // Handle fetch errors (network issues) and JSON parsing errors
        setError(err instanceof Error ? err.message : String(err));
        console.error("Error fetching offerings:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfferings();
  }, []); // Empty dependency array means this runs once on mount

  // Helper function to get the display price for the offering card
  const getDisplayPrice = (product) => {
    // If it's a one-time product, use its base price
    if (product.booking_type === 'one-time' && product.base_price) {
      // Ensure base_price is treated as a number
      return parseFloat(product.base_price);
    }
    // If it's a subscription product with plans, use the price of the first plan
    if ((product.booking_type === 'subscription' || product.booking_type === 'both') && product.plans && product.plans.length > 0 && product.plans[0].price) {
      // Ensure plan price is treated as a number
       return parseFloat(product.plans[0].price);
    }
    // Fallback if price cannot be determined
    return null; // Return null or 'N/A' if you prefer
  };

  return (
    <>
      <main>
        {/* --- Hero Section --- */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1>Order Healthy & <span className={styles.accent}>Homely Food</span></h1>
            <p>Fresh, home-cooked meals delivered to your doorstep. Subscribe now and never worry about meal planning again.</p>
            <div className={styles.ctaGroup}>
              <Link href="/subscribe" className={`${styles.ctaButton} ${styles.primary}`}>Start Your Subscription →</Link>
              <Link href="/subscribe" className={`${styles.ctaButton} ${styles.secondary}`}>Try 3-Day Trial</Link>
            </div>
          </div>
        </section>

        {/* --- Why HomelyKhana Section --- */}
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Why HomelyKhana?</h2>
                <p>Experience the warmth of home-cooked meals with the convenience of doorstep delivery</p>
            </div>
            <div className={styles.whyUsGrid}>
                <div className={styles.whyUsImages}>
                    {/* Ensure images exist in public folder */}
                    <div><Image src="/why-us-1.jpg" alt="Woman cooking" width={500} height={400} style={{ objectFit: 'cover', borderRadius: '12px', width: '100%', height: 'auto' }} priority /></div>
                    <div><Image src="/why-us-2.jpg" alt="Chopping vegetables" width={500} height={300} style={{ objectFit: 'cover', borderRadius: '12px', width: '100%', height: 'auto' }} /></div>
                </div>
                 {/* --- CORRECTED whyUsList Structure --- */}
                <div className={styles.whyUsList}>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🧡</div>
                        <div><h3>Authentic Home-Style Cooking</h3><p>Every meal is prepared with love, just like your mom would make it at home</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🌿</div>
                        <div><h3>Farm-Fresh Ingredients</h3><p>We source the freshest vegetables and ingredients daily from local farms</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>✅</div>
                        <div><h3>100% Natural & Safe</h3><p>Absolutely no preservatives, artificial colors, or harmful additives</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🕒</div>
                        <div><h3>On-Time Hot Delivery</h3><p>Piping hot meals delivered punctually to your doorstep every day</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🛡️</div> {/* Ensure this emoji renders correctly or use an SVG */}
                        <div><h3>Hygienic Preparation</h3><p>Prepared in FSSAI-certified kitchens with strict hygiene protocols</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🧑‍🤝‍🧑</div> {/* Ensure this emoji renders correctly or use an SVG */}
                        <div><h3>Trusted by Thousands</h3><p>Join 10,000+ happy customers enjoying healthy meals daily</p></div>
                    </div>
                </div>
                 {/* --- END CORRECTED whyUsList Structure --- */}
            </div>
        </section>

        {/* --- Meal Offerings Section --- */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Our Meal Offerings</h2>
            <p>Choose from our carefully crafted meal options, prepared fresh daily with love and care</p>
          </div>
          <div className={styles.offeringsGrid}>

            {/* Loading State */}
            {isLoading && <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Loading our delicious meals...</p>}

            {/* Error State */}
            {error && <p style={{ color: 'red', gridColumn: '1 / -1', textAlign: 'center' }}>Error loading meals: {error}</p>}

            {/* Success State - Mapping Offerings */}
            {!isLoading && !error && offerings.map((product) => {
              const displayPrice = getDisplayPrice(product);
              return (
                <Offering
                  key={product.id}
                  name={product.name}
                  value={4.8} // Placeholder - Ideally fetch from reviews aggregate later
                  reviews={0} // Placeholder - Ideally fetch from reviews aggregate later
                  caption={product.description}
                  // Pass price only if available
                  monthlyPrice={displayPrice !== null ? displayPrice : undefined}
                  imgSrc={product.image_url || '/meal-placeholder.jpg'} // Provide a default placeholder
                  // Placeholder items - Ideally fetch from product details later
                  items={['Fresh Ingredients', 'Healthy & Homely']}
                  popular={false} // Placeholder - Add logic later if needed
                />
              );
            })}

             {/* Empty State */}
             {!isLoading && !error && offerings.length === 0 && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No offerings found.</p>
             )}

          </div>
        </section>

        {/* --- Testimonials Section --- */}
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>What Our Customers Say</h2>
                <p>Join thousands of happy customers who trust HomelyKhana for their daily meals</p>
            </div>
            <div className={styles.testimonialsGrid}>
                {testimonials.map((t, index) => ( // Added index for key fallback, though name should be unique
                    <div key={t.name || index} className={styles.testimonialCard}>
                        <div className={styles.testimonialHeader}>
                            {/* Simple Avatar */}
                            <div className={styles.testimonialAvatar}>{t.initials}</div>
                            <div><h3>{t.name}</h3><p className={styles.role}>{t.role}</p></div>
                        </div>
                        <div className={styles.testimonialStars}>★★★★★</div>
                        <p>{t.review}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className={styles.section}>
             <div className={styles.sectionHeader}>
                <h2>Frequently Asked Questions</h2>
                <p>Everything you need to know about our service</p>
            </div>
            <div className={styles.faqContainer}>
                {faqsData.map((faq, i) => (
                    <FaqItem key={i} faq={faq} index={i} toggleFAQ={toggleFAQ} isOpen={i === openFAQ} />
                ))}
            </div>
        </section>
      </main>

      {/* --- Footer Component --- */}
      <Footer />
    </>
  );
}