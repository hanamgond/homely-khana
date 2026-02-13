// src/app/subscribe/page.js
import SubscribeClient from '@/components/subscribe';

// This is the Server Component part of the page.
// It can safely export metadata.
export const metadata = {
  title: 'Build Your Subscription - HomelyKhana',
};

// It simply renders the interactive client component.
export default function SubscribePage() {
    // FIX: The component name must be capitalized to match the import.
    return <SubscribeClient />;
}