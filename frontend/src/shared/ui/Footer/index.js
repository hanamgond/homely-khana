//frontend/src/shared/ui/Footer/index.js
import Link from 'next/link';
import styles from './Footer.module.css';

// --- Reusable SVG Icon Components ---
const InstagramIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>);
const FacebookIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>);
const TwitterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          {/* --- Column 1: Brand Info --- */}
          <div className={styles.brandColumn}>
            <h3 className={styles.logo}>HomelyKhana</h3>
            <p className={styles.description}>
              Fresh, home-cooked meals delivered to your doorstep. Healthy, hygienic, and always on time.
            </p>
            <div className={styles.socialIcons}>
              <a href="#" aria-label="Instagram"><InstagramIcon /></a>
              <a href="#" aria-label="Facebook"><FacebookIcon /></a>
              <a href="#" aria-label="Twitter"><TwitterIcon /></a>
            </div>
          </div>

          {/* --- Column 2: Quick Links --- */}
          <div>
            <h4 className={styles.footerHeading}>Quick Links</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/subscribe">Subscribe</Link></li>
              <li><Link href="/#faq">FAQs</Link></li>
            </ul>
          </div>

          {/* --- Column 3: Legal Links --- */}
          <div>
            <h4 className={styles.footerHeading}>Legal</h4>
            <ul className={styles.footerLinks}>
              <li><Link href="/terms-and-conditions">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
              <li><Link href="/refund-and-cancellation-policy">Refund Policy</Link></li>
            </ul>
          </div>

          {/* --- Column 4: Contact Info --- */}
          <div>
            <h4 className={styles.footerHeading}>Contact Us</h4>
            <ul className={styles.footerLinks}>
              <li>contact@homelykhana.in</li>
              <li>+91 91106 49530</li>
              <li>Koramangala, Bangalore</li>
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