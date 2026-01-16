'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  User, 
  Calendar, 
  MapPin, 
  Zap, 
  Activity, 
  TrendingUp, 
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  Info,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Download,
  Star,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash2,
  Archive,
  Flag
} from 'lucide-react';
import { useNotifications } from '@/services/notificationService';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, pendingCount, markAsViewed, markAsProcessed, setCurrentUser } = useNotifications();
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgencia, setFilterUrgencia] = useState('todas');
  const [filterStatus, setFilterStatus] = useState('todas');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  // Atualizar usuário atual no serviço de notificações
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    }
  }, [user?.id, user?.role, user?.orgao?.id, setCurrentUser]);

  // Verificar se o usuário deve ver notificações
  const shouldShowNotifications = user?.role === 'portaria' && 
    (user.orgao?.nome === 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL' ||
     user.orgao?.nome?.includes('SEGURANÇA INSTITUCIONAL'));

  // Só mostrar para usuários de portaria do DSI
  if (!shouldShowNotifications) {
    return (
      <Card className="w-full max-w-6xl border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-500">
              Este centro de notificações é exclusivo para usuários de portaria do Departamento de Segurança Institucional (DSI).
            </p>
            {user?.role === 'portaria' && (
              <p className="text-sm text-orange-600 mt-2">
                Seu órgão atual: {user.orgao?.nome || 'Não definido'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.nome_pessoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.orgao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgencia = filterUrgencia === 'todas' || notification.urgencia === filterUrgencia;
    const matchesStatus = filterStatus === 'todas' || notification.status === filterStatus;
    
    return matchesSearch && matchesUrgencia && matchesStatus;
  });

  const pendingNotifications = filteredNotifications.filter(n => n.status === 'pendente');
  const displayedNotifications = showAll ? filteredNotifications : pendingNotifications;

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'secondary';
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />;
      case 'media': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-4 w-4 text-orange-500 animate-pulse" />;
      case 'visualizada': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'processada': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const handleMarkAsViewed = (id: string) => {
    markAsViewed(id);
    toast.success('Notificação marcada como visualizada');
  };

  const handleMarkAsProcessed = (id: string) => {
    markAsProcessed(id);
    toast.success('Notificação marcada como processada');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Notificações atualizadas');
    }, 1000);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedNotifications);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNotifications(newExpanded);
  };

  const toggleSelected = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const selectAll = () => {
    if (selectedNotifications.size === displayedNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(displayedNotifications.map(n => n.id)));
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <Card className="w-full max-w-6xl border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-900/20">
      {/* Header Moderno */}
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
          Centro de Notificações DSI
          {pendingCount > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
              {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
              <p className="text-blue-100 text-sm mt-1">
                Sistema de alertas e notificações em tempo real
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Barra de Filtros e Busca */}
        <div className="mb-6 space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, órgão ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterUrgencia}
                onChange={(e) => setFilterUrgencia(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="todas">Todas as urgências</option>
                <option value="alta">Alta urgência</option>
                <option value="media">Média urgência</option>
                <option value="baixa">Baixa urgência</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="todas">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="visualizada">Visualizadas</option>
                <option value="processada">Processadas</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={showAll ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAll(false)}
                className="flex items-center gap-2"
          >
                <Zap className="h-4 w-4" />
            Pendentes ({pendingNotifications.length})
          </Button>
          <Button
            variant={showAll ? "outline" : "default"}
            size="sm"
            onClick={() => setShowAll(true)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Todas ({filteredNotifications.length})
              </Button>
            </div>
          </div>

          {/* Seleção em lote */}
          {displayedNotifications.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="flex items-center gap-2"
              >
                {selectedNotifications.size === displayedNotifications.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedNotifications.size === displayedNotifications.length ? 'Desmarcar todas' : 'Selecionar todas'}
              </Button>
              
              {selectedNotifications.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.size} selecionada{selectedNotifications.size > 1 ? 's' : ''}
                  </span>
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-1" />
                    Arquivar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
          </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lista de Notificações */}
        {displayedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Bell className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {showAll ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação pendente'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterUrgencia !== 'todas' || filterStatus !== 'todas' 
                ? 'Tente ajustar os filtros de busca'
                : 'Novas notificações aparecerão aqui quando chegarem'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNotifications.map((notification) => {
              const isExpanded = expandedNotifications.has(notification.id);
              const isSelected = selectedNotifications.has(notification.id);
              
              return (
                <Card 
                  key={notification.id} 
                  className={cn(
                    "border-l-4 transition-all duration-300 hover:shadow-lg cursor-pointer group",
                    notification.status === 'pendente' ? 'border-l-orange-500 bg-orange-50/50' :
                    notification.status === 'visualizada' ? 'border-l-blue-500 bg-blue-50/50' :
                    'border-l-green-500 bg-green-50/50',
                    isSelected && "ring-2 ring-blue-500 bg-blue-50",
                    isExpanded && "shadow-xl scale-[1.02]"
                  )}
                  onClick={() => toggleExpanded(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox de seleção */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelected(notification.id);
                        }}
                        className="mt-1 p-1 hover:bg-gray-100 rounded"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Square className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      {/* Ícones de status */}
                      <div className="flex flex-col items-center gap-2 mt-1">
                        {getUrgenciaIcon(notification.urgencia)}
                        {getStatusIcon(notification.status)}
                      </div>
                      
                      {/* Conteúdo principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={getUrgenciaColor(notification.urgencia)} className="text-xs">
                                {notification.urgencia.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {notification.status.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(notification.data_envio)}
                              </span>
                            </div>
                            
                            <h4 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                        Notificação de Visita - {notification.nome_pessoa}
                      </h4>
                      
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span><strong>Data:</strong> {notification.data_visita}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span><strong>Hora:</strong> {notification.hora_visita}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-gray-500" />
                          <span><strong>Enviado por:</strong> {notification.enviado_por}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span><strong>Órgão:</strong> {notification.orgao}</span>
                        </div>
                            </div>
                          </div>

                          {/* Botão de expandir */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(notification.id);
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                      </div>
                      
                        {/* Conteúdo expandido */}
                        {isExpanded && (
                          <div className="space-y-4 pt-4 border-t border-gray-200">
                      {notification.observacoes && (
                              <Alert className="bg-blue-50 border-blue-200">
                                <MessageSquare className="h-4 w-4 text-blue-600" />
                          <AlertDescription>
                            <strong>Observações:</strong> {notification.observacoes}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Enviado em: {formatDateTime(notification.data_envio)}</span>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Bookmark className="h-3 w-3 mr-1" />
                                  Salvar
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Abrir
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                    
                      {/* Ações */}
                    <div className="flex flex-col gap-2 ml-4">
                      {notification.status === 'pendente' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsViewed(notification.id);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsProcessed(notification.id);
                              }}
                              className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-3 w-3" />
                            Processar
                          </Button>
                        </>
                      )}
                      {notification.status === 'visualizada' && (
                        <Button
                          size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsProcessed(notification.id);
                            }}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                          Processar
                        </Button>
                      )}
                        {notification.status === 'processada' && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-3 w-3" />
                            Processada
                          </div>
                        )}
                      </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}