import Link from "next/link";

// styles - Corrected paths using alias
import styles from '../styles/Legal.module.css';


export default function PrivacyPolicy() {
   return (
      // The main Header component is automatically added by your AppWrapper,
      // so the manual nav bar has been removed from this file.
      <div className={styles.container}>
         <div className={styles.title}>Privacy Policy</div>

         <div className={styles.bodyText}>
            <p>Effective Date: 28/06/2025</p>
            <p>Legal Entity: Homely Khana</p>
            <p>Website: <a href="https://www.homelykhana.in">www.homelykhana.in</a></p>
            <p>Email: homelykhana24@gmail.com</p>
            <p>Contact Number: +91-9110649530</p>

            <br />
            <p>
               At Homely Khana, we are committed to protecting your privacy. This Privacy Policy outlines how we collect, use, share, and safeguard your personal information when you use our website or services. It is prepared in compliance with the Indian IT Act, 2000 and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.
            </p>

            <p className={styles.heading}>1. Information We Collect</p>
            <ul>
               <li><b>Personal Information:</b> Name, mobile number, email address, delivery address, and payment details (processed securely).</li>
               <li><b>Usage Data:</b> IP address, browser/device info, pages visited, session duration, and order history.</li>
            </ul>

            <p className={styles.heading}>2. How We Use Your Information</p>
            <ul>
               <li>Fulfill your orders and manage meal subscriptions</li>
               <li>Process payments through certified gateways</li>
               <li>Communicate updates, offers, and customer support</li>
               <li>Enhance website functionality and user experience</li>
               <li>Monitor and analyze usage patterns</li>
            </ul>

            <p className={styles.heading}>3. Consent</p>
            <p>By using our services, you consent to the collection and use of your information as described in this policy. This includes communication via email, SMS, or phone regarding services and offers.</p>

            <p className={styles.heading}>4. Data Sharing and Disclosure</p>
            <ul>
               <li>We do not sell or rent your personal data.</li>
               <li>Data may be shared with delivery partners, payment gateways, and analytics providers strictly for service purposes.</li>
               <li>All partners follow strict confidentiality and data protection norms.</li>
            </ul>

            <p className={styles.heading}>5. Data Security</p>
            <ul>
               <li>SSL encryption and secure hosting environments</li>
               <li>Role-based access controls for sensitive data</li>
               <li>Payment data handled through PCI-DSS compliant gateways only</li>
            </ul>

            <p className={styles.heading}>6. Data Retention</p>
            <ul>
               <li>Data is retained while your account is active or required for service</li>
               <li>Maximum retention: 3 years after last activity or until deletion is requested</li>
            </ul>

            <p className={styles.heading}>7. Your Rights</p>
            <ul>
               <li>Request access, correction, or deletion of your personal data</li>
               <li>Opt out of marketing communication anytime</li>
               <li>Email: support@homelykhana.in for data-related requests</li>
            </ul>

            <p className={styles.heading}>8. Cookies and Tracking</p>
            <ul>
               <li>Cookies are used to personalize experience, analyze traffic, and enhance services</li>
               <li>Can be disabled via browser settings (may affect functionality)</li>
            </ul>

            <p className={styles.heading}>9. Third-Party Links</p>
            <p>Our site may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies before sharing information.</p>

            <p className={styles.heading}>10. Updates to This Policy</p>
            <p>This policy may be revised occasionally. Updates will be posted here with the effective date. Continued use constitutes acceptance of the revised policy.</p>

            <p className={styles.heading}>15. Contact Us</p>
            If you have questions about this Privacy Policy or your data, contact:
            <p><b>Email:</b> homelykhana24@gmail.com</p>
            <p><b>Phone:</b> +91-9110649530</p>
            <p><b>Address:</b> Ground Floor, Shop No.4, 1st B Main, 8th Block, Koramangala, Bangalore – 560095</p>
         </div>
      </div>
   );
}

