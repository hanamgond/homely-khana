// src/app/layout.js

// 1. Import your new Providers component
//    (I'm using a relative path to avoid any alias issues)
import Providers from '../lib/providers';

// Import your global styles
import "@/styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";

// Import your AppWrapper component
import AppWrapper from './AppWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/*
          2. Wrap <AppWrapper> with <Providers>
          This ensures that <AppWrapper> and all its children
          (like <Header>) can access the QueryClient.
        */}
        <Providers>
          <AppWrapper>
            {children}
          </AppWrapper>
        </Providers>

        {/* The custom script stays here */}
        <script src="/olamaps-web-sdk.umd.js" defer></script>
      </body>
    </html>
  );
}