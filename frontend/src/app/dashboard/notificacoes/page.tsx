'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  Bell,
  Plus,
  Search,
  Filter,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  FileText,
  Send,
  RefreshCw,
  Download,
  MoreVertical,
  User,
  Building,
  Phone,
  Mail,
  Shield,
  Edit
} from 'lucide-react';

import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useAuth } from '@/lib/auth';
import { useNotifications, DSINotification } from '@/services/notificationService';
import { notificationCrudService, CreateNotificationData, UpdateNotificationData } from '@/services/notificationCrudService';
import { EditNotificationModal } from '@/components/notifications/EditNotificationModal';

// Esquema de validação com Zod
const notificationSchema = z.object({
  nome_pessoa: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  data_visita: z.string().min(1, 'Data da visita é obrigatória'),
  hora_visita: z.string().min(1, 'Hora da visita é obrigatória'),
  observacoes: z.string().optional(),
  urgencia: z.enum(['baixa', 'media', 'alta'], { message: 'Nível de urgência é obrigatório' }),
  visitante_id: z.string().optional(),
  visita_id: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

// Função utilitária para extrair mensagem de erro de forma segura
function extractErrorMessage(error: any, response?: Response): string {
  
  // Se é string, retorna diretamente
  if (typeof error === 'string') {
    return error;
  }
  
  // Se é objeto vazio ou null/undefined
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    if (response) {
      return `Erro ${response.status}: ${response.statusText || 'Erro na API'}`;
    }
    return 'Erro desconhecido';
  }
  
  // Se é objeto com propriedades
  if (typeof error === 'object') {
    // Tentar diferentes propriedades comuns de erro
    const possibleMessages = [
      error.detail,
      error.message,
      error.error,
      error.description,
      error.reason
    ];
    
    for (const msg of possibleMessages) {
      if (msg && typeof msg === 'string' && msg.trim()) {
        return msg;
      }
    }
    
    // Se tem status, usar isso
    if (error.status) {
      return `Erro ${error.status}: ${error.statusText || 'Erro na API'}`;
    }
    
    // Se nada funcionou, serializar o objeto
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido';
    }
  }
  
  return 'Erro desconhecido';
}

// Função utilitária para fazer requisições HTTP seguras
// Resolve o problema "Body has already been consumed" ao ler o corpo da resposta apenas uma vez
async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      try {
        const data = await response.json();
        return { success: true, data, response };
      } catch (jsonError) {
        const text = await response.text();
        return { success: true, data: text, response };
      }
    } else {
      try {
        const errorData = await response.json();
        return { 
          success: false, 
          error: {
            ...errorData,
            status: response.status,
            statusText: response.statusText,
            url: response.url
          }, 
          response 
        };
      } catch (jsonError) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: { 
            message: errorText, 
            status: response.status, 
            statusText: response.statusText,
            url: response.url,
            jsonError: jsonError instanceof Error ? jsonError.message : 'Erro de parsing JSON'
          }, 
          response 
        };
      }
    }
  } catch (networkError) {
    return { 
      success: false, 
      error: { 
        message: 'Erro de rede', 
        details: networkError instanceof Error ? networkError.message : 'Erro desconhecido' 
      }, 
      response: null 
    };
  }
}

