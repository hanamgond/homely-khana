//frontend/src/modules/marketing/components/Testimonials/index.js
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import styles from './Testimonials.module.css';

const testimonials = [
    { name: 'Priya Sharma', role: 'Software Engineer', initials: 'PS', review: '"HomelyKhana has been a lifesaver! The food tastes just like my mom\'s cooking. The freshness and quality are unmatched. I\'ve been subscribing for 6 months now and couldn\'t be happier!"' },
    { name: 'Rahul Verma', role: 'Marketing Manager', initials: 'RV', review: '"As someone who works long hours, having healthy homemade meals delivered daily has changed my life. The variety is great and the delivery is always on time. Highly recommend!"' },
    { name: 'Anjali Patel', role: 'Teacher', initials: 'AP', review: '"I was skeptical at first, but the trial convinced me. The meals are delicious, portions are perfect, and it\'s so convenient. My family loves the food too!"' },
    { name: 'Amit Kumar', role: 'Entrepreneur', initials: 'AK', review: '"Great service with authentic taste. The subscription flexibility is excellent. I can pause or modify my plan anytime. The customer service is also very responsive."' },
];

export default function TestimonialSection() {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const scrollRef = useRef(null);

    // Synchronizes the active dot with the current scroll position
    const handleScroll = (e) => {
        const width = e.target.offsetWidth;
        const scrollPosition = e.target.scrollLeft;
        const index = Math.round(scrollPosition / width);
        setActiveTestimonial(index);
    };

    // Smoothly scrolls to a specific card when a dot is clicked
    const scrollTo = (index) => {
        if (scrollRef.current) {
            const width = scrollRef.current.offsetWidth;
            scrollRef.current.scrollTo({
                left: width * index,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.sectionHeader}>
                <span className={styles.upperTitle}>What Our Customers Say</span>
                <p>Trusted by families & working professionals across Bangalore</p>
            </div>

            <div className={styles.carouselContainer}>
                <div
                    className={styles.testimonialSlider}
                    ref={scrollRef}
                    onScroll={handleScroll}
                >
                    {testimonials.map((t, index) => (
                        <div key={index} className={styles.testimonialCard}>
                            <div className={styles.quoteIcon}>“</div>
                            <div className={styles.stars}>★★★★★</div>
                            <p className={styles.reviewText}>{t.review}</p>
                            
                            <div className={styles.testimonialFooter}>
                                <div className={styles.testimonialAvatar}>
                                    {t.initials}
                                </div>
                                <div>
                                    <h3 className={styles.name}>{t.name}</h3>
                                    <p className={styles.role}>{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Mobile-only navigation dots */}
                <div className={styles.navDots}>
                    {testimonials.map((_, i) => (
                        <button
                            key={i}
                            className={`${styles.dot} ${
                                activeTestimonial === i ? styles.activeDot : ""
                            }`}
                            onClick={() => scrollTo(i)}
                            aria-label={`Go to testimonial ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}