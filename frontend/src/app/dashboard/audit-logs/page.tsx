'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Search, Download, Filter, FileText, Activity, Shield, RefreshCw } from 'lucide-react';
import { getLogs, exportLogs, exportLogsPDF, LogSistema } from '@/services/logService';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [logs, setLogs] = useState<LogSistema[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [acaoFilter, setAcaoFilter] = useState('todos');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Protect route
  useEffect(() => {
    // Small delay to ensure auth state is settled
    const timer = setTimeout(() => {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'portaria' && user.role !== 'suporte') {
        toast.error('Acesso não autorizado');
        router.push('/dashboard');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, router]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: any = {
        page,
        page_size: 20
      };
      
      if (search) params.search = search;
      if (acaoFilter !== 'todos') params.acao = acaoFilter;
      if (dateStart) params.data_inicio = dateStart;
      if (dateEnd) params.data_fim = dateEnd;
      
      const data = await getLogs(params);
      setLogs(data.results);
      setTotalCount(data.count);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao carregar logs do sistema');
    } finally {
      setLoading(false);
    }
  }, [page, search, acaoFilter, dateStart, dateEnd, user]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const params: any = { search };
      if (acaoFilter !== 'todos') params.acao = acaoFilter;
      if (dateStart) params.data_inicio = dateStart;
      if (dateEnd) params.data_fim = dateEnd;

      const blob = await exportLogs(params);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sivis-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Exportação CSV concluída');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao exportar CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const params: any = { search };
      if (acaoFilter !== 'todos') params.acao = acaoFilter;
      if (dateStart) params.data_inicio = dateStart;
      if (dateEnd) params.data_fim = dateEnd;

      const blob = await exportLogsPDF(params);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sivis-logs-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Relatório PDF gerado com sucesso');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório PDF');
    } finally {
      setExportingPDF(false);
    }
  };

  const formatData = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-AO');
  };

  const getAcaoBadge = (acao: string) => {
    if (acao.includes('CREATE')) return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Criação</Badge>;
    if (acao.includes('UPDATE')) return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Atualização</Badge>;
    if (acao.includes('DELETE')) return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Remoção</Badge>;
    if (acao.includes('LOGIN')) return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">Login</Badge>;
    return <Badge variant="outline">{acao}</Badge>;
  };

  // if (authLoading) return <DashboardLayout><div>A carregar...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              Logs de Auditoria
            </h1>
            <p className="text-muted-foreground">
              Histórico de atividades e segurança do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={exportingCSV || loading}>
              <FileText className="w-4 h-4 mr-2" />
              {exportingCSV ? 'A exportar...' : 'CSV'}
            </Button>
            <Button onClick={handleExportPDF} disabled={exportingPDF || loading}>
              <Download className="w-4 h-4 mr-2" />
              {exportingPDF ? 'A gerar...' : 'Baixar PDF'}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pesquisar</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Entidade, usuário..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Ação</label>
                <Select value={acaoFilter} onValueChange={setAcaoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Ações</SelectItem>
                    <SelectItem value="CREATE">Criação</SelectItem>
                    <SelectItem value="UPDATE">Atualização</SelectItem>
                    <SelectItem value="DELETE">Remoção</SelectItem>
                    <SelectItem value="LOGIN">Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Início</label>
                <Input 
                  type="date" 
                  value={dateStart} 
                  onChange={(e) => setDateStart(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data Fim</label>
                <Input 
                  type="date" 
                  value={dateEnd} 
                  onChange={(e) => setDateEnd(e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatData(log.data_hora)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {(log.usuario_info?.nome_completo || log.usuario_info?.username || log.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-none">
                              {log.usuario_info?.nome_completo || log.username || 'Sistema'}
                            </p>
                            {log.usuario_info?.username && log.usuario_info?.nome_completo !== log.usuario_info?.username && (
                              <p className="text-xs text-muted-foreground mt-1">
                                @{log.usuario_info.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getAcaoBadge(log.acao)}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entidade}</TableCell>
                      <TableCell>
                        <div className="max-w-[400px] text-sm" title={JSON.stringify(log.dados_novos)}>
                          {log.detalhes || (log.dados_novos ? JSON.stringify(log.dados_novos) : '-')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Total: {totalCount} registros
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={logs.length < 20 || loading}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
