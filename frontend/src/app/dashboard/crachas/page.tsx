"use client";
import { Cracha } from '@/types/cracha';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getCrachas, createCracha, updateCracha, deleteCracha, getCrachaById, PaginatedResponse } from '@/services/crachaService';
import { assignCrachasToVisita } from '@/services/visitaService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  IdCard, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export default function CrachasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [crachas, setCrachas] = useState<Cracha[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedCracha, setSelectedCracha] = useState<Cracha | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  // Estados para atribuição automática de crachás
  const [visitaId, setVisitaId] = useState<string | null>(null);
  const [autoAssignMode, setAutoAssignMode] = useState(false);
  const [selectedCrachasForAssignment, setSelectedCrachasForAssignment] = useState<string[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(9);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    show: boolean;
  } | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Cracha>>();

  // Função para mostrar alertas amigáveis
  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setAlert({ type, title, message, show: true });
    setTimeout(() => {
      setAlert(null);
    }, 5000); // Auto-hide após 5 segundos
  };

  const onSubmit = async (data: Partial<Cracha>) => {
    try {
      console.log('🔄 Iniciando criação de crachá:', data);
      const createdCracha = await createCracha(data);
      console.log('✅ Crachá criado com sucesso:', createdCracha);
      setOpen(false);
      reset();
      await loadCrachas(currentPage);
      showAlert('success', '🎉 Sucesso!', 'Cartão de visita criado com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro no onSubmit:', error);
      console.error('❌ Dados que causaram o erro:', data);
      console.error('❌ Resposta completa do servidor:', error?.response?.data);
      
      let errorMessage = 'Erro ao criar cartão de visita';
      let errorTitle = '❌ Erro';
      
      if (error?.response?.status === 401) {
        errorMessage = 'Não autorizado. Faça login novamente.';
        errorTitle = '🔐 Não Autorizado';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Sem permissão para criar cartões de visita.';
        errorTitle = '🚫 Sem Permissão';
      } else if (error?.response?.status === 400) {
        errorTitle = '⚠️ Dados Inválidos';
        
        if (error?.response?.data?.numero) {
          const numeroErrors = error.response.data.numero;
          if (Array.isArray(numeroErrors)) {
            if (numeroErrors.some(err => err.includes('already exists'))) {
              errorMessage = 'Este número de cartão já existe. Tente SIC-00011, SIC-00012, etc.';
            } else {
              errorMessage = `Número inválido: ${numeroErrors.join(', ')}`;
            }
          } else {
            errorMessage = `Número inválido: ${numeroErrors}`;
          }
        } else if (error?.response?.data?.error) {
          errorMessage = `Erro: ${error.response.data.error}`;
        } else if (error?.response?.data && Object.keys(error.response.data).length > 0) {
          // Mostrar todos os erros de validação
          const validationErrors = Object.entries(error.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join(' | ');
          errorMessage = `Erros de validação: ${validationErrors}`;
        } else {
          errorMessage = 'Dados inválidos. Verifique os campos obrigatórios.';
        }
      } else if (error?.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente.';
        errorTitle = '🔥 Erro do Servidor';
      } else if (!error?.response) {
        errorMessage = 'Erro de conexão. Verifique sua internet.';
        errorTitle = '🌐 Sem Conexão';
      }
      
      showAlert('error', errorTitle, errorMessage);
    }
  };

  // Nota: Filtros serão implementados no backend em uma versão futura
  // Por enquanto, a paginação funciona com todos os dados

  const loadCrachas = async (page: number = currentPage) => {
    try {
      console.log('🔄 Carregando crachás...', { page, pageSize });
      const response: PaginatedResponse<Cracha> = await getCrachas(page, pageSize);
      console.log('✅ Crachás carregados:', response);
      
      setCrachas(response.results);
      setTotalPages(Math.ceil(response.count / pageSize));
      setTotalCount(response.count);
      setCurrentPage(page);
      setLoading(false);
    } catch (error: any) {
      console.error('❌ Erro ao carregar crachás:', error);
      toast.error('Erro ao carregar crachás. Verifique sua conexão.');
      setLoading(false);
    }
  };

  // Detectar parâmetros da URL para atribuição automática
  useEffect(() => {
    const visitaIdParam = searchParams.get('visitaId');
    const autoAssignParam = searchParams.get('autoAssign');
    
    if (visitaIdParam && autoAssignParam === 'true') {
      console.log('🎯 Modo de atribuição automática ativado para visita:', visitaIdParam);
      setVisitaId(visitaIdParam);
      setAutoAssignMode(true);
      showAlert('info', '🎯 Atribuição de Crachás', 'Selecione os crachás para atribuir à visita criada.');
    }
  }, [searchParams]);

  useEffect(() => {
    loadCrachas(1);
    // Mostrar alerta de boas-vindas apenas se não estiver em modo de atribuição
    if (!autoAssignMode) {
      setTimeout(() => {
        showAlert('info', '👋 Bem-vindo!', 'Gerencie seus cartões de visita aqui. Use os filtros para encontrar cartões específicos.');
      }, 1000);
    }
  }, [autoAssignMode]);

  // Recarregar quando o tamanho da página mudar
  useEffect(() => {
    loadCrachas(1);
  }, [pageSize]);

  // Estatísticas dos crachás (usando dados da página atual)
  const stats = {
    total: totalCount,
    livres: Array.isArray(crachas) ? crachas.filter(c => c.estado === 'livre').length : 0,
    ocupados: Array.isArray(crachas) ? crachas.filter(c => c.estado === 'ocupado').length : 0,
    inativos: Array.isArray(crachas) ? crachas.filter(c => c.estado === 'inativo').length : 0,
  };

  // Handlers para modais
  const handleOpenDetails = (cracha: Cracha) => {
    setSelectedCracha(cracha);
    setOpenDetails(true);
  };
  
  const handleOpenEdit = (cracha: Cracha) => {
    setSelectedCracha(cracha);
    setOpenEdit(true);
  };
  
  const handleOpenDelete = (cracha: Cracha) => {
    setSelectedCracha(cracha);
    setOpenDelete(true);
  };

  const handleDelete = async () => {
    if (selectedCracha) {
      try {
        await deleteCracha(selectedCracha.id);
        setOpenDelete(false);
        await loadCrachas(currentPage);
        showAlert('success', '🗑️ Excluído!', `Cartão ${selectedCracha.numero} foi excluído com sucesso!`);
      } catch {
        showAlert('error', '❌ Erro', 'Erro ao excluir cartão de visita');
      }
    }
  };

  const handleUpdate = async () => {
    setOpenEdit(false);
    await loadCrachas(currentPage);
      showAlert('success', '✅ Atualizado!', 'Cartão de visita atualizado com sucesso!');
  };

  // Função para obter cor do badge baseado no status
  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'livre':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Livre</Badge>;
      case 'ocupado':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Ocupado</Badge>;
      case 'inativo':
        return <Badge variant="default" className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Inativo</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  // Funções de navegação de paginação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadCrachas(page);
      if (page !== currentPage) {
        showAlert('info', '📄 Navegando', `Carregando página ${page} de ${totalPages}`);
      }
    }
  };

  const goToFirstPage = () => goToPage(1);
  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  const goToLastPage = () => goToPage(totalPages);

  // Funções para atribuição de crachás
  const handleCrachaSelection = (crachaId: string) => {
    setSelectedCrachasForAssignment(prev => {
      if (prev.includes(crachaId)) {
        return prev.filter(id => id !== crachaId);
      } else {
        return [...prev, crachaId];
      }
    });
  };

  const handleAssignCrachas = async () => {
    if (!visitaId || selectedCrachasForAssignment.length === 0) {
      showAlert('warning', '⚠️ Seleção Necessária', 'Selecione pelo menos um crachá para atribuir à visita.');
      return;
    }

    setAssignmentLoading(true);
    try {
      console.log('🔄 Atribuindo crachás à visita:', {
        visitaId,
        crachaIds: selectedCrachasForAssignment
      });

      const result = await assignCrachasToVisita(visitaId, selectedCrachasForAssignment);
      
      if (result.status === 'success' || result.status === 'Crachás atribuídos com sucesso.') {
        showAlert('success', '✅ Sucesso!', `Crachás atribuídos com sucesso à visita!`);
        
        // Limpar seleção e sair do modo de atribuição
        setSelectedCrachasForAssignment([]);
        setAutoAssignMode(false);
        setVisitaId(null);
        
        // Limpar parâmetros da URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('visitaId');
        newUrl.searchParams.delete('autoAssign');
        window.history.replaceState({}, '', newUrl.toString());
        
        // Recarregar crachás para mostrar status atualizado
        await loadCrachas(currentPage);
        
        // Redirecionar para a lista de visitas após 2 segundos
        setTimeout(() => {
          router.push('/dashboard/visitas');
        }, 2000);
      } else {
        console.error('❌ Erro na atribuição:', result);
        const errorMessage = result.erros ? result.erros.join(', ') : 'Erro ao atribuir crachás à visita.';
        showAlert('error', '❌ Erro', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erro ao atribuir crachás:', error);
      showAlert('error', '❌ Erro', 'Erro ao atribuir crachás à visita. Tente novamente.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleCancelAssignment = () => {
    setSelectedCrachasForAssignment([]);
    setAutoAssignMode(false);
    setVisitaId(null);
    
    // Limpar parâmetros da URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('visitaId');
    newUrl.searchParams.delete('autoAssign');
    window.history.replaceState({}, '', newUrl.toString());
    
    showAlert('info', 'ℹ️ Cancelado', 'Atribuição de crachás cancelada.');
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Alertas Amigáveis */}
        {alert && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className={`
              rounded-lg border-l-4 p-4 shadow-lg backdrop-blur-sm
              ${alert.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : ''}
              ${alert.type === 'error' ? 'bg-red-50 border-red-400 text-red-800' : ''}
              ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : ''}
              ${alert.type === 'info' ? 'bg-blue-50 border-blue-400 text-blue-800' : ''}
            `}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {alert.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                  {alert.type === 'error' && <AlertCircle className="h-5 w-5 text-red-400" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                  {alert.type === 'info' && <Info className="h-5 w-5 text-blue-400" />}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium">{alert.title}</h3>
                  <p className="mt-1 text-sm">{alert.message}</p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <button
                    onClick={() => setAlert(null)}
                    className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <span className="sr-only">Fechar</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Banner de Atribuição Automática */}
          {autoAssignMode && (
            <Card className="mb-6 border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Atribuição de Crachás à Visita</h3>
                      <p className="text-blue-800 text-sm">
                        Selecione os crachás que serão atribuídos à visita criada. 
                        {selectedCrachasForAssignment.length > 0 && (
                          <span className="font-medium"> {selectedCrachasForAssignment.length} crachá(s) selecionado(s).</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelAssignment}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleAssignCrachas}
                      disabled={selectedCrachasForAssignment.length === 0 || assignmentLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {assignmentLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Atribuindo...
                        </>
                      ) : (
                        `Atribuir ${selectedCrachasForAssignment.length} Crachá(s)`
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <IdCard className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão de Cartões de Visita</h1>
              <p className="text-muted-foreground mt-1">
                {autoAssignMode ? 'Selecione os crachás para atribuir à visita' : 'Gerencie os cartões de visita do sistema'}
              </p>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <IdCard className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Livres</p>
                    <p className="text-2xl font-bold text-green-600">{stats.livres}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ocupados</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.ocupados}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inativos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.inativos}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros e Busca */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar por número do cartão..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <span className="text-xs text-gray-500 ml-2">A busca considera o número exato do cartão.</span>
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="livre">Livre</SelectItem>
                      <SelectItem value="ocupado">Ocupado</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Dialog.Root open={open} onOpenChange={setOpen}>
                    <Dialog.Trigger asChild>
                      <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Cartão
                      </Button>
                    </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6">
                      <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-primary" />
                        Criar Novo Cartão
                      </Dialog.Title>
                      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número do Cartão</Label>
                          <Input 
                            id="numero"
                            placeholder="Ex: CV-001" 
                            {...register('numero', { required: true })} 
                          />
                        </div>
                        <div className="flex gap-3 pt-4">
                          <Button type="submit" disabled={isSubmitting} className="flex-1">
                            {isSubmitting ? 'Criando...' : 'Criar Cartão'}
                          </Button>
                          <Dialog.Close asChild>
                            <Button type="button" variant="outline">Cancelar</Button>
                          </Dialog.Close>
                        </div>
                      </form>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Cartões */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Cartões de Visita
                </div>
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages} • {totalCount} total
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Carregando cartões...</span>
                  </div>
                </div>
              ) : crachas.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <IdCard className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum cartão cadastrado
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Comece criando seu primeiro cartão de visita
                  </p>
                  <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeiro Cartão
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {crachas.map(cracha => {
                    const isSelected = selectedCrachasForAssignment.includes(cracha.id);
                    const isAvailable = cracha.estado === 'livre';
                    
                    return (
                      <Card 
                        key={cracha.id} 
                        className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                          autoAssignMode 
                            ? isSelected 
                              ? 'border-l-green-500 bg-green-50/50 ring-2 ring-green-200' 
                              : isAvailable 
                                ? 'border-l-blue-500 cursor-pointer hover:bg-blue-50/30' 
                                : 'border-l-gray-300 bg-gray-50/50 opacity-60'
                            : 'border-l-primary'
                        }`}
                        onClick={autoAssignMode && isAvailable ? () => handleCrachaSelection(cracha.id) : undefined}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {autoAssignMode && (
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-green-500 border-green-500' 
                                    : isAvailable 
                                      ? 'border-gray-300 hover:border-blue-400' 
                                      : 'border-gray-200 bg-gray-100'
                                }`}>
                                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                              )}
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <IdCard className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{cracha.numero}</h3>
                                <p className="text-sm text-gray-500">Cartão de Visita</p>
                              </div>
                            </div>
                            {getStatusBadge(cracha.estado)}
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              <div>
                                <span>Visita: {cracha.visita_numero || 'Nenhuma'}</span>
                                {cracha.visita_estado && (
                                  <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                    {cracha.visita_estado}
                                  </span>
                                )}
                              </div>
                            </div>
                            {autoAssignMode && !isAvailable && (
                              <div className="text-xs text-red-600 font-medium">
                                Crachá não disponível para atribuição
                              </div>
                            )}
                          </div>
                          
                          {!autoAssignMode && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleOpenDetails(cracha)}
                                className="flex-1"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                              <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={() => handleOpenEdit(cracha)}
                                className="flex-1"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleOpenDelete(cracha)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {autoAssignMode && isSelected && (
                            <div className="text-sm text-green-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Selecionado para atribuição
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} resultados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Itens por página</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        const size = Number(value);
                        if (!Number.isNaN(size)) {
                          setPageSize(size);
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[6, 9, 12, 18].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {/* Primeira página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToFirstPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Página anterior */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Números das páginas */}
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Próxima página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  {/* Última página */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToLastPage}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
          {/* Modal de Detalhes */}
          <Dialog.Root open={openDetails} onOpenChange={setOpenDetails}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6">
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Detalhes do Cartão
                </Dialog.Title>
                {selectedCracha && (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IdCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{selectedCracha.numero}</h3>
                            <p className="text-sm text-gray-500">Cartão de Visita</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            {getStatusBadge(selectedCracha.estado)}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Visita Associada:</span>
                            <div className="text-right">
                              <span className="text-sm text-gray-900">{selectedCracha.visita_numero || 'Nenhuma'}</span>
                              {selectedCracha.visita_estado && (
                                <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 mt-1">
                                  {selectedCracha.visita_estado}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div className="flex justify-end mt-6">
                  <Dialog.Close asChild>
                    <Button variant="outline">Fechar</Button>
                  </Dialog.Close>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Modal de Edição */}
          <Dialog.Root open={openEdit} onOpenChange={setOpenEdit}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6">
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Editar Cartão
                </Dialog.Title>
                {selectedCracha && (
                  <EditCrachaForm 
                    cracha={selectedCracha} 
                    onClose={() => setOpenEdit(false)} 
                    onUpdated={handleUpdate} 
                  />
                )}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>

          {/* Modal de Exclusão */}
          <Dialog.Root open={openDelete} onOpenChange={setOpenDelete}>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6">
                <Dialog.Title className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Excluir Cartão
                </Dialog.Title>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <XCircle className="h-8 w-8 text-red-500" />
                    <div>
                      <p className="font-medium text-gray-900">Tem certeza que deseja excluir este cartão?</p>
                      <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
                    </div>
                  </div>
                  {selectedCracha && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <IdCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{selectedCracha.numero}</h3>
                            <p className="text-sm text-gray-500">Cartão de Visita</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="flex gap-3 justify-end mt-6">
                  <Button variant="outline" onClick={() => setOpenDelete(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Componente de edição de crachá
import { useForm as useEditForm } from 'react-hook-form';
function EditCrachaForm({ cracha, onClose, onUpdated }: { cracha: Cracha; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, formState: { isSubmitting } } = useEditForm<Partial<Cracha>>({ defaultValues: cracha });

  const onSubmit = async (data: Partial<Cracha>) => {
    try {
      await updateCracha(cracha.id, data);
      onUpdated();
    } catch {
      toast.error('Erro ao atualizar cartão');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="edit-numero">Número do Cartão</Label>
        <Input 
          id="edit-numero"
          placeholder="Ex: CV-001" 
          {...register('numero', { required: true })} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="edit-estado">Status do Cartão</Label>
        <Select defaultValue={cracha.estado} onValueChange={(value) => register('estado').onChange({ target: { value } })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="livre">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Livre
              </div>
            </SelectItem>
            <SelectItem value="ocupado">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Ocupado
              </div>
            </SelectItem>
            <SelectItem value="inativo">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Inativo
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