export default function NotificacoesPage() {
  const { user } = useAuth();
  const { notifications, pendingCount, connectionStatus, refreshNotifications } = useNotifications();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendente' | 'visualizada' | 'processada'>('all');
  const [filterUrgencia, setFilterUrgencia] = useState<'all' | 'baixa' | 'media' | 'alta'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<DSINotification | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
  });

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleCreate = async (data: NotificationFormData) => {
    try {
      
      // Preparar dados para criação
      const createData: CreateNotificationData = {
        nome_pessoa: data.nome_pessoa,
        data_visita: data.data_visita,
        hora_visita: data.hora_visita,
        observacoes: data.observacoes || '',
        urgencia: data.urgencia,
        visitante_id: data.visitante_id ? parseInt(data.visitante_id) : undefined,
        orgao_id: user?.orgao?.id !== undefined ? Number(user.orgao!.id) : undefined
      };

      const result = await notificationCrudService.create(createData);

      if (result.success) {
        toast.success('Notificação enviada com sucesso ao DSI!');
        setIsCreateModalOpen(false);
        reset();
        
        // Recarregar notificações
        await refreshNotifications();
      } else {
        toast.error(`Erro ao enviar notificação: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao enviar notificação. Verifique sua conexão.');
    }
  };

  const openViewModal = (notification: DSINotification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const openEditModal = (notification: DSINotification) => {
    setSelectedNotification(notification);
    setIsEditModalOpen(true);
  };

  const markAsRead = async (notification: DSINotification) => {
    try {
      const result = await notificationCrudService.markAsViewed(notification.id);
      if (result.success) {
        toast.success('Notificação marcada como lida');
        await refreshNotifications();
      } else {
        toast.error(`Erro ao marcar como lida: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const markAsProcessed = async (notification: DSINotification) => {
    try {
      const result = await notificationCrudService.markAsProcessed(notification.id);
      if (result.success) {
        toast.success('Notificação marcada como processada');
        await refreshNotifications();
      } else {
        toast.error(`Erro ao marcar como processada: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao marcar notificação como processada');
    }
  };

  const deleteNotification = async (notification: DSINotification) => {
    if (!confirm(`Tem certeza que deseja excluir a notificação de "${notification.nome_pessoa}"?`)) {
      return;
    }

    try {
      const result = await notificationCrudService.delete(notification.id);
      if (result.success) {
        toast.success('Notificação excluída com sucesso');
        await refreshNotifications();
      } else {
        toast.error(`Erro ao excluir: ${result.error}`);
      }
    } catch (error) {
      toast.error('Erro ao excluir notificação');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesSearch = notification.nome_pessoa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.observacoes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.enviado_por.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.orgao.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || notification.status === filterStatus;
      const matchesUrgencia = filterUrgencia === 'all' || notification.urgencia === filterUrgencia;

      const notificationDate = new Date(notification.data_envio);
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const matchesDate = filterDate === 'all' ||
        (filterDate === 'today' && notificationDate.toDateString() === today.toDateString()) ||
        (filterDate === 'week' && notificationDate >= weekAgo) ||
        (filterDate === 'month' && notificationDate >= monthAgo);

      return matchesSearch && matchesStatus && matchesUrgencia && matchesDate;
    });
  }, [notifications, searchTerm, filterStatus, filterUrgencia, filterDate]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = notifications.length;
    const pendentes = notifications.filter(n => n.status === 'pendente').length;
    const visualizadas = notifications.filter(n => n.status === 'visualizada').length;
    const processadas = notifications.filter(n => n.status === 'processada').length;
    const altaUrgencia = notifications.filter(n => n.urgencia === 'alta').length;

    return { total, pendentes, visualizadas, processadas, altaUrgencia };
  }, [notifications]);

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
      case 'alta': return <AlertTriangle className="h-3 w-3" />;
      case 'media': return <Clock className="h-3 w-3" />;
      case 'baixa': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'default';
      case 'visualizada': return 'secondary';
      case 'processada': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="h-3 w-3" />;
      case 'visualizada': return <Eye className="h-3 w-3" />;
      case 'processada': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="flex flex-col items-center gap-4">
              <Bell className="h-12 w-12 text-primary animate-pulse" />
              <span className="text-xl text-muted-foreground">Carregando Notificações...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Bell className="h-8 w-8" />
                Notificações DSI
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Gerencie notificações enviadas ao Departamento de Segurança Institucional
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${connectionStatus.isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {connectionStatus.isWebSocketConnected ? 'Conectado' : 'Desconectado'}
              </div>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    await refreshNotifications();
                    toast.success('Notificações recarregadas com sucesso!');
                  } catch (error) {
                    toast.error('Erro ao recarregar notificações');
                  }
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recarregar
              </Button>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Notificação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Enviar Notificação ao DSI
                    </DialogTitle>
                    <DialogDescription>
                      Preencha os dados da visita que será notificada ao Departamento de Segurança Institucional
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="nome_pessoa">Nome da Pessoa ou Pessoas *</Label>
                        <Input
                          id="nome_pessoa"
                          placeholder="Ex: João Silva Santos, Maria Fernandes..."
                          {...register('nome_pessoa')}
                        />
                        {errors.nome_pessoa && (
                          <p className="text-sm text-red-600">{errors.nome_pessoa.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="data_visita">Data Prevista *</Label>
                        <Input
                          id="data_visita"
                          type="date"
                          {...register('data_visita')}
                        />
                        {errors.data_visita && (
                          <p className="text-sm text-red-600">{errors.data_visita.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="hora_visita">Hora Prevista *</Label>
                        <Input
                          id="hora_visita"
                          type="time"
                          {...register('hora_visita')}
                        />
                        {errors.hora_visita && (
                          <p className="text-sm text-red-600">{errors.hora_visita.message}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="urgencia">Nível de Urgência *</Label>
                        <Select onValueChange={(value) => setValue('urgencia', value as 'baixa' | 'media' | 'alta')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o nível de urgência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixa">🟢 Baixa - Visita de rotina</SelectItem>
                            <SelectItem value="media">🟡 Média - Visita importante</SelectItem>
                            <SelectItem value="alta">🔴 Alta - Visita urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.urgencia && (
                          <p className="text-sm text-red-600">{errors.urgencia.message}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="observacoes">Observações Adicionais</Label>
                        <Textarea
                          id="observacoes"
                          placeholder="Informações adicionais sobre a visita, motivo, documentos necessários, etc."
                          rows={4}
                          {...register('observacoes')}
                        />
                      </div>
                    </div>
                    
                    {/* Informações do Remetente */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Informações do Remetente</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <div><strong>Usuário:</strong> {user?.username}</div>
                            <div><strong>Órgão:</strong> {user?.orgao?.nome || 'Órgão não informado'}</div>
                            <div><strong>Data/Hora:</strong> {new Date().toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Notificação
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendentes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Visualizadas</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.visualizadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.processadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alta Urgência</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.altaUrgencia}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre as notificações por status, urgência ou período.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Buscar por nome, observações, remetente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="col-span-full md:col-span-2"
                />
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="visualizada">Visualizada</SelectItem>
                    <SelectItem value="processada">Processada</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterUrgencia} onValueChange={(value: any) => setFilterUrgencia(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Urgência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Urgências</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterDate} onValueChange={(value: any) => setFilterDate(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta Semana</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Notificações</CardTitle>
              <CardDescription>
                {filteredNotifications.length} notificação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pessoa</TableHead>
                      <TableHead>Data/Hora Visita</TableHead>
                      <TableHead>Urgência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remetente</TableHead>
                      <TableHead>Data Envio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">Nenhuma notificação encontrada.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <TableRow key={notification.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {notification.nome_pessoa}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{new Date(notification.data_visita).toLocaleDateString('pt-BR')}</div>
                                <div className="text-sm text-muted-foreground">{notification.hora_visita}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getUrgenciaColor(notification.urgencia)} className="flex items-center gap-1 w-fit">
                              {getUrgenciaIcon(notification.urgencia)}
                              {notification.urgencia.charAt(0).toUpperCase() + notification.urgencia.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(notification.status)} className="flex items-center gap-1 w-fit">
                              {getStatusIcon(notification.status)}
                              {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{notification.enviado_por}</div>
                                <div className="text-sm text-muted-foreground">{notification.orgao}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(notification.data_envio).toLocaleDateString('pt-BR')}
                              <div className="text-muted-foreground">
                                {new Date(notification.data_envio).toLocaleTimeString('pt-BR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openViewModal(notification)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditModal(notification)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => markAsRead(notification)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Marcar como Lida
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => markAsProcessed(notification)}>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Marcar como Processada
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Download className="w-4 h-4 mr-2" />
                                    Exportar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteNotification(notification)}
                                    className="text-red-600 focus:text-red-600"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Visualização */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Detalhes da Notificação
                </DialogTitle>
              </DialogHeader>
              {selectedNotification && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold">Nome da Pessoa</Label>
                      <p className="text-gray-700">{selectedNotification.nome_pessoa}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Data da Visita</Label>
                      <p className="text-gray-700">{new Date(selectedNotification.data_visita).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Hora da Visita</Label>
                      <p className="text-gray-700">{selectedNotification.hora_visita}</p>
                    </div>
                    <div>
                      <Label className="font-semibold">Urgência</Label>
                      <div className="mt-1">
                        <Badge variant={getUrgenciaColor(selectedNotification.urgencia)} className="flex items-center gap-1 w-fit">
                          {getUrgenciaIcon(selectedNotification.urgencia)}
                          {selectedNotification.urgencia.charAt(0).toUpperCase() + selectedNotification.urgencia.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Status</Label>
                      <div className="mt-1">
                        <Badge variant={getStatusColor(selectedNotification.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(selectedNotification.status)}
                          {selectedNotification.status.charAt(0).toUpperCase() + selectedNotification.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="font-semibold">Data de Envio</Label>
                      <p className="text-gray-700">{new Date(selectedNotification.data_envio).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200" />
                  
                  <div>
                    <Label className="font-semibold">Remetente</Label>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedNotification.enviado_por}</div>
                          <div className="text-sm text-gray-600">{selectedNotification.orgao}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedNotification.observacoes && (
                    <div>
                      <Label className="font-semibold">Observações</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">{selectedNotification.observacoes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button onClick={() => markAsRead(selectedNotification)}>
                      <Eye className="w-4 h-4 mr-2" />
                      Marcar como Lida
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Modal de Edição */}
          <EditNotificationModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            notification={selectedNotification}
            onSuccess={async () => {
              await refreshNotifications();
            }}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}