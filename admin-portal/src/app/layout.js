import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext'; // Import the provider
import { Toaster } from '@/components/ui/sonner'; // Import the toaster

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'HomelyKhana Admin',
  description: 'Admin portal for HomelyKhana',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={cn('min-h-screen bg-background font-sans antialiased', inter.className)}>
        {/* Wrap everything in the AuthProvider */}
        <AuthProvider>
          {children}
          {/* This component will show the "Login Successful" toasts */}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}