'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, ArrowLeft } from 'lucide-react';

interface SupportRouteGuardProps {
  children: React.ReactNode;
}

export default function SupportRouteGuard({ children }: SupportRouteGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Simular um pequeno delay para verificação
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isChecking) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (user.role !== 'suporte') {
        // Usuário não tem permissão de suporte
        return;
      }
    }
  }, [user, isChecking, router]);

  // Mostrar loading enquanto verifica autenticação
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Verificando permissões de acesso...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usuário não autenticado
  if (!user) {
    return null; // Redirecionamento em andamento
  }

  // Usuário não tem permissão de suporte
  if (user.role !== 'suporte') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Acesso Negado
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Você não tem permissão para acessar o Sistema de Suporte Técnico.
            </p>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Permissão Necessária
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300">
                    Apenas usuários com perfil "Suporte Técnico" podem acessar esta área.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Dashboard
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/ajuda')}
                className="w-full"
              >
                Acessar Ajuda
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Usuário tem permissão, renderizar conteúdo
  return <>{children}</>;
}
