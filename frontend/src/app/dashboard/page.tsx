'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
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
  Settings,
  FileText,
  Bell,
  Activity
} from 'lucide-react';
import { getVisitas } from '@/services/visitaService';
import { getVisitantes } from '@/services/pessoaService';
import { getPertences } from '@/services/pertenceService';
import { getOrgaos } from '@/services/orgaoService';
import { getEfetivos } from '@/services/efetivoService';
import { Visita } from '@/types/visita';
import { Visitante } from '@/types/pessoa';
import { Pertence } from '@/types/pertence';
import { Orgao } from '@/types/orgao';
import { Efetivo } from '@/types/efetivo';
import { useAuth } from '@/lib/auth';
import NotificationCenter from '@/components/notifications/NotificationCenter';
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

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirecionar automaticamente para o dashboard específico do role
  useEffect(() => {
    if (user?.role) {
      const userRole = user.role;
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
        default:
          dashboardPath = '/dashboard';
      }
      
      if (dashboardPath !== '/dashboard') {
        console.log('🔄 Redirecionando para dashboard específico:', dashboardPath);
        router.replace(dashboardPath);
      }
    }
  }, [user, router]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitantes, setVisitantes] = useState<Visitante[]>([]);
  const [pertences, setPertences] = useState<Pertence[]>([]);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [efetivos, setEfetivos] = useState<Efetivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        if (user?.role === 'recepcao') {
          // Usuários de Recepção têm acesso limitado
          const [p, pe, o] = await Promise.all([
            getVisitantes(),
            getPertences(),
            getOrgaos(),
          ]);
          setVisitas([]);
          setVisitantes(p);
          setPertences(pe);
          setOrgaos(o);
          setEfetivos([]);
        } else {
          // Outros usuários têm acesso completo
          const [v, p, pe, o, e] = await Promise.all([
            getVisitas(),
            getVisitantes(),
            getPertences(),
            getOrgaos(),
            getEfetivos(),
          ]);
          setVisitas(v);
          setVisitantes(p);
          setPertences(pe);
          setOrgaos(o);
          setEfetivos(e);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [user]);

  // Estatísticas principais
  const visitasHoje = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.data_hora_entrada && isHoje(v.data_hora_entrada)).length : 0);
  const visitasEstaSemana = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.data_hora_entrada && isEstaSemana(v.data_hora_entrada)).length : 0);
  const totalVisitantes = Array.isArray(visitantes) ? visitantes.filter(v => v.ativo !== false).length : 0;
  const totalPertences = Array.isArray(pertences) ? pertences.length : 0;
  const totalOrgaos = Array.isArray(orgaos) ? orgaos.length : 0;
  const totalEfetivos = Array.isArray(efetivos) ? efetivos.filter(e => e.ativo !== false).length : 0;

  // Estatísticas de visitas por estado
  const visitasAgendadas = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.estado === 'agendada').length : 0);
  const visitasEmCurso = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.estado === 'em_curso').length : 0);
  const visitasFinalizadas = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.estado === 'concluida').length : 0);
  const visitasCanceladas = user?.role === 'recepcao' ? 0 : (Array.isArray(visitas) ? visitas.filter(v => v.estado === 'cancelada').length : 0);

  // Dados para gráficos
  const hoje = new Date();
  const dias = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - (6 - i));
    return d;
  });

  const chartData = user?.role === 'recepcao' ? [] : dias.map((d) => {
    const nome = diasSemana[d.getDay()];
    const count = visitas.filter(v => {
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

  const estadoData = user?.role === 'recepcao' ? [] : [
    { name: 'Agendadas', value: visitasAgendadas, color: '#3b82f6' },
    { name: 'Em Curso', value: visitasEmCurso, color: '#f59e0b' },
    { name: 'Finalizadas', value: visitasFinalizadas, color: '#10b981' },
    { name: 'Canceladas', value: visitasCanceladas, color: '#ef4444' },
  ].filter(item => item.value > 0);

  // Função para obter ações rápidas baseadas no perfil
  const getQuickActions = () => {
    const actions = [];
    
    if (user?.role === 'recepcao') {
      actions.push(
        { label: 'Notificar o DSI', icon: Bell, href: '/dashboard/notificacoes', variant: 'default' as const },
        { label: 'Ver Visitantes', icon: Users, href: '/dashboard/pessoas', variant: 'secondary' as const },
        { label: 'Ver Pertences', icon: Briefcase, href: '/dashboard/pertences', variant: 'secondary' as const },
      );
    } else {
      actions.push(
        { label: 'Nova Visita', icon: PlusCircle, href: '/dashboard/visitas/novo', variant: 'default' as const },
        { label: 'Gerir Visitantes', icon: Users, href: '/dashboard/pessoas', variant: 'secondary' as const },
        { label: 'Ver Pertences', icon: Briefcase, href: '/dashboard/pertences', variant: 'secondary' as const },
        { label: 'Gerir Órgãos', icon: Building2, href: '/dashboard/orgaos', variant: 'secondary' as const },
      );
      
      if (user?.role === 'admin') {
        actions.push(
          { label: 'Gerir Usuários', icon: UserCheck, href: '/dashboard/usuarios', variant: 'secondary' as const },
          { label: 'Configurações', icon: Settings, href: '/dashboard/configuracoes', variant: 'secondary' as const },
        );
      }
    }
    
    return actions;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <Activity className="h-8 w-8" />
                  Dashboard
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Visão geral do sistema de controle de acesso
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  {user?.role === 'admin' ? 'Administrador' : 
                   user?.role === 'portaria' ? 'Portaria' : 
                   user?.role === 'recepcao' ? 'Recepção' : 
                   'Usuário'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Centro de Notificações para Portaria */}
          {user?.role === 'portaria' && (
            <NotificationCenter />
          )}

          {/* Cards de Estatísticas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visitas Hoje</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{loading ? '...' : visitasHoje}</div>
                <p className="text-xs text-muted-foreground">
                  {visitasEstaSemana} esta semana
                </p>
              </CardContent>
            </Card>
            
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
                <CardTitle className="text-sm font-medium">Pertences</CardTitle>
                <Briefcase className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{loading ? '...' : totalPertences}</div>
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
                <div className="text-2xl font-bold text-purple-600">{loading ? '...' : totalOrgaos}</div>
                <p className="text-xs text-muted-foreground">
                  {totalEfetivos} efetivos ativos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cards de Status das Visitas (apenas para usuários que podem ver visitas) */}
          {user?.role !== 'recepcao' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{loading ? '...' : visitasAgendadas}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{loading ? '...' : visitasEmCurso}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{loading ? '...' : visitasFinalizadas}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{loading ? '...' : visitasCanceladas}</div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Visitas por Dia */}
            {user?.role !== 'recepcao' && (
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
            )}

            {/* Gráfico de Status das Visitas */}
            {user?.role !== 'recepcao' && estadoData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Status das Visitas
                  </CardTitle>
                  <CardDescription>
                    Distribuição por estado atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {estadoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Acesso Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Acesso Rápido
                </CardTitle>
                <CardDescription>
                  Ações mais utilizadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col space-y-3">
                {getQuickActions().map((action, index) => (
                  <Button 
                    key={index}
                    variant={action.variant}
                    onClick={() => router.push(action.href)}
                    className="justify-start"
                  >
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Informações do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Informações do Sistema
                </CardTitle>
                <CardDescription>
                  Dados gerais do sistema
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
                  <Badge variant="secondary">
                    {user?.role === 'admin' ? 'Administrador' : 
                     user?.role === 'portaria' ? 'Portaria' : 
                     user?.role === 'recepcao' ? 'Recepção' : 
                     'Usuário'}
                  </Badge>
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
      </DashboardLayout>
    </ProtectedRoute>
  );
}