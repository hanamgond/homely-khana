import SubscriptionsClient from '@/components/dashboard/SubscriptionsClient';

// This is the Server Component part of the page.
// It can safely export metadata.
export const metadata = {
    title: 'My Subscriptions - HomelyKhana',
};

// It simply renders the interactive client component.
export default function SubscriptionsPage() {
    return <SubscriptionsClient />;
}

