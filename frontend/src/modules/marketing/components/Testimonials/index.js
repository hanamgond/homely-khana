'use client';

import Image from 'next/image'; // 1. Use the optimized Image component
import styles from './Testimonials.module.css'; // Assumes colocation

// Using consistent testimonial data
const testimonials = [
    { name: 'Priya Sharma', role: 'Software Engineer', image: '/testimonials/priya.jpg', review: '"HomelyKhana has been a lifesaver! The food tastes just like my mom\'s cooking. The freshness and quality are unmatched."' },
    { name: 'Rahul Verma', role: 'Marketing Manager', image: '/testimonials/rahul.jpg', review: '"As someone who works long hours, having healthy homemade meals delivered daily has changed my life. The variety is great and the delivery is always on time."' },
    { name: 'Anjali Patel', role: 'Teacher', image: '/testimonials/anjali.jpg', review: '"I was skeptical at first, but the trial convinced me. The meals are delicious, portions are perfect, and it\'s so convenient. My family loves the food too!"' },
    { name: 'Amit Kumar', role: 'Entrepreneur', image: '/testimonials/amit.jpg', review: '"Great service with authentic taste. The subscription flexibility is excellent. I can pause or modify my plan anytime."' },
];

// Splitting the array just to match the two separate iterators from your error log
const featuredTestimonials = testimonials.slice(0, 2);
const otherTestimonials = testimonials.slice(2, 4);

export default function TestimonialSection() {
    return (
        <section className={styles.section}>
             <div className={styles.sectionHeader}>
                <h2>What Our Customers Say</h2>
                <p>Join thousands of happy customers who trust HomelyKhana for their daily meals</p>
            </div>
            <div className={styles.testimonialsGrid}>
                {/* --- First Iterator --- */}
                {featuredTestimonials.map(testimonial => (
                    // 2. Add a unique "key" prop to the root element of the map
                    <div key={testimonial.name} className={styles.testimonialCard}>
                        <div className={styles.testimonialHeader}>
                            <Image 
                                src={testimonial.image} 
                                // 3. Add a descriptive "alt" prop
                                alt={`Portrait of ${testimonial.name}`}
                                width={50} 
                                height={50} 
                                className={styles.testimonialAvatar} 
                            />
                            <div>
                                <h3>{testimonial.name}</h3>
                                <p className={styles.role}>{testimonial.role}</p>
                            </div>
                        </div>
                        <div className={styles.testimonialStars}>★★★★★</div>
                        <p className={styles.reviewText}>{testimonial.review}</p>
                    </div>
                ))}
                {/* --- Second Iterator --- */}
                {otherTestimonials.map(testimonial => (
                    <div key={testimonial.name} className={styles.testimonialCard}>
                        <div className={styles.testimonialHeader}>
                            <Image 
                                src={testimonial.image} 
                                alt={`Portrait of ${testimonial.name}`}
                                width={50} 
                                height={50} 
                                className={styles.testimonialAvatar} 
                            />
                            <div>
                                <h3>{testimonial.name}</h3>
                                <p className={styles.role}>{testimonial.role}</p>
                            </div>
                        </div>
                        <div className={styles.testimonialStars}>★★★★★</div>
                        <p className={styles.reviewText}>{testimonial.review}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}