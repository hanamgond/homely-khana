'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { KpiCard } from '@/components/KpiCard';
import { SalesChart } from '@/components/SalesChart';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { createApiClient } from '@/lib/api'; // Import our new API client helper

// This is the main Dashboard page (M1)
export default function Home() {
  const { token } = useAuth(); // Get the token from our AuthContext
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch data if the token is available
    if (token) {
      const apiClient = createApiClient(token);

      const fetchStats = async () => {
        try {
          setIsLoading(true);
          const response = await apiClient('/admin/stats');
          if (response.success) {
            setStats(response.data);
          } else {
            setError(response.error || 'Failed to fetch stats');
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStats();
    }
  }, [token]); // Re-run this effect when the token changes

  // Helper function to format currency
  const formatCurrency = (value) => {
    return `₹${(value || 0).toLocaleString('en-IN')}`;
  };

  // --- RENDER LOGIC ---

  // Show a loading state
  if (isLoading) {
    return <div className="text-muted-foreground">Loading dashboard...</div>;
  }

  // Show an error state
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Show the full dashboard with live data
  return (
    <div className="flex flex-col gap-4">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          A high-level overview of your business. (Live Data)
        </p>
      </div>

      {/* 2. KPI Cards Grid (Now using live data) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Sales (Month)"
          value={formatCurrency(stats?.totalSales)}
          icon={DollarSign}
        />
        <KpiCard
          title="New Orders (Month)"
          value={stats?.newOrders.toString() || '0'}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Active Subscriptions"
          value={stats?.activeSubscriptions.toString() || '0'}
          icon={Users}
        />
        <KpiCard
          title="Meals Today (Lunch/Dinner)"
          value={`${stats?.mealsTodayLunch || 0} / ${stats?.mealsTodayDinner || 0}`}
          icon={Package}
        />
      </div>

      {/* 3. Main Chart and Recent Orders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {/* Left column (Chart) */}
        <div className="lg:col-span-4">
          <SalesChart />
          {/* Note: The chart data is still static. We will build its endpoint later. */}
        </div>

        {/* Right column (Recent Orders) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                The list of recent orders will go here.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}