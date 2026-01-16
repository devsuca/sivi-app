import api from './api';

// Tipos para os logs de auditoria (ajustados para o backend)
export interface AuditLog {
  id: number;
  user: number | null; // ID do usuário
  usuario_info: {
    id: number;
    username: string;
    email: string;
    nome_completo: string;
    perfil: string;
  } | null;
  acao: string;
  entidade: string; // Mudou de 'modelo' para 'entidade'
  dados_anteriores?: Record<string, any>;
  dados_novos?: Record<string, any>;
  data_hora: string; // Mudou de 'timestamp' para 'data_hora'
}

export interface AuditFilters {
  usuario?: string;
  acao?: string;
  entidade?: string; // Mudou de 'modelo' para 'entidade'
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface AuditResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AuditLog[];
}

// Buscar logs de auditoria
export const getAuditLogs = async (filters: AuditFilters = {}): Promise<AuditResponse> => {
  try {
    const params = new URLSearchParams();
    
    // Adicionar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = `/audit-logs/?${params.toString()}`;
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar logs de auditoria:', error);
    }
    throw new Error(error.response?.data?.detail || 'Erro ao carregar logs de auditoria');
  }
};

// Buscar log específico por ID
export const getAuditLog = async (id: number): Promise<AuditLog> => {
  try {
    const response = await api.get(`/audit-logs/${id}/`);
    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar log de auditoria:', error);
    }
    throw new Error('Erro ao carregar log de auditoria');
  }
};

// Exportar logs de auditoria
export const exportAuditLogs = async (filters: AuditFilters = {}): Promise<Blob> => {
  try {
    const params = new URLSearchParams();
    
    // Adicionar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    params.append('export', 'true');

    const response = await api.get(`/audit-logs/export/?${params.toString()}`, {
      responseType: 'blob',
    });
    
    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao exportar logs de auditoria:', error);
    }
    throw new Error('Erro ao exportar logs de auditoria');
  }
};

// Estatísticas de auditoria
export const getAuditStats = async (): Promise<{
  total_logs: number;
  logs_por_dia: Array<{ data: string; quantidade: number }>;
  logs_por_acao: Array<{ acao: string; quantidade: number }>;
  logs_por_usuario: Array<{ usuario: string; quantidade: number }>;
  logs_por_status: Array<{ status: string; quantidade: number }>;
}> => {
  try {
    const response = await api.get('/audit-logs/stats/');
    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao buscar estatísticas de auditoria:', error);
    }
    throw new Error('Erro ao carregar estatísticas de auditoria');
  }
};

// Limpar logs antigos (apenas admin)
export const cleanOldAuditLogs = async (daysToKeep: number = 90): Promise<{ deleted_count: number }> => {
  try {
    const response = await api.post('/audit-logs/clean/', {
      days_to_keep: daysToKeep
    });
    return response.data;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Erro ao limpar logs antigos:', error);
    }
    throw new Error('Erro ao limpar logs antigos');
  }
};
