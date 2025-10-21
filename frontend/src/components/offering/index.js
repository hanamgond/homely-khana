'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Rating } from 'react-simple-star-rating';
import styles from "./Offering.module.css";
import veg from "@/assets/veg.svg";

// A checkmark icon for the list items
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className={styles.checkIcon} viewBox="0 0 16 16">
        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
    </svg>
);

const Offering = ({ name, value, reviews, caption, monthlyPrice, imgSrc, items }) => {
    const router = useRouter();

    const handleOrderNow = () => {
        router.push('/subscribe');
    };

    return (
        <div className={styles.offeringCard}>
            <div className={styles.imageContainer}>
                <Image src={imgSrc} alt={name} className={styles.offeringImage} layout="fill" objectFit="cover" />
                {/* NEW: Price Badge */}
                <div className={styles.priceBadge}>₹{monthlyPrice}</div>
            </div>

            <div className={styles.offeringContent}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{name}</h3>
                    <Image src={veg} alt="Vegetarian" width={24} height={24} />
                </div>
                <div className={styles.rating}>
                    <Rating initialValue={value} size={20} readonly fillColor="#f59e0b" emptyColor="#e0e0e0" />
                    <span className={styles.reviews}>({reviews.toLocaleString()} reviews)</span>
                </div>
                <p className={styles.caption}>{caption}</p>
                
                <ul className={styles.itemsList}>
                    {items.map((item, index) => (
                        <li key={index}>
                            <CheckIcon />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* NEW: Simplified Footer with just the button */}
            <div className={styles.footer}>
                <button onClick={handleOrderNow} className={styles.orderButton}>
                    Order Now
                </button>
            </div>
        </div>
    );
};

export default Offering;