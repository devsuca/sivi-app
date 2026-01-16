'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SupportSidebar from '@/components/support/SupportSidebar';
import SupportRouteGuard from '@/components/support/SupportRouteGuard';
import { getTickets, getTicketStats, updateTicket, assignTicket, closeTicket, addComment, createTicket, Ticket, TicketFilters, TicketListResponse } from '@/services/ticketService';
import { getUsuarios } from '@/services/usuarioService';
import { 
  Ticket as TicketIcon, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Calendar,
  ArrowUpDown,
  RefreshCw,
  UserPlus,
  X,
  Send
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [filters, setFilters] = useState<TicketFilters>({
    status: searchParams.get('status') || undefined,
    prioridade: searchParams.get('prioridade') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    page: 1,
    page_size: 20
  });
  const [sortBy, setSortBy] = useState<string>('data_criacao');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Estados para modais
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [commentingTicket, setCommentingTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  
  // Estados para modal de novo ticket
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'média' as 'baixa' | 'média' | 'alta' | 'urgente',
    categoria: 'geral'
  });
  
  // Estados de loading para operações
  const [loadingOperations, setLoadingOperations] = useState<{
    editing: boolean;
    commenting: boolean;
    assigning: boolean;
    closing: boolean;
    creating: boolean;
  }>({
    editing: false,
    commenting: false,
    assigning: false,
    closing: false,
    creating: false
  });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentFilters = {
        ...filters,
        search: searchTerm || undefined
      };
      
      const data = await getTickets(currentFilters);
      setTickets(data.results);
      
      // Atualizar informações de paginação
      const totalPages = Math.ceil(data.count / (filters.page_size || 20));
      setPagination({
        currentPage: filters.page || 1,
        totalPages,
        totalItems: data.count,
        itemsPerPage: filters.page_size || 20
      });
    } catch (err: any) {
      console.error('Erro ao buscar tickets:', err);
      setError('Erro ao carregar tickets. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getTicketStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      toast.error('Erro ao carregar lista de usuários');
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, [filters, searchTerm]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setFilters(prev => ({ ...prev, page: 1, page_size: itemsPerPage }));
  };

  // Funções para ações dos botões
  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsEditModalOpen(true);
  };

  const handleCommentTicket = (ticket: Ticket) => {
    setCommentingTicket(ticket);
    setIsCommentModalOpen(true);
  };

  const handleAssignTicket = (ticket: Ticket) => {
    setAssigningTicket(ticket);
    setIsAssignModalOpen(true);
    fetchUsuarios(); // Buscar usuários quando abrir o modal
  };

  const handleCloseTicket = async (ticket: Ticket) => {
    if (confirm(`Tem certeza que deseja fechar o ticket #${ticket.numero}?`)) {
      try {
        setLoadingOperations(prev => ({ ...prev, closing: true }));
        await closeTicket(ticket.id);
        await fetchTickets();
        toast.success('Ticket fechado com sucesso!');
      } catch (error: any) {
        console.error('Erro ao fechar ticket:', error);
        
        // Tratar diferentes tipos de erro
        if (error.isHtmlResponse) {
          toast.error(error.message || 'Erro no servidor. Verifique se o backend está rodando corretamente.');
        } else if (error.response?.status === 404) {
          toast.error('Ticket não encontrado.');
        } else if (error.response?.status === 403) {
          toast.error('Você não tem permissão para fechar este ticket.');
        } else if (error.response?.status === 401) {
          toast.error('Não autorizado. Faça login novamente.');
        } else {
          toast.error('Erro ao fechar ticket. Tente novamente.');
        }
      } finally {
        setLoadingOperations(prev => ({ ...prev, closing: false }));
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTicket) return;
    
    // Validação
    if (!editingTicket.titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    if (!editingTicket.descricao.trim()) {
      toast.error('A descrição é obrigatória');
      return;
    }
    
    try {
      setLoadingOperations(prev => ({ ...prev, editing: true }));
      await updateTicket(editingTicket.id, {
        titulo: editingTicket.titulo.trim(),
        descricao: editingTicket.descricao.trim(),
        status: editingTicket.status,
        prioridade: editingTicket.prioridade,
        categoria: editingTicket.categoria
      });
      await fetchTickets();
      setIsEditModalOpen(false);
      setEditingTicket(null);
      toast.success('Ticket atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast.error('Erro ao atualizar ticket. Tente novamente.');
    } finally {
      setLoadingOperations(prev => ({ ...prev, editing: false }));
    }
  };

  const handleAddComment = async () => {
    if (!commentingTicket || !newComment.trim()) return;
    
    try {
      setLoadingOperations(prev => ({ ...prev, commenting: true }));
      await addComment(commentingTicket.id, newComment);
      setNewComment('');
      setIsCommentModalOpen(false);
      setCommentingTicket(null);
      toast.success('Comentário adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário. Tente novamente.');
    } finally {
      setLoadingOperations(prev => ({ ...prev, commenting: false }));
    }
  };

  const handleAssignToUser = async () => {
    if (!assigningTicket || !selectedUserId) return;
    
    try {
      setLoadingOperations(prev => ({ ...prev, assigning: true }));
      await assignTicket(assigningTicket.id, selectedUserId);
      await fetchTickets();
      setIsAssignModalOpen(false);
      setAssigningTicket(null);
      setSelectedUserId(null);
      toast.success('Ticket atribuído com sucesso!');
    } catch (error) {
      console.error('Erro ao atribuir ticket:', error);
      toast.error('Erro ao atribuir ticket. Tente novamente.');
    } finally {
      setLoadingOperations(prev => ({ ...prev, assigning: false }));
    }
  };

  const handleCreateTicket = async () => {
    // Validação
    if (!newTicketForm.titulo.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    if (!newTicketForm.descricao.trim()) {
      toast.error('A descrição é obrigatória');
      return;
    }
    
    try {
      setLoadingOperations(prev => ({ ...prev, creating: true }));
      await createTicket({
        titulo: newTicketForm.titulo.trim(),
        descricao: newTicketForm.descricao.trim(),
        prioridade: newTicketForm.prioridade,
        categoria: newTicketForm.categoria,
        status: 'aberto'
      });
      await fetchTickets();
      setIsNewTicketModalOpen(false);
      setNewTicketForm({
        titulo: '',
        descricao: '',
        prioridade: 'média',
        categoria: 'geral'
      });
      toast.success('Ticket criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar ticket. Tente novamente.');
    } finally {
      setLoadingOperations(prev => ({ ...prev, creating: false }));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300';
      case 'alta': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300';
      case 'média': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberto': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'fechado': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberto': return <AlertCircle className="h-4 w-4" />;
      case 'em_andamento': return <Clock className="h-4 w-4" />;
      case 'fechado': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let aValue = a[sortBy as keyof Ticket];
    let bValue = b[sortBy as keyof Ticket];
    
    if (sortBy === 'data_criacao' || sortBy === 'data_atualizacao') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
      if (sortOrder === 'asc') {
        return (aValue ?? 0) > (bValue ?? 0) ? 1 : -1;
      } else {
        return (aValue ?? 0) < (bValue ?? 0) ? 1 : -1;
      }

  });

  return (
    <SupportRouteGuard>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <SupportSidebar ticketStats={stats} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Gestão de Tickets
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Visualize e gerencie todos os tickets de suporte
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={fetchTickets} 
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                <Button onClick={() => setIsNewTicketModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Ticket
                </Button>
              </div>
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

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar tickets por número, título ou usuário..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <select
                      value={filters.status || 'all'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        status: e.target.value === 'all' ? undefined : e.target.value 
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="aberto">Aberto</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="fechado">Fechado</option>
                    </select>

                    <select
                      value={filters.prioridade || 'all'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        prioridade: e.target.value === 'all' ? undefined : e.target.value 
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="all">Todas as Prioridades</option>
                      <option value="urgente">Urgente</option>
                      <option value="alta">Alta</option>
                      <option value="média">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>

                    <select
                      value={filters.categoria || 'all'}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        categoria: e.target.value === 'all' ? undefined : e.target.value 
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="all">Todas as Categorias</option>
                      <option value="geral">Geral</option>
                      <option value="tecnico">Técnico</option>
                      <option value="usuario">Gestão de Usuário</option>
                      <option value="sistema">Problema no Sistema</option>
                      <option value="seguranca">Segurança</option>
                      <option value="melhoria">Sugestão de Melhoria</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TicketIcon className="h-5 w-5 mr-2" />
                  Tickets ({pagination.totalItems})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('numero')}
                              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              Ticket
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Solicitante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('status')}
                              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              Status
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('prioridade')}
                              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              Prioridade
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Atribuído
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            <button 
                              onClick={() => handleSort('data_criacao')}
                              className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200"
                            >
                              Data
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedTickets.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="text-gray-500 dark:text-gray-400">
                                <TicketIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">Nenhum ticket encontrado</p>
                                <p className="text-sm">Tente ajustar os filtros ou criar um novo ticket.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedTickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    #{ticket.numero}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs">
                                    {ticket.titulo}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {ticket.solicitante.username}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-300">
                                  {ticket.solicitante.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 w-fit`}>
                                  {getStatusIcon(ticket.status)}
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={`${getPriorityColor(ticket.prioridade)}`}>
                                  {ticket.prioridade}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {ticket.atribuido_para ? (
                                  <div className="text-sm text-gray-900 dark:text-white">
                                    {ticket.atribuido_para.username}
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-300">Não atribuído</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {formatDate(ticket.data_criacao)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <Link href={`/dashboard/suporte/tickets/${ticket.id}`}>
                                    <Button size="sm" variant="outline" title="Visualizar">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleEditTicket(ticket)}
                                    title="Editar"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleCommentTicket(ticket)}
                                    title="Comentários"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleAssignTicket(ticket)}
                                    title="Atribuir"
                                  >
                                    <UserPlus className="h-4 w-4" />
                                  </Button>
                                  {ticket.status !== 'fechado' && (
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => handleCloseTicket(ticket)}
                                      title="Fechar"
                                      disabled={loadingOperations.closing}
                                    >
                                      {loadingOperations.closing ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
              
              {/* Paginação */}
              {!loading && tickets.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ticket #{editingTicket?.numero}</DialogTitle>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Título</label>
                <Input
                  value={editingTicket.titulo}
                  onChange={(e) => setEditingTicket({...editingTicket, titulo: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <Textarea
                  value={editingTicket.descricao}
                  onChange={(e) => setEditingTicket({...editingTicket, descricao: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <Select
                    value={editingTicket.status}
                    onValueChange={(value) => setEditingTicket({...editingTicket, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prioridade</label>
                  <Select
                    value={editingTicket.prioridade}
                    onValueChange={(value) => setEditingTicket({...editingTicket, prioridade: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Categoria</label>
                  <Select
                    value={editingTicket.categoria}
                    onValueChange={(value) => setEditingTicket({...editingTicket, categoria: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="usuario">Gestão de Usuário</SelectItem>
                      <SelectItem value="sistema">Problema no Sistema</SelectItem>
                      <SelectItem value="seguranca">Segurança</SelectItem>
                      <SelectItem value="melhoria">Sugestão de Melhoria</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={loadingOperations.editing}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={loadingOperations.editing}
                >
                  {loadingOperations.editing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Comentários */}
      <Dialog open={isCommentModalOpen} onOpenChange={setIsCommentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Comentário - Ticket #{commentingTicket?.numero}</DialogTitle>
          </DialogHeader>
          {commentingTicket && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Comentário</label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Digite seu comentário..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCommentModalOpen(false)}
                  disabled={loadingOperations.commenting}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || loadingOperations.commenting}
                >
                  {loadingOperations.commenting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Atribuição */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Ticket #{assigningTicket?.numero}</DialogTitle>
          </DialogHeader>
          {assigningTicket && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Atribuir para</label>
                <Select
                  value={selectedUserId?.toString() || ''}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios.length === 0 ? (
                      <SelectItem value="" disabled>
                        Carregando usuários...
                      </SelectItem>
                    ) : (
                      usuarios.map((usuario) => (
                        <SelectItem key={usuario.id} value={usuario.id.toString()}>
                          {usuario.username} - {usuario.email}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAssignModalOpen(false)}
                  disabled={loadingOperations.assigning}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAssignToUser} 
                  disabled={!selectedUserId || loadingOperations.assigning}
                >
                  {loadingOperations.assigning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Atribuindo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Atribuir
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Novo Ticket */}
      <Dialog open={isNewTicketModalOpen} onOpenChange={setIsNewTicketModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Título</label>
              <Input
                value={newTicketForm.titulo}
                onChange={(e) => setNewTicketForm({...newTicketForm, titulo: e.target.value})}
                placeholder="Digite o título do ticket..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea
                value={newTicketForm.descricao}
                onChange={(e) => setNewTicketForm({...newTicketForm, descricao: e.target.value})}
                placeholder="Descreva o problema ou solicitação..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prioridade</label>
                <Select
                  value={newTicketForm.prioridade}
                  onValueChange={(value) => setNewTicketForm({...newTicketForm, prioridade: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Categoria</label>
                <Select
                  value={newTicketForm.categoria}
                  onValueChange={(value) => setNewTicketForm({...newTicketForm, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="usuario">Gestão de Usuário</SelectItem>
                    <SelectItem value="sistema">Problema no Sistema</SelectItem>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="melhoria">Sugestão de Melhoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsNewTicketModalOpen(false)}
                disabled={loadingOperations.creating}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleCreateTicket}
                disabled={loadingOperations.creating}
              >
                {loadingOperations.creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SupportRouteGuard>
  );
}
