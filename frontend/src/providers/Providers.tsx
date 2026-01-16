'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from 'sonner';
import { ClientBoundary } from '@/components/ClientBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClientBoundary>
      <AuthProvider>
        {children}
        <Toaster richColors />
      </AuthProvider>
    </ClientBoundary>
  );
}
