'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Calendar, 
  Building, 
  Users, 
  Car, 
  Briefcase,
  TrendingUp,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { getRelatorioEstatisticas, getRelatorioDetalhado, RelatorioEstatisticas, FiltrosRelatorio } from '@/services/relatorioService';
import { exportToExcel, exportToPDF, generateReportData } from '@/utils/exportUtils';
import { getOrgaos } from '@/services/orgaoService';
import { Orgao } from '@/types/orgao';

export default function RelatoriosPage() {
  const [estatisticas, setEstatisticas] = useState<RelatorioEstatisticas | null>(null);
  const [orgaos, setOrgaos] = useState<Orgao[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState<FiltrosRelatorio>({
    data_inicio: '',
    data_fim: '',
    orgao_id: undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Verificar se estamos no browser
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }

        const [estatisticasData, orgaosData] = await Promise.all([
          getRelatorioEstatisticas(filtros),
          getOrgaos()
        ]);
        setEstatisticas(estatisticasData);
        setOrgaos(orgaosData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados dos relatórios');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtros]);

  const handleFiltroChange = (campo: keyof FiltrosRelatorio, valor: any) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleExportar = async (formato: 'excel' | 'pdf') => {
    if (!estatisticas) {
      toast.error('Nenhum dado disponível para exportação');
      return;
    }

    setExporting(true);
    try {
      // Verificar se estamos no browser
      if (typeof window === 'undefined') {
        toast.error('Exportação não disponível no servidor');
        setExporting(false);
        return;
      }
      const data = generateReportData(estatisticas);
      const filename = 'relatorio_estatisticas';
      if (formato === 'excel') {
        const ok = await exportToExcel(data, filename);
        if (!ok) throw new Error('Falha ao exportar Excel');
      } else {
        const ok = await exportToPDF(data, filename);
        if (!ok) throw new Error('Falha ao exportar PDF');
      }
      toast.success(`Relatório exportado em ${formato.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // O useEffect será executado novamente devido à mudança nos filtros
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Relatórios
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Análise estatística e relatórios detalhados do sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={() => handleExportar('excel')} disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                Excel
              </Button>
              <Button onClick={() => handleExportar('pdf')} disabled={exporting} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="data_inicio">Data Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={filtros.data_inicio}
                    onChange={(e) => handleFiltroChange('data_inicio', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="data_fim">Data Fim</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={filtros.data_fim}
                    onChange={(e) => handleFiltroChange('data_fim', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="orgao">Órgão</Label>
                  <Select
                    value={filtros.orgao_id?.toString() || 'all'}
                    onValueChange={(value) => handleFiltroChange('orgao_id', value === 'all' ? undefined : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os órgãos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os órgãos</SelectItem>
                      {orgaos.map((orgao) => (
                        <SelectItem key={orgao.id} value={orgao.id.toString()}>
                          {orgao.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleRefresh} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Gerais */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitas</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.estatisticas_gerais.total_visitas || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visitantes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.estatisticas_gerais.total_visitantes || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Efetivos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.estatisticas_gerais.total_efetivos || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pertences</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.estatisticas_gerais.total_pertences || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Órgãos</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.estatisticas_gerais.total_orgaos || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Dados Detalhados */}
          <Tabs defaultValue="visitas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="visitas">Visitas</TabsTrigger>
              <TabsTrigger value="orgaos">Órgãos</TabsTrigger>
              <TabsTrigger value="visitantes">Visitantes</TabsTrigger>
              <TabsTrigger value="pertences">Pertences</TabsTrigger>
            </TabsList>

            <TabsContent value="visitas" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Visitas por Estado */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitas por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estatisticas?.visitas_por_estado?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.estado}</span>
                          <span className="text-blue-600 font-bold">{item.total}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Visitas por Mês */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitas por Mês</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estatisticas?.visitas_por_mes?.slice(-6).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.nome_mes}</span>
                          <span className="text-green-600 font-bold">{item.total}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Visitas por Dia da Semana */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitas por Dia da Semana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estatisticas?.visitas_por_dia_semana?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.dia}</span>
                          <span className="text-purple-600 font-bold">{item.total}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Visitas por Hora */}
                <Card>
                  <CardHeader>
                    <CardTitle>Visitas por Hora do Dia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {estatisticas?.visitas_por_hora?.filter(item => item.total > 0).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.hora}</span>
                          <span className="text-orange-600 font-bold">{item.total}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orgaos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visitas por Órgão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {estatisticas?.visitas_por_orgao?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{item.orgao__nome}</span>
                        <span className="text-blue-600 font-bold">{item.total}</span>
                      </div>
                    )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="visitantes" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Top Visitantes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Visitantes Mais Frequentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estatisticas?.top_visitantes?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.visitante__nome}</span>
                          <span className="text-yellow-600 font-bold">{item.total_visitas}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Efetivos */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top 10 Efetivos Mais Visitados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {estatisticas?.top_efetivos?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">{item.efetivo_visitar__nome_completo}</span>
                          <span className="text-red-600 font-bold">{item.total_visitas}</span>
                        </div>
                      )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pertences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pertences por Estado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {estatisticas?.pertences_por_estado?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{item.estado}</span>
                        <span className="text-indigo-600 font-bold">{item.total}</span>
                      </div>
                    )) || <p className="text-gray-500">Nenhum dado disponível</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}