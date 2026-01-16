'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  showAccessDenied = true 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // Se não estiver autenticado, não mostrar nada
  if (!isAuthenticated || !user) {
    return null;
  }

  // Verificar se o usuário tem uma das roles permitidas
  const hasPermission = allowedRoles.includes(user.role);

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showAccessDenied) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Alert className="max-w-md border-red-200 bg-red-50">
            <Lock className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <p className="font-semibold">Acesso Negado</p>
                <p>
                  Você não tem permissão para acessar esta funcionalidade.
                </p>
                <p className="text-sm text-red-600">
                  Role atual: <span className="font-mono bg-red-100 px-1 rounded">{user.role}</span>
                </p>
                <p className="text-sm text-red-600">
                  Roles permitidas: {allowedRoles.map(role => 
                    <span key={role} className="font-mono bg-red-100 px-1 rounded mx-1">{role}</span>
                  )}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

// Hook para verificar permissões por role
export function useRolePermission(allowedRoles: string[]): boolean {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return false;
  }
  
  return allowedRoles.includes(user.role);
}

// Componente para mostrar informações de permissão
export function PermissionInfo({ allowedRoles }: { allowedRoles: string[] }) {
  const { user } = useAuth();
  const hasPermission = useRolePermission(allowedRoles);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Shield className="h-4 w-4" />
      <span>
        {hasPermission ? (
          <span className="text-green-600 font-medium">
            ✅ Acesso permitido para role: {user?.role}
          </span>
        ) : (
          <span className="text-red-600 font-medium">
            ❌ Acesso negado para role: {user?.role}
          </span>
        )}
      </span>
    </div>
  );
}
