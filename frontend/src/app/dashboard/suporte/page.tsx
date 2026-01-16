'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SupportSidebar from '@/components/support/SupportSidebar';
import SupportRouteGuard from '@/components/support/SupportRouteGuard';
import { getTicketStats, TicketStats } from '@/services/ticketService';
import { 
  Ticket, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  MessageSquare,
  BarChart3,
  RefreshCw,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function SupportDashboard() {
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTicketStats();
      setStats(data);
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
      
      // Tratar diferentes tipos de erro
      if (err.message && err.message.includes('HTML em vez de JSON')) {
        setError('Servidor retornou HTML em vez de JSON. Verifique se o backend está rodando corretamente.');
      } else if (err.response?.status === 404) {
        setError('Endpoint de estatísticas não encontrado. Verifique se o sistema de tickets está configurado.');
      } else if (err.response?.status === 401) {
        setError('Não autorizado. Faça login novamente.');
      } else if (err.response?.status === 500) {
        setError('Erro interno do servidor. Tente novamente mais tarde.');
      } else {
        setError('Erro ao carregar estatísticas. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total de Tickets',
      value: stats?.total || 0,
      icon: Ticket,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Tickets Abertos',
      value: stats?.abertos || 0,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      change: '+3',
      changeType: 'negative'
    },
    {
      title: 'Em Andamento',
      value: stats?.em_andamento || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      change: '-2',
      changeType: 'positive'
    },
    {
      title: 'Fechados',
      value: stats?.fechados || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+8',
      changeType: 'positive'
    }
  ];

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  return (
    <SupportRouteGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <SupportSidebar ticketStats={stats || undefined} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard de Suporte
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Visão geral do sistema de tickets
                </p>
              </div>
              <Button 
                onClick={fetchStats} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={index} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {stat.title}
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stat.value}
                              </p>
                              <div className="flex items-center mt-2">
                                <Badge 
                                  variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                                  className="text-xs"
                                >
                                  {stat.change}
                                </Badge>
                                <span className="text-xs text-gray-500 ml-2">vs. mês anterior</span>
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                              <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Quick Actions and Metrics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Ações Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Link href="/dashboard/suporte/tickets">
                        <Button className="w-full justify-start" variant="outline">
                          <Ticket className="w-4 h-4 mr-2" />
                          Ver Todos os Tickets
                        </Button>
                      </Link>
                      <Link href="/dashboard/suporte/tickets?prioridade=urgente">
                        <Button className="w-full justify-start" variant="outline">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Tickets Urgentes
                        </Button>
                      </Link>
                      <Link href="/dashboard/suporte/atribuicoes">
                        <Button className="w-full justify-start" variant="outline">
                          <Users className="w-4 h-4 mr-2" />
                          Gerenciar Atribuições
                        </Button>
                      </Link>
                      <Link href="/dashboard/suporte/relatorios">
                        <Button className="w-full justify-start" variant="outline">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Gerar Relatório
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="w-5 h-5 mr-2" />
                        Métricas do Sistema
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Tempo médio de resolução
                          </span>
                          <span className="font-semibold">
                            {stats?.tempo_medio_resolucao ? formatTime(stats.tempo_medio_resolucao) : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Tickets hoje
                          </span>
                          <span className="font-semibold">{stats?.tickets_hoje || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Tickets esta semana
                          </span>
                          <span className="font-semibold">{stats?.tickets_semana || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Taxa de resolução
                          </span>
                          <span className="font-semibold text-green-600">
                            {stats ? Math.round((stats.fechados / stats.total) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Category and Priority Distribution */}
                {stats && (stats.por_categoria || stats.por_prioridade) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    {stats.por_categoria && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Tickets por Categoria</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(stats.por_categoria).map(([categoria, count]) => (
                              <div key={categoria} className="flex justify-between items-center">
                                <span className="text-sm capitalize">{categoria}</span>
                                <Badge variant="secondary">{count}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {stats.por_prioridade && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Tickets por Prioridade</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(stats.por_prioridade).map(([prioridade, count]) => (
                              <div key={prioridade} className="flex justify-between items-center">
                                <span className="text-sm capitalize">{prioridade}</span>
                                <Badge 
                                  variant={
                                    prioridade === 'urgente' ? 'destructive' :
                                    prioridade === 'alta' ? 'destructive' :
                                    prioridade === 'média' ? 'default' : 'secondary'
                                  }
                                >
                                  {count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SupportRouteGuard>
  );
}