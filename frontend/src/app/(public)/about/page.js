'use client';

import Link from 'next/link';
import styles from './About.module.css';

export default function AboutPage() {
  return (
    <div className={styles.pageContainer}>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroInner}>
            <div className={styles.heroEyebrow}>
              Tradition • Care • Responsibility
            </div>
            <h1 className={styles.heroTitle}>
              Food prepared with<br />
              the dignity of home.
            </h1>
            <p className={styles.heroSubtitle}>
              HomelyKhana exists for those who believe that what we eat
              should be prepared with patience, familiarity,
              and respect for tradition.
            </p>
          </div>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className={styles.philosophy}>
        <div className={styles.container}>
          <div className={styles.philosophyGrid}>
            <div>
              <h2 className={styles.philosophyTitle}>
                A Different Way of Thinking About Food
              </h2>
              <p className={styles.philosophyText}>
                We do not view meals as products or orders.
                In our kitchens, food is treated as a responsibility —
                one that affects health, mood, and everyday life.
              </p>
              <p className={styles.philosophyText}>
                Ingredients are chosen deliberately.
                Cooking follows familiar rhythms.
                Excess is avoided.
              </p>

              <div className={styles.philosophyCallout}>
                If it does not belong on our own table,
                it does not leave our kitchen.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UTTAM */}
      <section className={styles.uttam}>
        <div className={styles.container}>
          <div className={styles.uttamCard}>
            <div className={styles.uttamEyebrow}>
              The Heart of HomelyKhana
            </div>
            <h2 className={styles.uttamTitle}>
              Uttam
            </h2>

            <p className={styles.uttamText}>
              Uttam begins her day before sunrise,
              cooking the way she learned at home —
              by observing, tasting, and adjusting with care.
            </p>

            <p className={styles.uttamText}>
              Spices are ground by hand.
              Oil is measured with restraint.
              Each dish is prepared to be eaten daily,
              not occasionally.
            </p>

            <div className={styles.uttamQuote}>
              “Would I serve this to my family?”
            </div>

            <p className={styles.uttamText}>
              This question guides every meal.
              It always has.
            </p>
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className={styles.audience}>
        <div className={styles.container}>
          <h2 className={styles.audienceTitle}>
            Who This Is For
          </h2>

          <div className={styles.audienceGrid}>
            <div className={styles.audienceItem}>
              Those who value consistency and restraint over novelty.
            </div>
            <div className={styles.audienceItem}>
              Those who grew up with home-cooked meals as a daily ritual.
            </div>
            <div className={styles.audienceItem}>
              Those who care about how food is prepared,
              not just how it tastes.
            </div>
            <div className={styles.audienceItem}>
              Those who want meals that feel familiar,
              nourishing, and dependable.
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <p className={styles.ctaText}>
            If this philosophy resonates with you,
            we invite you to experience our kitchen.
          </p>

          <div className={styles.ctaActions}>
            <Link href="/menu" className={styles.ctaPrimary}>
              View Today’s Menu
            </Link>
            <Link href="/subscribe" className={styles.ctaSecondary}>
              Begin a Subscription
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
