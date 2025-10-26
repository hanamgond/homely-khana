'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/header';
import Cart from '@/components/cart';
// import { Toaster } from 'sonner';

// --- REMOVED AppProvider ---
// import { AppProvider } from '@/utils/AppContext';

export default function AppWrapper({ children }) {
  const pathname = usePathname();

  const noHeaderPages = ['/login', '/signup'];
  const showHeader = !noHeaderPages.includes(pathname);

  return (
    // --- The <AppProvider> wrapper is now gone ---
    <>
      {/* <Toaster richColors position='top-right' style={{ marginTop: '45px' }} /> */}

      {showHeader && <Header />}

      {/* NOTE: This <Cart /> component likely still uses AppContext.
        We will need to refactor it or remove it.
        For now, let's see if the app loads.
      */}
      <Cart />

      <main>{children}</main>
    </>
  );
}