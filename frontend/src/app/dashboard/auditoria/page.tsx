'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  FileText,
  Database,
  FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuditLogs, exportAuditLogs, AuditLog, AuditFilters, AuditResponse } from '@/services/auditService';
import { exportAuditLogsToPDF } from '@/utils/pdfExport';

// Componente de controle de acesso
function AuditAccessGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Você precisa estar logado para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user || !['admin', 'suporte'].includes(user.role || '')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso negado. Apenas usuários com role 'admin' ou 'suporte' podem acessar a auditoria.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}

// Componente de detalhes do log
function LogDetailsModal({ log, isOpen, onClose }: { 
  log: AuditLog | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  if (!log) return null;

  const formatJson = (data: any) => {
    if (!data) return 'N/A';
    return JSON.stringify(data, null, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes do Log de Auditoria
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">ID do Log</label>
                  <p className="text-sm">{log.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Data/Hora</label>
                  <p className="text-sm">{new Date(log.data_hora).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuário</label>
                  <p className="text-sm">
                    {log.usuario_info ? (
                      <span>
                        <strong>{log.usuario_info.nome_completo}</strong> ({log.usuario_info.username})
                        <br />
                        <span className="text-gray-500">{log.usuario_info.email}</span>
                        <br />
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {log.usuario_info.perfil}
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sistema</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Ação</label>
                  <p className="text-sm">{log.acao}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Entidade</label>
                  <p className="text-sm">{log.entidade}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados anteriores */}
          {log.dados_anteriores && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                  {formatJson(log.dados_anteriores)}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Dados novos */}
          {log.dados_novos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Novos</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                  {formatJson(log.dados_novos)}
                </pre>
              </CardContent>
            </Card>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuditoriaPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  const [filters, setFilters] = useState<AuditFilters>({
    page: 1,
    page_size: 20
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Buscar logs de auditoria
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Preparar filtros com termo de busca
      const searchFilters: AuditFilters = {
        ...filters,
        search: searchTerm.trim() || undefined
      };

      const data = await getAuditLogs(searchFilters);
      
      setLogs(data.results);
      
      // Atualizar paginação
      const totalPages = Math.ceil(data.count / (filters.page_size || 20));
      setPagination({
        currentPage: filters.page || 1,
        totalPages,
        totalItems: data.count,
        itemsPerPage: filters.page_size || 20
      });
      
    } catch (err: any) {
      console.error('❌ Erro ao buscar logs:', err);
      if (err.message.includes('404')) {
        setError('Endpoint de auditoria não encontrado. Verifique se o sistema de auditoria está configurado.');
      } else if (err.message.includes('403')) {
        setError('Acesso negado. Você não tem permissão para visualizar logs de auditoria.');
      } else {
        setError(err.message || 'Erro ao carregar logs de auditoria. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, searchTerm]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setFilters(prev => ({ ...prev, page: 1, page_size: itemsPerPage }));
  };

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === 'all' ? undefined : value,
      page: 1 
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      // Preparar filtros com termo de busca
      const exportFilters: AuditFilters = {
        ...filters,
        search: searchTerm.trim() || undefined
      };

      const blob = await exportAuditLogs(exportFilters);
      
      // Criar download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Logs de auditoria exportados com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao exportar logs de auditoria.');
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportAuditLogsToPDF(logs, filters);
      toast.success('PDF gerado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao gerar PDF.');
    }
  };


  return (
    <AuditAccessGuard>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Auditoria do Sistema
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Logs de auditoria e rastreamento de atividades do sistema
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchAuditLogs} 
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={handleExport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button 
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Usuário</label>
                  <Input
                    placeholder="Nome do usuário..."
                    value={filters.usuario || ''}
                    onChange={(e) => handleFilterChange('usuario', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Ação</label>
                  <Select value={filters.acao || 'all'} onValueChange={(value) => handleFilterChange('acao', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as ações" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      <SelectItem value="create">Criar</SelectItem>
                      <SelectItem value="update">Atualizar</SelectItem>
                      <SelectItem value="delete">Excluir</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Entidade</label>
                  <Select value={filters.entidade || 'all'} onValueChange={(value) => handleFilterChange('entidade', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as entidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as entidades</SelectItem>
                      <SelectItem value="User">Usuário</SelectItem>
                      <SelectItem value="Visitante">Visitante</SelectItem>
                      <SelectItem value="Visita">Visita</SelectItem>
                      <SelectItem value="Orgao">Órgão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Início</label>
                  <Input
                    type="date"
                    value={filters.data_inicio || ''}
                    onChange={(e) => handleFilterChange('data_inicio', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Data Fim</label>
                  <Input
                    type="date"
                    value={filters.data_fim || ''}
                    onChange={(e) => handleFilterChange('data_fim', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Busca Geral</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar em todos os campos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} size="sm">
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Logs de Auditoria ({pagination.totalItems})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Entidade</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12">
                            <div className="text-gray-500">
                              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                              <p className="text-lg font-medium">Nenhum log encontrado</p>
                              <p className="text-sm">Tente ajustar os filtros ou criar algumas atividades.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-sm">{log.id}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <div>
                                  {log.usuario_info ? (
                                    <div>
                                      <p className="font-medium">{log.usuario_info.nome_completo}</p>
                                      <p className="text-sm text-gray-500">{log.usuario_info.username}</p>
                                      <p className="text-xs text-blue-600">{log.usuario_info.perfil}</p>
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">Sistema</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{log.acao}</Badge>
                            </TableCell>
                            <TableCell>{log.entidade}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm">
                                  {new Date(log.data_hora).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedLog(log);
                                  setIsDetailsModalOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            
            {/* Paginação */}
            {!loading && logs.length > 0 && (
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

          {/* Modal de Detalhes */}
          <LogDetailsModal
            log={selectedLog}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        </div>
      </DashboardLayout>
    </AuditAccessGuard>
  );
}
