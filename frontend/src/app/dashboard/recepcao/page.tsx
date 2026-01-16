'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ClipboardList, 
  Briefcase, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Bell,
  Eye,
  Activity,
  UserCheck,
  Phone
} from 'lucide-react';
import { getVisitantes } from '@/services/pessoaService';
import { getPertences } from '@/services/pertenceService';
import { getOrgaos } from '@/services/orgaoService';
import { Visitante } from '@/types/pessoa';
import { Pertence } from '@/types/pertence';
import { Orgao } from '@/types/orgao';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

export default function RecepcaoDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        // Recepção só pode acessar visitantes e órgãos
        const [p, o] = await Promise.all([
          getVisitantes(),
          getOrgaos(),
        ]);
        setVisitantes(p);
        setOrgaos(o);
        // Pertences não são acessíveis para recepção
        setPertences([]);
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Estatísticas principais (limitadas para recepção)
  const totalVisitantes = Array.isArray(visitantes) ? visitantes.filter(v => v.ativo !== false).length : 0;
  const totalPertences = Array.isArray(pertences) ? pertences.length : 0;
  const totalOrgaos = Array.isArray(orgaos) ? orgaos.length : 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <UserCheck className="h-8 w-8" />
                  Dashboard da Recepção
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Acesso limitado - Apenas visualização de dados do seu órgão
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Recepção
                </Badge>
              </div>
            </div>
          </div>

          {/* Card informativo para recepção */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Perfil: Recepção</h3>
                  <p className="text-blue-800 text-sm">
                    Você tem acesso limitado ao sistema. Pode visualizar visitantes e órgãos, 
                    mas não pode gerenciar visitas ou pertences diretamente. Para solicitar visitas, use o sistema de notificações.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitantes Ativos</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{loading ? '...' : totalVisitantes}</div>
                <p className="text-xs text-muted-foreground">
                  Cadastrados no sistema
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órgãos</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{loading ? '...' : totalOrgaos}</div>
                <p className="text-xs text-muted-foreground">
                  Cadastrados
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Acesso Rápido Recepção */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Acesso Rápido
                </CardTitle>
                <CardDescription>
                  Ações disponíveis para recepção
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Button 
                  variant="default"
                  onClick={() => router.push('/dashboard/notificacoes')}
                  className="justify-start"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notificar o DSI
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard/visitas')}
                  className="justify-start"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Minhas Visitas
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard/orgaos')}
                  className="justify-start"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Ver Órgãos
                </Button>
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Informações da Recepção
                </CardTitle>
                <CardDescription>
                  Dados relevantes para a recepção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Usuário Logado:</span>
                  <Badge variant="outline">{user?.username}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Órgão:</span>
                  <span className="text-sm text-muted-foreground">
                    {user?.orgao?.nome || 'Não atribuído'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Perfil:</span>
                  <Badge variant="outline">Recepção</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Acesso:</span>
                  <span className="text-sm text-muted-foreground">Limitado</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atualização:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Instruções para Recepção */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Como Solicitar Visitas
                </CardTitle>
                <CardDescription>
                  Instruções para solicitar visitas através do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">1. Notificar o DSI</h4>
                    <p className="text-sm text-muted-foreground">
                      Use o botão "Notificar o DSI" para enviar uma solicitação de visita ao Departamento de Segurança Institucional.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">2. Aguardar Processamento</h4>
                    <p className="text-sm text-muted-foreground">
                      O DSI processará sua solicitação e criará a visita no sistema quando apropriado.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">3. Verificar Status</h4>
                    <p className="text-sm text-muted-foreground">
                      Você pode visualizar visitantes e órgãos, mas não pode gerenciar visitas ou pertences diretamente.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">4. Contato Direto</h4>
                    <p className="text-sm text-muted-foreground">
                      Para urgências, entre em contato diretamente com a portaria ou DSI.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
