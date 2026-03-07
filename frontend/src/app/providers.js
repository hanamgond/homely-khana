//frontend/src/app/providers.js
'use client';

import { AppProvider } from "@/shared/lib/AppContext";

export function Providers({ children }) {
  return <AppProvider>{children}</AppProvider>;
}