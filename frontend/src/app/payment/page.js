// src/app/payment/page.js
import PaymentClient from '@/components/payment';

// This is the Server Component part of the page.
// It can safely export metadata.
export const metadata = {
  title: 'Payment - HomelyKhana',
};

// It simply renders the interactive client component.
export default function PaymentPage() {
    return <PaymentClient />;
}

