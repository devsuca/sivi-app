
"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getPertences } from '@/services/pertenceService';
import { columns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { Pertence } from '@/types/pertence';
import { useAuth } from '@/lib/auth';
import { Lock } from 'lucide-react';

export default function PertencesListPage() {
  const { user } = useAuth();
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar permissões
  const canManagePertences = user?.role && ['admin', 'portaria', 'secretaria'].includes(user.role);

  useEffect(() => {
    if (canManagePertences) {
      getPertences().then(data => {
        setPertences(data);
        setLoading(false);
      }).catch(err => {
        console.error("Erro ao buscar pertences:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [canManagePertences]);

  // Verificar permissões primeiro
  if (!canManagePertences) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Lock className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                <p className="text-muted-foreground mb-4">
                  Você não tem permissão para visualizar pertences. 
                  Apenas Administradores, Portaria e Secretaria podem acessar esta funcionalidade.
                </p>
                <Button onClick={() => window.history.back()}>
                  Voltar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Gestão de Pertences</h1>
          <p className="text-muted-foreground text-sm mt-1">Lista de pertences registados na portaria</p>
        </div>
        <Link href="/dashboard/pertences/novo">
          <Button className="flex items-center gap-2">
            + Novo Registo
          </Button>
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {loading ? (
          <p>A carregar...</p>
        ) : (
          <DataTable columns={columns} data={pertences} />
        )}
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
