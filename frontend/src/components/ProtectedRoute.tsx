'use client';

import { useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não estiver a carregar e o usuário não estiver autenticado, redireciona.
    if (!isLoading && !isAuthenticated) {
      console.log('🔒 Usuário não autenticado, redirecionando para login...');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Enquanto o AuthProvider verifica o estado, mostramos um loader.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-600 dark:text-gray-300">Verificando autenticação...</span>
        </div>
      </div>
    );
  }

  // Se estiver autenticado, renderiza o conteúdo protegido.
  return isAuthenticated ? <>{children}</> : null;
};

export default ProtectedRoute;