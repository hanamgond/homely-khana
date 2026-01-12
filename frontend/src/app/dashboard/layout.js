// src/app/dashboard/layout.js
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function Layout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}