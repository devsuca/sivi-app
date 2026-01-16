"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getVisitas, deleteVisita } from '@/services/visitaService';
import { getOrgaos } from '@/services/orgaoService';
import { Orgao } from '@/types/orgao';
import { columns, getRecepcaoColumns } from './columns';
import { DataTable } from '@/components/data-table/data-table';
import { Visita } from '@/types/visita';
import { useAuth } from '@/lib/auth';
import { Plus, ClipboardList, AlertCircle, Download, FileText, Printer, Search, Filter, Calendar, Users, Building2, Clock, CheckCircle, XCircle, Eye, User, MapPin, Phone, Trash2, RefreshCw } from 'lucide-react';
import { exportVisitasToExcel, exportVisitasToPDF, printVisitas, ExportFilters } from '@/utils/exportUtils';
import { toast } from 'sonner';
import ExportFiltersModal from '@/components/visitas/ExportFiltersModal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function VisitasListPage() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Garantir que visitas seja sempre um array
  const safeVisitas = Array.isArray(visitas) ? visitas : [];
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [numeroFiltro, setNumeroFiltro] = useState("");
  
  // Estados para modais
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Funções de manipulação
  const handleOpenDetails = (visita: Visita) => {
    setSelectedVisita(visita);
    setOpenDetails(true);
  };

  const handleOpenDelete = (visita: Visita) => {
    setSelectedVisita(visita);
    setOpenDelete(true);
  };

  const handleDelete = async (id?: string) => {
    const visitaId = id || selectedVisita?.id;
    if (visitaId) {
      setDeleting(true);
      try {
        await deleteVisita(visitaId);
        setVisitas(prev => prev.filter(v => v.id !== visitaId));
        setOpenDelete(false);
        setDeleteId(null);
        toast.success('Visita excluída com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir visita');
      } finally {
        setDeleting(false);
      }
    }
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const visitasData = await getVisitas();
      console.log('🔍 Dados recebidos do serviço:', visitasData);
      console.log('🔍 Tipo dos dados:', typeof visitasData);
      console.log('🔍 É array?', Array.isArray(visitasData));
      
      // Garantir que sempre seja um array
      const visitasArray = Array.isArray(visitasData) ? visitasData : [];
      setVisitas(visitasArray);
    } catch (error) {
      console.error('❌ Erro ao carregar visitas:', error);
      if (error instanceof Error && error.message.toLowerCase().includes('acesso negado')) {
        setAuthError(true);
      }
      toast.error('Erro ao carregar dados');
      // Em caso de erro, garantir que visitas seja um array vazio
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Recarregando visitas...');
      const visitasData = await getVisitas();
      const visitasArray = Array.isArray(visitasData) ? visitasData : [];
      setVisitas(visitasArray);
      console.log('✅ Visitas recarregadas:', visitasArray.length);
      toast.success('Dados atualizados com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao recarregar visitas:', error);
      toast.error('Erro ao recarregar dados');
    } finally {
      setRefreshing(false);
    }
  };

  // Carregar órgãos
  useEffect(() => {
    const loadOrgaos = async () => {
      try {
        const orgaosData = await getOrgaos();
        setOrgaos(Array.isArray(orgaosData) ? orgaosData : []);
      } catch (error) {
        console.error('Erro ao carregar órgãos:', error);
        setOrgaos([]);
      }
    };
    loadOrgaos();
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      setAuthError(true);
      setLoading(false);
      return;
    }
    refreshData();
    
    // Event listeners para ações da tabela
    const handleDetails = (e: any) => handleOpenDetails(e.detail);
    const handleDeleteEvent = (e: any) => handleOpenDelete(e.detail);
    
    window.addEventListener('visita-details', handleDetails);
    window.addEventListener('visita-delete', handleDeleteEvent);
    
    return () => {
      window.removeEventListener('visita-details', handleDetails);
      window.removeEventListener('visita-delete', handleDeleteEvent);
    };
  }, [user]);

  // Filtros
  const filteredVisitas = safeVisitas.filter(visita => {
    // Buscar nome do visitante em todos os locais possíveis
    const getVisitanteDesc = () => {
      // 1. Objeto expandido do backend (prioridade)
      if (visita.visitante_obj) {
        return visita.visitante_obj.nome || visita.visitante_obj.designacao_social || '';
      }
      // 2. Objeto completo do tipo Visitante
      if (typeof visita.visitante === 'object' && visita.visitante !== null) {
        return visita.visitante.nome || visita.visitante.designacao_social || '';
      }
      return '';
    };

    const visitanteNome = getVisitanteDesc();
    const orgaoNome = typeof visita.orgao === 'string' ? '' : visita.orgao?.nome || visita.orgao_obj?.nome || '';
    const orgaoSigla = typeof visita.orgao === 'string' ? '' : visita.orgao?.sigla || visita.orgao_obj?.sigla || '';
    
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      String(visita.numero).toLowerCase().includes(term) ||
      visitanteNome.toLowerCase().includes(term) ||
      orgaoNome.toLowerCase().includes(term) ||
      orgaoSigla.toLowerCase().includes(term);
    
    const matchesEstado = estadoFilter === "all" || visita.estado === estadoFilter;
    const matchesNumero = !numeroFiltro || String(visita.numero).includes(numeroFiltro);
    
    return matchesSearch && matchesEstado && matchesNumero;
  });

  // Estatísticas
  const stats = {
    total: safeVisitas.length,
    agendadas: safeVisitas.filter(v => v.estado === 'agendada').length,
    emCurso: safeVisitas.filter(v => v.estado === 'em_curso').length,
    finalizadas: safeVisitas.filter(v => v.estado === 'concluida').length,
    canceladas: safeVisitas.filter(v => v.estado === 'cancelada').length,
  };

  const handleExportWithFilters = async (filters: ExportFilters, format: 'excel' | 'pdf' | 'print', filteredVisitasFromModal?: Visita[]) => {
    // Usar as visitas filtradas do modal se fornecidas, caso contrário usar as visitas filtradas da página
    const visitasParaExportar = filteredVisitasFromModal || filteredVisitas;
    
    if (visitasParaExportar.length === 0) {
      toast.error('Nenhuma visita disponível para exportação');
      return;
    }

    setExporting(true);
    try {
      // Usar as visitas já filtradas pelo modal
      const exportVisitas = [...visitasParaExportar];

      // As visitas já foram filtradas pelo modal, então não precisamos aplicar os filtros novamente
      // Mas validamos se há visitas para exportar

      const filename = `visitas_${user?.role || 'usuario'}_${new Date().toISOString().split('T')[0]}`;
      
      let success = false;
      if (format === 'excel') {
        success = await exportVisitasToExcel(exportVisitas, filename, filters);
      } else if (format === 'pdf') {
        success = await exportVisitasToPDF(exportVisitas, filename, filters);
      } else {
        printVisitas(exportVisitas, filters);
        success = true;
      }
      
      if (success) {
        if (format === 'print') {
          toast.success('Abrindo janela de impressão...');
        } else {
          toast.success(`Visitas exportadas em ${format.toUpperCase()} com sucesso!`);
        }
      } else {
        toast.error('Erro ao exportar visitas');
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar visitas');
    } finally {
      setExporting(false);
    }
  };

  // Interface específica para usuários de Recepção
  if (user?.role === 'recepcao') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                    <ClipboardList className="h-8 w-8" />
                    Visitas do Seu Órgão
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Visitas agendadas para {user?.orgao?.nome || 'seu órgão'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Recarregando...' : 'Recarregar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    disabled={safeVisitas.length === 0}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar/Imprimir
                  </Button>
                  <Link href="/dashboard/notificacoes">
                    <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4" />
                      Notificar o DSI
                    </Button>
                  </Link>
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
                        Você pode visualizar e agendar visitas apenas para o seu órgão. 
                        Não é possível editar, finalizar ou associar crachás às visitas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.emCurso}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.finalizadas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        id="search"
                        placeholder="Número, visitante ou órgão..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="md:w-48">
                    <Label htmlFor="estado">Estado</Label>
                    <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os estados" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="em_curso">Em Curso</SelectItem>
                        <SelectItem value="concluida">Finalizada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabela */}
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <span className="animate-pulse text-lg text-muted-foreground">A carregar...</span>
                  </div>
                ) : filteredVisitas.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <span className="text-muted-foreground">Nenhuma visita encontrada.</span>
                    <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 rounded p-3 text-sm max-w-md">
                      <strong>Para notificar o DSI sobre uma visita:</strong>
                      <p className="mt-1">
                        Clique no botão "Notificar o DSI" para enviar uma notificação ao Departamento de Segurança Institucional.
                      </p>
                    </div>
                  </div>
                ) : (
                  <DataTable columns={getRecepcaoColumns()} data={filteredVisitas} />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Modal de Filtros para Exportação */}
          <ExportFiltersModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleExportWithFilters}
            visitas={filteredVisitas}
            orgaos={[]}
            userRole={user?.role}
            userOrgao={user?.orgao ? {
              id: String(user.orgao.id),
              nome: user.orgao.nome
            } : undefined}
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Interface normal para outros usuários (Admin, Portaria, Secretaria)
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                  <ClipboardList className="h-8 w-8" />
                  Gestão de Visitas
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Lista das visitas cadastradas no sistema
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Recarregando...' : 'Recarregar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  disabled={safeVisitas.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar/Imprimir
                </Button>
                <Link href="/dashboard/visitas/novo">
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Nova Visita
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Curso</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.emCurso}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.finalizadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="Número, visitante ou órgão..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="md:w-48">
                  <Label htmlFor="numero">Número da Visita</Label>
                  <Input
                    id="numero"
                    placeholder="Ex: 123"
                    value={numeroFiltro}
                    onChange={(e) => setNumeroFiltro(e.target.value)}
                  />
                </div>
                <div className="md:w-48">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="agendada">Agendadas</SelectItem>
                      <SelectItem value="em_curso">Em Curso</SelectItem>
                      <SelectItem value="concluida">Finalizadas</SelectItem>
                      <SelectItem value="concluida">Concluídas</SelectItem>
                      <SelectItem value="cancelada">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Visitas</CardTitle>
              <CardDescription>
                {filteredVisitas.length} de {safeVisitas.length} visitas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredVisitas.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma visita encontrada</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm || estadoFilter !== "all" || numeroFiltro
                      ? "Tente ajustar os filtros de pesquisa" 
                      : "Comece criando sua primeira visita"
                    }
                  </p>
                  {!searchTerm && estadoFilter === "all" && !numeroFiltro && (
                    <Link href="/dashboard/visitas/novo">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Visita
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <DataTable columns={columns} data={filteredVisitas} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal de Detalhes da Visita */}
        <Dialog open={openDetails} onOpenChange={setOpenDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Detalhes da Visita
              </DialogTitle>
            </DialogHeader>
            {selectedVisita && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Número</Label>
                    <p className="text-lg font-semibold font-mono">{selectedVisita.numero}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                    <div className="mt-1">
                      <Badge 
                        variant="outline" 
                        className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${
                          selectedVisita.estado === 'agendada' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          selectedVisita.estado === 'em_curso' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          selectedVisita.estado === 'concluida' ? 'bg-green-100 text-green-800 border-green-200' :
                          selectedVisita.estado === 'cancelada' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {selectedVisita.estado === 'agendada' ? 'Agendada' :
                         selectedVisita.estado === 'em_curso' ? 'Em Curso' :
                         selectedVisita.estado === 'concluida' ? 'Finalizada' :
                         selectedVisita.estado === 'cancelada' ? 'Cancelada' :
                         selectedVisita.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Visitante</Label>
                    <p className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {typeof selectedVisita.visitante === 'string' ? 'Não informado' : selectedVisita.visitante?.nome || 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Órgão</Label>
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {typeof selectedVisita.orgao === 'string' ? 'Não informado' : selectedVisita.orgao?.nome || 'Não informado'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data/Hora de Entrada</Label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedVisita.data_hora_entrada ? new Date(selectedVisita.data_hora_entrada).toLocaleString('pt-PT') : 'Não registrada'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data/Hora de Saída</Label>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedVisita.data_hora_saida ? new Date(selectedVisita.data_hora_saida).toLocaleString('pt-PT') : 'Não registrada'}
                    </p>
                  </div>
                </div>
                
                {selectedVisita.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Observações</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedVisita.observacoes}</p>
                  </div>
                )}
                {selectedVisita && (user?.role === 'admin' || user?.role === 'portaria') && selectedVisita.confirmada_recepcao && (
                  <div className="mb-4 p-2 rounded bg-green-100 border border-green-300 text-green-800 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Presença no órgão confirmada pela recepção!
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDetails(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <ConfirmDialog
          open={openDelete}
          onOpenChange={setOpenDelete}
          onConfirm={handleDelete}
          title="Excluir Visita"
          description={`Tem certeza que deseja excluir a visita #${selectedVisita?.numero}? Esta ação não pode ser desfeita.`}
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="destructive"
          icon={<Trash2 className="h-5 w-5" />}
          loading={deleting}
        />

        {/* Modal de Filtros para Exportação */}
        <ExportFiltersModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportWithFilters}
          visitas={filteredVisitas}
          orgaos={orgaos}
          userRole={user?.role}
          userOrgao={user?.orgao ? {
            id: String(user.orgao.id),
            nome: user.orgao.nome
          } : undefined}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
