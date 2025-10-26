'use client';

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import styles from "./HomePage.module.css"; 
import Offering from "@/components/offering"; 
import Footer from "@/components/footer"; 
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";

// Static data for Testimonials and FAQs (Complete and Unchanged)
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

// Reusable FAQ Item Component (Unchanged)
const FaqItem = ({ faq, index, toggleFAQ, isOpen }) => (
    <div className={styles.faqItem}>
        <button
            className={styles.faqQuestion}
            onClick={() => toggleFAQ(index)}
            aria-expanded={isOpen}
        >
            {faq.q}
            <span>{isOpen ? '−' : '+'}</span>
        </button>
        <div className={`${styles.faqAnswer} ${isOpen ? styles.open : ''}`}>
             {faq.a}
        </div>
    </div>
);


export default function HomePageClient() {
  // Local UI state for FAQs (Unchanged)
  const [openFAQ, setOpenFAQ] = useState(null);
  const toggleFAQ = index => { setOpenFAQ(openFAQ === index ? null : index); };

  // --- REFACTORED DATA FETCHING ---
  // The old useState/useEffect block for offerings, isLoading, and error is REMOVED.
  // It's replaced by this single useQuery hook:
  const {
    data: offerings = [], // Default to empty array
    isLoading,
    isError,
    error
  } = useQuery({
      queryKey: ['products', 'Meals'], // A unique key to cache this query
      queryFn: () => fetchProducts('Meals') // The function that fetches the data
  });
  // --- END OF REFACTOR ---


  // Helper function to get the display price (Unchanged)
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
        {/* --- Hero Section (Unchanged) --- */}
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

        {/* --- Why HomelyKhana Section (Unchanged) --- */}
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>Why HomelyKhana?</h2>
                <p>Experience the warmth of home-cooked meals with the convenience of doorstep delivery</p>
            </div>
            <div className={styles.whyUsGrid}>
                <div className={styles.whyUsImages}>
                    <div><Image src="/why-us-1.jpg" alt="Woman cooking" width={500} height={400} style={{ objectFit: 'cover', borderRadius: '12px', width: '100%', height: 'auto' }} priority /></div>
                    <div><Image src="/why-us-2.jpg" alt="Chopping vegetables" width={500} height={300} style={{ objectFit: 'cover', borderRadius: '12px', width: '100%', height: 'auto' }} /></div>
                </div>
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
                        <div className={styles.whyUsIcon}>🛡️</div> 
                        <div><h3>Hygienic Preparation</h3><p>Prepared in FSSAI-certified kitchens with strict hygiene protocols</p></div>
                    </div>
                    <div className={styles.whyUsItem}>
                        <div className={styles.whyUsIcon}>🧑‍🤝‍🧑</div> 
                        <div><h3>Trusted by Thousands</h3><p>Join 10,000+ happy customers enjoying healthy meals daily</p></div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- Meal Offerings Section (Render logic updated to useQuery variables) --- */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Our Meal Offerings</h2>
            <p>Choose from our carefully crafted meal options, prepared fresh daily with love and care</p>
          </div>
          <div className={styles.offeringsGrid}>

            {/* Loading State */}
            {isLoading && <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Loading our delicious meals...</p>}

            {/* Error State */}
            {isError && <p style={{ color: 'red', gridColumn: '1 / -1', textAlign: 'center' }}>Error loading meals: {error.message}</p>}

            {/* Success State - Mapping Offerings */}
            {!isLoading && !isError && offerings.map((product) => {
              const displayPrice = getDisplayPrice(product);
              return (
                <Offering
                  key={product.id}
                  name={product.name}
                  value={4.8} // Placeholder
                  reviews={0} // Placeholder
                  caption={product.description}
                  monthlyPrice={displayPrice !== null ? displayPrice : undefined}
                  imgSrc={product.image_url || '/meal-placeholder.jpg'} // Provide a default placeholder
                  items={['Fresh Ingredients', 'Healthy & Homely']} // Placeholder
                  popular={false} // Placeholder
                />
              );
            })}

             {/* Empty State */}
             {!isLoading && !isError && offerings.length === 0 && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No offerings found.</p>
             )}

          </div>
        </section>

        {/* --- Testimonials Section (Unchanged) --- */}
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>What Our Customers Say</h2>
                <p>Join thousands of happy customers who trust HomelyKhana for their daily meals</p>
            </div>
            <div className={styles.testimonialsGrid}>
                {testimonials.map((t, index) => ( 
                    <div key={t.name || index} className={styles.testimonialCard}>
                        <div className={styles.testimonialHeader}>
                            <div className={styles.testimonialAvatar}>{t.initials}</div>
                            <div><h3>{t.name}</h3><p className={styles.role}>{t.role}</p></div>
                        </div>
                        <div className={styles.testimonialStars}>★★★★★</div>
                        <p>{t.review}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* --- FAQ Section (Unchanged) --- */}
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

      {/* --- Footer Component (Unchanged) --- */}
      <Footer />
    </>
  );
}