import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Calendar, Filter, Download, FileText, Printer } from 'lucide-react';
import { Visita } from '@/types/visita';
import { Orgao } from '@/types/orgao';

interface ExportFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filters: ExportFilters, format: 'excel' | 'pdf' | 'print', filteredVisitas?: Visita[]) => void;
  visitas: Visita[];
  orgaos: Orgao[];
  userRole?: string;
  userOrgao?: Orgao;
}

export interface ExportFilters {
  dataInicio: string;
  dataFim: string;
  estado: string;
  orgao: string;
  incluirCampos: {
    numero: boolean;
    visitante: boolean;
    efetivo: boolean;
    orgao: boolean;
    estado: boolean;
    motivo: boolean;
    dataEntrada: boolean;
    dataSaida: boolean;
    observacoes: boolean;
    dataRegistro: boolean;
  };
}

const defaultFilters: ExportFilters = {
  dataInicio: '',
  dataFim: '',
  estado: 'todos',
  orgao: 'todos',
  incluirCampos: {
    numero: true,
    visitante: true,
    efetivo: true,
    orgao: true,
    estado: true,
    motivo: true,
    dataEntrada: true,
    dataSaida: true,
    observacoes: false,
    dataRegistro: false,
  }
};

export default function ExportFiltersModal({
  isOpen,
  onClose,
  onExport,
  visitas,
  orgaos,
  userRole,
  userOrgao
}: ExportFiltersModalProps) {
  const [filters, setFilters] = useState<ExportFilters>(defaultFilters);
  const [exporting, setExporting] = useState(false);

  // Resetar filtros quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setFilters(defaultFilters);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFilterChange = (field: keyof ExportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCampoChange = (campo: keyof ExportFilters['incluirCampos'], value: boolean) => {
    setFilters(prev => ({
      ...prev,
      incluirCampos: {
        ...prev.incluirCampos,
        [campo]: value
      }
    }));
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'print') => {
    setExporting(true);
    try {
      const filteredVisitas = getFilteredVisitas();
      // Passar as visitas já filtradas para a função de exportação
      // Mas manter a compatibilidade com a interface atual
      await onExport(filters, format, filteredVisitas);
      onClose();
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters(defaultFilters);
  };

  const getFilteredVisitas = () => {
    let filtered = [...visitas];
    
    console.log('🔍 Filtros aplicados:', filters);
    console.log('🔍 Total de visitas recebidas:', visitas.length);
    console.log('🔍 Primeira visita (exemplo):', visitas[0]);

    // Filtro por data de início (apenas se preenchido)
    if (filters.dataInicio && typeof filters.dataInicio === 'string' && filters.dataInicio.trim() !== '') {
      try {
        const dataInicio = new Date(filters.dataInicio);
        if (!isNaN(dataInicio.getTime())) {
          dataInicio.setHours(0, 0, 0, 0); // Início do dia
          
          filtered = filtered.filter(visita => {
            if (!visita.data_hora_entrada) return true; // Manter visitas sem data se não há filtro obrigatório
            const dataRegistro = new Date(visita.data_hora_entrada);
            if (isNaN(dataRegistro.getTime())) return true; // Manter se data inválida
            dataRegistro.setHours(0, 0, 0, 0);
            return dataRegistro >= dataInicio;
          });
          console.log('🔍 Após filtro data início:', filtered.length);
        }
      } catch (error) {
        console.error('Erro ao processar filtro de data início:', error);
      }
    }

    // Filtro por data de fim (apenas se preenchido)
    if (filters.dataFim && typeof filters.dataFim === 'string' && filters.dataFim.trim() !== '') {
      try {
        const dataFim = new Date(filters.dataFim);
        if (!isNaN(dataFim.getTime())) {
          dataFim.setHours(23, 59, 59, 999); // Fim do dia
          
          filtered = filtered.filter(visita => {
            if (!visita.data_hora_entrada) return true; // Manter visitas sem data se não há filtro obrigatório
            const dataRegistro = new Date(visita.data_hora_entrada);
            if (isNaN(dataRegistro.getTime())) return true; // Manter se data inválida
            return dataRegistro <= dataFim;
          });
          console.log('🔍 Após filtro data fim:', filtered.length);
        }
      } catch (error) {
        console.error('Erro ao processar filtro de data fim:', error);
      }
    }

    // Filtro por estado (apenas se diferente de 'todos')
    if (filters.estado && filters.estado !== 'todos' && typeof filters.estado === 'string' && filters.estado.trim() !== '') {
      filtered = filtered.filter(visita => {
        const matches = visita.estado === filters.estado;
        if (!matches) {
          console.log('🔍 Estado não corresponde:', visita.estado, 'vs', filters.estado);
        }
        return matches;
      });
      console.log('🔍 Após filtro estado:', filtered.length);
    }

    // Filtro por órgão (apenas se diferente de 'todos')
    if (filters.orgao && filters.orgao !== 'todos' && typeof filters.orgao === 'string' && filters.orgao.trim() !== '') {
      filtered = filtered.filter(visita => {
        // Comparar tanto se for ID string quanto se for objeto com ID
        const orgaoId = typeof visita.orgao === 'string' 
          ? visita.orgao 
          : typeof visita.orgao === 'object' && visita.orgao !== null
            ? String(visita.orgao.id || visita.orgao)
            : null;
        
        // Também verificar se tem orgao_obj (objeto expandido)
        const orgaoObjId = visita.orgao_obj?.id ? String(visita.orgao_obj.id) : null;
        
        const filterId = String(filters.orgao);
        const matches = orgaoId === filterId || orgaoObjId === filterId;
        
        if (!matches) {
          console.log('🔍 Órgão não corresponde:', { orgaoId, orgaoObjId, filterId });
        }
        return matches;
      });
      console.log('🔍 Após filtro órgão:', filtered.length);
    }

    console.log('🔍 Resultado final:', filtered.length, 'de', visitas.length, 'visitas');
    return filtered;
  };

  const filteredCount = getFilteredVisitas().length;
  const totalCount = visitas.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros para Exportação/Impressão
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Resumo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {filteredCount} de {totalCount} visitas serão {filteredCount === 1 ? 'exportada' : 'exportadas'}
              </span>
            </div>
            {filteredCount === 0 && totalCount > 0 && (
              <div className="mt-2 text-sm text-blue-700">
                <p>Nenhuma visita encontrada com os filtros aplicados.</p>
                <p>Verifique as datas, estado e órgão selecionados.</p>
              </div>
            )}
          </div>

          {/* Filtros por Data */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Filtros por Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataInicio">Data de Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data de Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filtros por Estado e Órgão */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Filtros por Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estado">Estado da Visita</Label>
                <Select value={filters.estado} onValueChange={(value) => handleFilterChange('estado', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os estados</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="em_curso">Em Curso</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="orgao">Órgão</Label>
                <Select value={filters.orgao} onValueChange={(value) => handleFilterChange('orgao', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os órgãos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os órgãos</SelectItem>
                    {orgaos.map((orgao) => (
                      <SelectItem key={orgao.id} value={orgao.id}>
                        {orgao.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Campos a Incluir */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Campos a Incluir</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(filters.incluirCampos).map(([campo, incluido]) => (
                <div key={campo} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={campo}
                    checked={incluido}
                    onChange={(e) => handleCampoChange(campo as keyof ExportFilters['incluirCampos'], e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={campo} className="text-sm">
                    {campo === 'numero' && 'Número'}
                    {campo === 'visitante' && 'Visitante'}
                    {campo === 'efetivo' && 'Efetivo'}
                    {campo === 'orgao' && 'Órgão'}
                    {campo === 'estado' && 'Estado'}
                    {campo === 'motivo' && 'Motivo'}
                    {campo === 'dataEntrada' && 'Data Entrada'}
                    {campo === 'dataSaida' && 'Data Saída'}
                    {campo === 'observacoes' && 'Observações'}
                    {campo === 'dataRegistro' && 'Data Registro'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={exporting || filteredCount === 0}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={exporting || filteredCount === 0}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('print')}
              disabled={exporting || filteredCount === 0}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Limpar Filtros
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="ml-auto"
            >
              Cancelar
            </Button>
          </div>

          {exporting && (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Processando...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
