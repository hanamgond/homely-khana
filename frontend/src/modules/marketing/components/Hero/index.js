// frontend/src/modules/marketing/components/Hero/index.js
'use client';

import Link from "next/link";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1>
          Order Healthy & <span className={styles.accent}>Homely Food</span>
        </h1>
        <p>
          Fresh, home-cooked meals delivered to your doorstep. Subscribe now and never worry about meal planning again.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/subscribe" className={`${styles.ctaButton} ${styles.primary}`}>
            Start Your Subscription →
          </Link>
          <Link href="/subscribe?plan=trial" className={`${styles.ctaButton} ${styles.secondary}`}>
            Try 3-Day Trial
          </Link>
        </div>
      </div>
    </section>
  );
}