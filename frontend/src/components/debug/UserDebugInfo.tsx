'use client';

import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Building2 } from 'lucide-react';

export function UserDebugInfo() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <User className="h-5 w-5" />
            Debug: Usuário Não Autenticado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">Usuário não está autenticado ou dados não carregados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <User className="h-5 w-5" />
          Debug: Informações do Usuário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Username:</p>
            <p className="text-blue-900 font-mono">{user.username}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-700">ID:</p>
            <p className="text-blue-900 font-mono">{user.id}</p>
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-blue-700 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Role/Permissões:
          </p>
          <div className="mt-1">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                user.role === 'portaria' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                user.role === 'recepcao' ? 'bg-green-100 text-green-800 border-green-200' :
                user.role === 'secretaria' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {user.role || 'Sem role definido'}
            </Badge>
          </div>
        </div>
        
        {user.orgao && (
          <div>
            <p className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Órgão:
            </p>
            <p className="text-blue-900">{user.orgao.nome}</p>
          </div>
        )}
        
        <div className="pt-2 border-t border-blue-200 space-y-1">
          <p className="text-xs text-blue-600">
            <strong>Permissões para notificações:</strong> {
              ['admin', 'portaria', 'recepcao'].includes(user.role || '') 
                ? '✅ PODE criar notificações' 
                : '❌ NÃO PODE criar notificações'
            }
          </p>
          <p className="text-xs text-blue-600">
            <strong>Permissões para crachás:</strong> {
              ['admin', 'portaria', 'secretaria'].includes(user.role || '') 
                ? '✅ PODE associar crachás' 
                : '❌ NÃO PODE associar crachás'
            }
          </p>
          <p className="text-xs text-blue-600">
            <strong>Permissões para visitas:</strong> {
              ['admin', 'portaria', 'secretaria'].includes(user.role || '') 
                ? '✅ PODE modificar visitas' 
                : '❌ NÃO PODE modificar visitas'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
