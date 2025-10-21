import Link from "next/link";

// styles - Corrected paths using alias
import styles from "@/styles/Terms.module.css";

// This is a Server Component, so it can safely export metadata
export const metadata = {
   title: 'Refund and Cancellation Policy - HomelyKhana',
};

export default function RefundCancellationPage() {
   return (
      // The main Header component is automatically added by your AppWrapper,
      // so the manual nav bar has been removed from this file.
      <div className={styles.container}>
         <div className={styles.title}>Refund &amp; Cancellation Policy</div>

         <div className={styles.bodyText}>
            <p>Effective Date: 28/06/2025</p>
            <p>Legal Entity: Homely Khana</p>
            <p>Website: <a href="https://www.homelykhana.in">www.homelykhana.in</a></p>
            <p>Email: homelykhana24@gmail.com</p>
            <p>Contact Number: +91-9110649530</p>

            <br />
            <p>
               At Homely Khana, we aim to provide high-quality meals and reliable service. This Refund and Cancellation Policy explains the conditions under which refunds or cancellations may be approved.
            </p>

            <p className={styles.heading}>1. Refund Conditions</p>
            <ul>
               <li>
                  Refunds are <b>not provided</b> for meal plans or individual orders unless a service-related issue is identified and verified (e.g., non-delivery, incorrect item delivered, or quality concerns).
               </li>
               <li>
                  To request a refund, customers must email <b>homelykhana24@gmail.com</b> with the <b>Order ID</b> and a clear explanation of the issue.
               </li>
               <li>
                  Upon validation, approved refunds will be processed to the original payment method within <b>5–7 working days</b>.
               </li>
            </ul>

            <p className={styles.heading}>2. Meal Skipping (Subscription Users)</p>
            <ul>
               <li>
                  Subscribers are allowed to skip up to <b>10 meals per month</b> with a <b>minimum of 24-hour advance notice</b> before the scheduled delivery.
               </li>
               <li>
                  Skipped meals beyond this limit will <b>not</b> be refunded, adjusted, or carried over to future billing cycles.
               </li>
            </ul>

            <p className={styles.heading}>3. Catering &amp; Corporate Order Cancellations</p>
            <ul>
               <li>
                  Catering or corporate meal orders must be cancelled at least <b>24–48 hours in advance</b>, depending on the volume and size of the order.
               </li>
               <li>
                  Cancellation terms are subject to the confirmation agreement shared at the time of order placement.
               </li>
            </ul>

            <p className={styles.heading}>4. Contact for Support</p>
            <p>
               If you wish to raise a refund or cancellation request, or need assistance understanding this policy, please reach out to our support team:
            </p>
            <p><b>Email:</b> homelykhana24@gmail.com</p>
            <p><b>Phone:</b> +91-9110649530</p>
            <p><b>Address:</b> Ground Floor, Shop No.4, 1st B Main, 8th Block, Koramangala, Bangalore – 560095</p>
         </div>
      </div>
   );
}
