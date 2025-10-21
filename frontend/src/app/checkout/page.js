// --- THIS IS THE CORRECTED IMPORT PATH ---
import CheckoutClient from '@/components/checkout';

// This is the Server Component part of the page.
// It can safely export metadata.
export const metadata = {
  title: 'Checkout - HomelyKhana',
};

// It simply renders the interactive client component.
export default function CheckoutPage() {
    return <CheckoutClient />;
}