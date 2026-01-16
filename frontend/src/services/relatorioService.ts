import api from './api';

export interface RelatorioEstatisticas {
  estatisticas_gerais: {
    total_visitas: number;
    total_visitantes: number;
    total_efetivos: number;
    total_pertences: number;
    total_orgaos: number;
  };
  visitas_por_estado: Array<{
    estado: string;
    total: number;
  }>;
  visitas_por_orgao: Array<{
    orgao__nome: string;
    orgao__id: number;
    total: number;
  }>;
  visitas_por_mes: Array<{
    mes: string;
    nome_mes: string;
    total: number;
  }>;
  visitas_por_dia_semana: Array<{
    dia: string;
    total: number;
  }>;
  top_visitantes: Array<{
    visitante__nome: string;
    visitante__id: number;
    total_visitas: number;
  }>;
  top_efetivos: Array<{
    efetivo_visitar__nome_completo: string;
    efetivo_visitar__id: number;
    total_visitas: number;
  }>;
  pertences_por_estado: Array<{
    estado: string;
    total: number;
  }>;
  usuarios_por_perfil: Array<{
    perfil__nome: string;
    perfil__id: number;
    total: number;
  }>;
  visitas_por_hora: Array<{
    hora: string;
    total: number;
  }>;
}

export interface RelatorioDetalhado {
  dados: Array<Record<string, any>>;
}

export interface FiltrosRelatorio {
  data_inicio?: string;
  data_fim?: string;
  orgao_id?: number;
  tipo?: string;
}

export const getRelatorioEstatisticas = async (filtros: FiltrosRelatorio = {}): Promise<RelatorioEstatisticas> => {
  const params = new URLSearchParams();
  
  if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
  if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
  if (filtros.orgao_id) params.append('orgao_id', filtros.orgao_id.toString());
  
  const response = await api.get(`/relatorios/estatisticas/?${params.toString()}`);
  return response.data;
};

export const getRelatorioDetalhado = async (filtros: FiltrosRelatorio): Promise<RelatorioDetalhado> => {
  const params = new URLSearchParams();
  
  if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
  if (filtros.data_fim) params.append('data_fim', filtros.data_fim);
  if (filtros.orgao_id) params.append('orgao_id', filtros.orgao_id.toString());
  if (filtros.tipo) params.append('tipo', filtros.tipo);
  
  const response = await api.get(`/relatorios/detalhados/?${params.toString()}`);
  return response.data;
};

