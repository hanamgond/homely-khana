//src/app/dashboard/page.js
import DashboardClient from '@/components/dashboard/DashboardClient';

// This is the Server Component part of the page.
// It can safely export metadata.
export const metadata = {
  title: 'Your Dashboard - HomelyKhana',
};

// It simply renders the interactive client component.
export default function DashboardPage() {
    return <DashboardClient />;
}

