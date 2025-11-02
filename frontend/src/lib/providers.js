"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" style={{ padding: '20px', border: '1px solid red', borderRadius: '8px', backgroundColor: '#fff5f5' }}>
      <h2 style={{ color: '#c53030', margin: '0 0 1rem 0' }}>Oh no! Something went wrong.</h2>
      <pre style={{ color: '#c53030', backgroundColor: '#fed7d7', padding: '0.5rem', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', backgroundColor: '#c53030', color: 'white', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}

export default function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false, // Better for performance
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          console.log("Error boundary reset triggered.");
        }}
      >
        {children}
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
