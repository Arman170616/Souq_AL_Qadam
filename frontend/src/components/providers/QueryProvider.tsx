'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from 'react-hot-toast';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'rgba(10,10,30,0.95)', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' },
          success: { iconTheme: { primary: '#4ade80', secondary: '#0a0a1a' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#0a0a1a' } },
        }}
      />
    </QueryClientProvider>
  );
}
