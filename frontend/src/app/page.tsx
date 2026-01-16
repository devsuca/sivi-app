'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // Aguarda a verificação de autenticação terminar
    if (isLoading) {
      return;
    }

    if (isAuthenticated) {
      // Redirecionar para dashboard específico baseado no role
      const userRole = user?.role;
      let dashboardPath = '/dashboard';

      switch (userRole) {
        case 'admin':
          dashboardPath = '/dashboard/admin';
          break;
        case 'portaria':
          dashboardPath = '/dashboard/portaria';
          break;
        case 'secretaria':
          dashboardPath = '/dashboard/secretaria';
          break;
        case 'recepcao':
          dashboardPath = '/dashboard/recepcao';
          break;
      }

      console.log('✅ Usuário autenticado, redirecionando para dashboard específico:', dashboardPath);
      router.replace(dashboardPath);
    } else {
      console.log('🔒 Usuário não autenticado, redirecionando para login...');
      router.replace('/login');
    }
  }, [router, isAuthenticated, user, isLoading]);

  // Mostra um loader enquanto a lógica de redirecionamento está a ser processada
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-sm text-gray-600 dark:text-gray-300">Carregando...</span>
      </div>
    </div>
  );
}
