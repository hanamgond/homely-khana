//frontend/src/shared/ui/Footer/index.js
'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const handleFAQClick = (e) => {
    e.preventDefault();
    
    // This must match the ID set in your modular FAQ component
    const targetId = 'faq-section';

    if (pathname === '/') {
      const faqSection = document.getElementById(targetId);
      if (faqSection) {
        faqSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to home and jump to the FAQ section
      router.push(`/#${targetId}`);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          {/* --- Column 1: Brand --- */}
          <div className={styles.brandColumn}>
            <h3 className={styles.logo}>HomelyKhana</h3>
            <p className={styles.description}>
              Fresh, home-cooked meals delivered to your doorstep. Healthy, hygienic, and always on time.
            </p>
          </div>

          {/* --- Column 2: Quick Links --- */}
          <div>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/" className={styles.footerLink}>Home</Link></li>
              <li><Link href="/subscribe" className={styles.footerLink}>Subscribe</Link></li>
              <li>
                <a href="#faq-section" onClick={handleFAQClick} className={styles.footerLink}>
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* --- Column 3: Legal --- */}
          <div>
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/terms-and-conditions" className={styles.footerLink}>Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className={styles.footerLink}>Privacy Policy</Link></li>
              <li><Link href="/refund-and-cancellation-policy" className={styles.footerLink}>Refund Policy</Link></li>
            </ul>
          </div>

          {/* --- Column 4: Contact --- */}
          <div>
            <h4 className={styles.footerHeading}>Contact Us</h4>
            <ul className={styles.footerLinks}>
              <li className={styles.contactItem}>contact@homelykhana.in</li>
              <li className={styles.contactItem}>+91 91106 49530</li>
              <li className={styles.contactItem}>Koramangala, Bangalore</li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} HomelyKhana. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}