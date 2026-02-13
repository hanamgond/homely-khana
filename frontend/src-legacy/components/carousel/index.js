'use client';

import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import Image from 'next/image'; // 1. Import the Next.js Image component

// Styles
import "react-responsive-carousel/lib/styles/carousel.min.css";
import styles from "./Carousel.module.css"; // Assumes colocation

// Example image URLs from our previous conversation
const urls = [
    "https://images.unsplash.com/photo-1709917241494-48fdf74f2640?q=80&w=1854&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1709884735206-295d326752c7?w=500&auto=format&fit=crop&q=60&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGZyZWUlMjBpbWFnZXN8ZW58MHx8MHx8fDA%3D",
    "https://plus.unsplash.com/premium_photo-1682091872078-46c5ed6a006d?w=500&auto=format&fit=crop&q=60&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGZyZWUlMjBpbWFnZXN8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1683319915193-c03a77fcf1ca?w=500&auto=format&fit=crop&q=60&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8cGhvdG8lMjBiYWNrZ3JvdW5kfGVufDB8fDB8fHww",
    "https://images.unsplash.com/photo-1662038600502-7c5a752bd77a?q=80&w=1935&auto=format&fit=crop&ixlib-rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
];

export default function CustomCarousel() {
  return (
    <div>
      {/* --- This could be your version for wider screens --- */}
      <Carousel 
        autoPlay={true} 
        className={styles.carouselWeb} 
        interval={3000} 
        infiniteLoop={true} 
        centerMode={true} 
        showThumbs={false} 
        showStatus={false} 
        showArrows={false} 
        showIndicators={false} 
        transitionTime={650} 
        stopOnHover={false} 
        centerSlidePercentage={33}
      >
        {urls.map((slideUrl, index) => (
          // 2. The "key" prop MUST be on the outermost element of the map
          <div key={index} className={styles.carouselParent}>
            {/* 3. Use the optimized Next.js Image component */}
            <Image
              src={slideUrl}
              // 4. Add a descriptive "alt" prop for accessibility
              alt={`Promotional image slide ${index + 1}`}
              className={styles.carouselImg}
              width={500} // Provide a base width
              height={300} // Provide a base height
              priority={index < 3} // Prioritize loading the first few images
            />
          </div>
        ))}
      </Carousel>

      {/* --- This could be your version for mobile screens --- */}
      {/* You would add a similar, corrected carousel here for mobile if needed */}
    </div>
  );
}