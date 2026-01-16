'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  ClipboardList, 
  Briefcase, 
  Building2, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Calendar,
  PlusCircle,
  Eye,
  FileText,
  Activity,
  Shield,
  Bell
} from 'lucide-react';
import { getVisitas } from '@/services/visitaService';
import { getVisitantes } from '@/services/pessoaService';
import { getPertences } from '@/services/pertenceService';
import { getOrgaos } from '@/services/orgaoService';
import { Visita } from '@/types/visita';
import { Visitante } from '@/types/pessoa';
import { Pertence } from '@/types/pertence';
import { Orgao } from '@/types/orgao';
import { useAuth } from '@/lib/auth';
import NotificationStats from '@/components/notifications/NotificationStats';
import NotificationToast from '@/components/notifications/NotificationToast';
import { useNotificationManager } from '@/hooks/useNotificationManager';
import { toast } from 'sonner';

const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function isHoje(dateStr: string) {
  const hoje = new Date();
  const d = new Date(dateStr);
  return (
    d.getDate() === hoje.getDate() &&
    d.getMonth() === hoje.getMonth() &&
    d.getFullYear() === hoje.getFullYear()
  );
}

function isEstaSemana(dateStr: string) {
  const hoje = new Date();
  const d = new Date(dateStr);
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);
  
  return d >= inicioSemana && d <= fimSemana;
}

export default function PortariaDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Gerenciador de notificações em tempo real
  const { 
    newNotifications, 
    dismissToast, 
    markAsViewed, 
    markAsProcessed 
  } = useNotificationManager();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [v, p, pe, o] = await Promise.all([
          getVisitas(),
          getVisitantes(),
          getPertences(),
          getOrgaos(),
        ]);
        setVisitas(v);
        setVisitantes(p);
        setPertences(pe);
        setOrgaos(o);
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Estatísticas principais - otimizadas com useMemo
  const stats = useMemo(() => {
    // Garantir que os dados sejam arrays válidos
    const visitasArray = Array.isArray(visitas) ? visitas : [];
    const visitantesArray = Array.isArray(visitantes) ? visitantes : [];
    const pertencesArray = Array.isArray(pertences) ? pertences : [];
    const orgaosArray = Array.isArray(orgaos) ? orgaos : [];

    const visitasHoje = visitasArray.filter(v => v.data_hora_entrada && isHoje(v.data_hora_entrada)).length;
    const visitasEstaSemana = visitasArray.filter(v => v.data_hora_entrada && isEstaSemana(v.data_hora_entrada)).length;
    const totalVisitantes = visitantesArray.filter(v => v.ativo !== false).length;
    const totalPertences = pertencesArray.length;
    const totalOrgaos = orgaosArray.length;

    // Estatísticas de visitas por estado
    const visitasAgendadas = visitasArray.filter(v => v.estado === 'agendada').length;
    const visitasEmCurso = visitasArray.filter(v => v.estado === 'em_curso').length;
    const visitasFinalizadas = visitasArray.filter(v => v.estado === 'concluida').length;
    const visitasCanceladas = visitasArray.filter(v => v.estado === 'cancelada').length;

    return {
      visitasHoje,
      visitasEstaSemana,
      totalVisitantes,
      totalPertences,
      totalOrgaos,
      visitasAgendadas,
      visitasEmCurso,
      visitasFinalizadas,
      visitasCanceladas
    };
  }, [visitas, visitantes, pertences, orgaos]);

  // Dados para gráficos - otimizado com useMemo
  const chartData = useMemo(() => {
    const hoje = new Date();
    const dias = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (6 - i));
      return d;
    });

    // Garantir que visitas seja um array válido
    const visitasArray = Array.isArray(visitas) ? visitas : [];

    return dias.map((d) => {
      const nome = diasSemana[d.getDay()];
      const count = visitasArray.filter(v => {
        if (!v.data_hora_entrada) return false;
        const vd = new Date(v.data_hora_entrada);
        return (
          vd.getDate() === d.getDate() &&
          vd.getMonth() === d.getMonth() &&
          vd.getFullYear() === d.getFullYear()
        );
      }).length;
      return { name: nome, Visitas: count };
    });
  }, [visitas]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Shield className="h-8 w-8" />
                  Dashboard da Portaria
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Controle de acesso e gestão de visitas
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Portaria
                </Badge>
              </div>
            </div>
          </div>

          {/* Estatísticas de Notificações */}
          <NotificationStats className="mb-6" />

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Hoje</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.visitasHoje}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.visitasEstaSemana} esta semana
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitantes Ativos</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.totalVisitantes}</div>
                <p className="text-xs text-muted-foreground">
                  Cadastrados no sistema
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pertences</CardTitle>
                <Briefcase className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{loading ? '...' : stats.totalPertences}</div>
                <p className="text-xs text-muted-foreground">
                  Registrados
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órgãos</CardTitle>
                <Building2 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{loading ? '...' : stats.totalOrgaos}</div>
                <p className="text-xs text-muted-foreground">
                  Cadastrados
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Status das Visitas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.visitasAgendadas}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{loading ? '...' : stats.visitasEmCurso}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{loading ? '...' : stats.visitasFinalizadas}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{loading ? '...' : stats.visitasCanceladas}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Visitas por Dia */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Visitas na Última Semana
                </CardTitle>
                <CardDescription>
                  Distribuição de visitas por dia da semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Visitas" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Acesso Rápido Portaria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Acesso Rápido
                </CardTitle>
                <CardDescription>
                  Ações mais utilizadas na portaria
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                <Button 
                  variant="default"
                  onClick={() => router.push('/dashboard/visitas/novo')}
                  className="justify-start"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nova Visita
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard/visitas')}
                  className="justify-start"
                >
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Ver Visitas
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard/pessoas')}
                  className="justify-start"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Gerir Visitantes
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => router.push('/dashboard/pertences')}
                  className="justify-start"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Ver Pertences
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
                  <Bell className="h-5 w-5" />
                  Informações da Portaria
                </CardTitle>
                <CardDescription>
                  Dados relevantes para a portaria
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
                  <Badge variant="default">Portaria</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Visitas Em Curso:</span>
                  <span className="text-sm font-semibold text-yellow-600">{stats.visitasEmCurso}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Última Atualização:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sistema de Notificações em Tempo Real */}
        {newNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={dismissToast}
            onView={markAsViewed}
            onProcess={markAsProcessed}
            autoClose={true}
            duration={8000}
          />
        ))}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
