import Link from "next/link";

// styles - Corrected paths using alias
import styles from '../styles/Legal.module.css';

export default function TermsAndCondition() {
   return (
      // The main Header component is automatically added by your AppWrapper,
      // so the manual nav bar has been removed.
      <div className={styles.container}>
         <div className={styles.title}>Terms &amp; Conditions</div>

         <div className={styles.bodyText}>
            <p>Effective Date: 28/06/2025</p>
            <p>Legal Entity: Homely Khana</p>
            <p>Website: <a href="https://homelykhana.in/">www.homelykhana.in</a></p>
            <p>Email: homelykhana24@gmail.com</p>
            <p>Contact Number: +91-9110649530</p>
            <br />
            <p>
               Welcome to Homely Khana. These Terms and Conditions (“Terms”) constitute a legally binding agreement between you (“Customer,” “you,” or “user”) and Homely Khana regarding your access to and use of our website, products, and services, including:
            </p>
            <ul>
               <li>Homely meal subscriptions</li>
               <li>One-time food ordering and delivery</li>
               <li>Custom and bulk catering services</li>
               <li>Corporate and institutional orders</li>
            </ul>
            <p>
               Please read these Terms carefully. By accessing or using our services, you confirm that you have read, understood, and agreed to be bound by them.
            </p>

            <p className={styles.heading}>1. Services Offered</p>
            <p>
               Homely Khana provides the following services:
            </p>
            <ul>
               <li><b>Meal Subscriptions:</b> Pre-paid plans offering daily homestyle meals delivered to customers.</li>
               <li><b>One-Time Orders:</b> Single or small-batch meals ordered on demand via our website.</li>
               <li><b>Delivery Services:</b> Delivery of all meals (subscription, one-time, or catering) to designated addresses.</li>
               <li><b>Catering Services:</b> Custom and bulk food orders for events, functions, and private gatherings.</li>
               <li><b>Corporate Orders:</b> Meal plans and one-time deliveries to corporate entities and offices under customized agreements.</li>
            </ul>
            <p>
               We reserve the right to change, expand, limit, or suspend any services at our sole discretion.
            </p>

            <p className={styles.heading}>2. Eligibility and Registration</p>
            <p>To use our services, you must:</p>
            <ul>
               <li>Be at least 18 years of age or using the service under parental/guardian supervision.</li>
               <li>Provide accurate, complete, and up-to-date information when placing orders or registering.</li>
            </ul>
            <p>
               You are solely responsible for maintaining the confidentiality of your login credentials (if any).
            </p>

            <p className={styles.heading}>3. Subscription and Payment Terms</p>
            <b>3.1 Meal Subscription Plans</b>
            <ul>
               <li>Subscriptions are available in weekly/monthly formats.</li>
               <li>Full advance payment is required at the time of subscription.</li>
               <li>Plans auto-expire at the end of the term unless renewed by the customer.</li>
            </ul>
            <b>3.2 Refund Policy</b>
            <ul>
               <li><b>Subscriptions and pre-paid orders are non-refundable</b>, except in cases of verified service failures by Homely Khana (e.g., non-delivery, quality issue).</li>
               <li>Refund requests must be emailed to homelykhana24@gmail.com and will be processed case-by-case.</li>
            </ul>

            <p className={styles.heading}>4. Meal Skipping Policy (Subscriptions Only)</p>
            <ul>
               <li>Customers may skip up to <b>10 meals per month</b> without penalty.</li>
               <li>Skipping must be requested <b>at least 4 hours in advance.</b></li>
               <li>Unused skip allowances are not carried forward or refunded.</li>
            </ul>

            <p className={styles.heading}>5. Delivery Terms</p>
            <ul>
               <li>Customers must ensure timely collection; we are not liable for food left unattended post-delivery.</li>
               <li>Late, missed, or incorrect deliveries due to customer unavailability, wrong address, or unreachable contact number will not be refunded.</li>
            </ul>

            <p className={styles.heading}>6. Catering & Corporate Orders</p>
            <ul>
               <li>All catering and corporate orders must be placed at least 48 hours in advance and require written confirmation from both parties.</li>
               <li>Bulk or custom orders may require an advance payment or deposit.</li>
               <li>Cancellation of confirmed catering or corporate orders is subject to terms stated in the service agreement or confirmation email.</li>
            </ul>

            <p className={styles.heading}>7. Food Safety and Quality</p>
            <ul>
               <li>Homely Khana follows FSSAI-compliant food preparation and handling procedures.</li>
               <li>Customers must notify us of allergies or dietary restrictions in advance. We do not guarantee allergen-free meals unless specifically stated.</li>
               <li>Food is meant to be consumed within the advised time window post-delivery.</li>
            </ul>

            <p className={styles.heading}>8. User Conduct</p>
            <p>You agree to use the platform and services only for lawful purposes and shall not:</p>
            <ul>
               <li>Misrepresent identity or provide false information</li>
               <li>Attempt to exploit system vulnerabilities or bypass security</li>
               <li>Post defamatory, obscene, or offensive content</li>
               <li>Abuse our staff or delivery personnel in any form</li>
            </ul>

            <p className={styles.heading}>9. Intellectual Property</p>
            <p>
               All content on the website (including logos, images, menus, software, and trademarks) is owned by Homely Khana or licensed for use. No content may be reused, copied, or reproduced without prior written permission.
            </p>

            <p className={styles.heading}>10. Promotions and Offers</p>
            <p>
               Promotions are subject to availability and eligibility criteria. We reserve the right to modify or withdraw offers without notice.
            </p>

            <p className={styles.heading}>11. Limitation of Liability</p>
            <p>
               To the maximum extent permitted by applicable law:
            </p>
            <ul>
               <li>Homely Khana is not liable for indirect, incidental, or consequential damages.</li>
               <li>Liability for any service-related claim is limited to the amount paid by the customer for that specific service.</li>
               <li>We are not liable for delays caused by force majeure events (e.g., natural calamities, traffic disruptions, or internet outages).</li>
            </ul>

            <p className={styles.heading}>12. Privacy</p>
            <p>
               Our Privacy Policy explains how we collect, use, and protect your personal data. Use of our services implies your consent to the Privacy Policy.
            </p>

            <p className={styles.heading}>13. Termination</p>
            <p>
               We reserve the right to suspend or terminate services to any user for breach of these Terms or suspected misuse of the platform. You may stop using our services at any time by ceasing to place orders or cancelling your subscription.
            </p>

            <p className={styles.heading}>14. Governing Law and Jurisdiction</p>
            <p>
               These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka.
            </p>

            <p className={styles.heading}>15. Contact Us</p>
            <p>
               If you have any questions about these Terms or your relationship with Homely Khana, please contact us:
            </p>
            <p><b>Email:</b> homelykhana24@gmail.com</p>
            <p><b>Phone:</b> +91-9110649530</p>
            <p><b>Address:</b> Ground Floor, Shop No.4, 1st B Main, 8th Block, Koramangala, Bangalore – 560095</p>
         </div>
      </div>
   );
}

