'use client'; // This directive is essential. It marks this as a Client Component.

import { usePathname } from 'next/navigation'; // The new App Router hook for getting the URL
import { AppProvider } from '@/utils/AppContext'; // Your context provider
import Header from '@/components/header';
import Cart from '@/components/cart';
// import { Toaster } from 'sonner'; // You can uncomment this if you're using it

export default function AppWrapper({ children }) {
  // Use the usePathname hook to get the current route
  const pathname = usePathname();

  // Define the pages where the header should not be displayed
  const noHeaderPages = ['/login', '/signup'];
  const showHeader = !noHeaderPages.includes(pathname);

  return (
    // Your AppProvider wraps everything, making context available to all components
    <AppProvider>
      {/* <Toaster richColors position='top-right' style={{ marginTop: '45px' }} /> */}

      {/* Conditionally render the Header component */}
      {showHeader && <Header />}

      {/* The Cart component seems to be present on all pages */}
      <Cart />

      {/* 'children' will be the actual page component being rendered by Next.js */}
      <main>{children}</main>
    </AppProvider>
  );
}
