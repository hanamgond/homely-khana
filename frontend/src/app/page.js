// --- THIS IS THE CORRECTED IMPORT PATH ---
import HomePageClient from "@/components/HomePage";

// This is a Server Component (NO 'use client')
export const metadata = {
  title: 'HomelyKhana - Healthy & Homely Food Delivery',
  description: "Fresh, home-cooked meals delivered to your doorstep. Subscribe now and never worry about meal planning again.",
};

// It renders the interactive client part of the page
export default function Home() {
  return <HomePageClient />;
}

