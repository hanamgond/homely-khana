import Link from "next/link";

// styles - Corrected paths using alias
import styles from '../styles/Legal.module.css';


export default function ShippingPolicy() {
   return (
      // The main Header component is automatically added by your AppWrapper,
      // so the manual nav bar has been removed.
      <div className={styles.container}>
         <div className={styles.title}>Shipping &amp; Delivery Policy</div>

         <div className={styles.bodyText}>
            <p>Effective Date: 28/06/2025</p>
            <p>Legal Entity: Homely Khana</p>
            <p>Website: <a href="https://www.homelykhana.in">www.homelykhana.in</a></p>
            <p>Email: homelykhana24@gmail.com</p>
            <p>Contact Number: +91-9110649530</p>

            <br />
            <p>
               This Shipping and Delivery Policy explains how Homely Khana manages food delivery services, coverage areas, and delivery expectations for customers using our platform.
            </p>

            <p className={styles.heading}>1. Serviceable Areas</p>
            <ul>
               <li>
                  Homely Khana currently delivers <b>only within select areas of Bangalore</b>.
               </li>
               <li>
                  Customers can verify service availability by checking our website or contacting our customer support team.
               </li>
            </ul>

            <p className={styles.heading}>2. Delivery Time Slots</p>
            <ul>
               <li><b>Lunch:</b> 11:30 AM – 2:30 PM</li>
               <li><b>Dinner:</b> 6:30 PM – 9:30 PM</li>
               <li>Deliveries are made during the chosen time slot selected by the customer at the time of ordering or subscribing.</li>
            </ul>

            <p className={styles.heading}>3. Customer Responsibilities</p>
            <ul>
               <li>
                  Customers must ensure their availability to receive the delivery at the selected address during the chosen time slot.
               </li>
               <li>
                  Deliveries are made <b>only to the ground floor</b> of the provided address unless otherwise agreed in advance.
               </li>
            </ul>

            <p className={styles.heading}>4. Missed Deliveries</p>
            <ul>
               <li>
                  If a customer is unavailable or unreachable at the time of delivery, the order will be marked as delivered.
               </li>
               <li>
                  No refunds or redeliveries will be made for missed deliveries due to customer unavailability.
               </li>
            </ul>

            <p className={styles.heading}>5. Post-Delivery Responsibility</p>
            <ul>
               <li>
                  Homely Khana is not liable for food left unattended after successful delivery.
               </li>
               <li>
                  Customers are responsible for <b>prompt collection and safe consumption</b> of the delivered food within the recommended time window.
               </li>
            </ul>

            <p className={styles.heading}>6. Contact for Delivery Support</p>
            <p><b>Email:</b> homelykhana24@gmail.com</p>
            <p><b>Phone:</b> +91-9110649530</p>
            <p><b>Address:</b> Ground Floor, Shop No.4, 1st B Main, 8th Block, Koramangala, Bangalore – 560095</p>
         </div>
      </div>
   );
}

