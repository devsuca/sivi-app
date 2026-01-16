import api from './api';

export interface LogSistema {
  id: number;
  entidade: string;
  acao: string;
  user_id: number | null;
  username: string;
  usuario_info?: {
    id: number;
    username: string;
    email: string;
    nome_completo: string;
    perfil: string;
  };
  data_hora: string;
  detalhes?: string;
  dados_anteriores: any;
  dados_novos: any;
}

export interface LogFilterParams {
  search?: string;
  entidade?: string;
  acao?: string;
  usuario?: string;
  data_inicio?: string;
  data_fim?: string;
  page?: number;
  page_size?: number;
}

export interface LogsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LogSistema[];
}

export const getLogs = async (params: LogFilterParams = {}): Promise<LogsResponse> => {
  try {
    const response = await api.get('/audit-logs/', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    throw error;
  }
};

export const exportLogs = async (params: LogFilterParams = {}): Promise<Blob> => {
  try {
    const response = await api.get('/audit-logs/export/', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao exportar logs:', error);
    throw error;
  }
};
export const exportLogsPDF = async (params: LogFilterParams = {}): Promise<Blob> => {
  try {
    const response = await api.get('/audit-logs/export_pdf/', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao exportar logs em PDF:', error);
    throw error;
  }
};
