import api from './api';

export interface TicketStats {
  total: number;
  abertos: number;
  em_andamento: number;
  fechados: number;
  por_categoria: Record<string, number>;
  por_prioridade: Record<string, number>;
  tempo_medio_resolucao: number;
  tickets_hoje: number;
  tickets_semana: number;
}

export interface Ticket {
  id: number;
  numero: string;
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_andamento' | 'fechado';
  prioridade: 'baixa' | 'média' | 'alta' | 'urgente';
  categoria: string;
  solicitante: {
    id: number;
    username: string;
    email: string;
  };
  atribuido_para?: {
    id: number;
    username: string;
    email: string;
  };
  data_criacao: string;
  data_atualizacao: string;
  data_fechamento?: string;
  tags: string[];
  satisfacao?: number;
  comentarios_count: number;
  anexos_count: number;
}

export interface TicketFilters {
  status?: string;
  prioridade?: string;
  categoria?: string;
  atribuido_para?: number;
  solicitante?: number;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TicketListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Ticket[];
}

// Buscar estatísticas dos tickets
export const getTicketStats = async (): Promise<TicketStats> => {
  try {
    const response = await api.get('/tickets/estatisticas/');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas dos tickets:', error);
    if (error.isHtmlResponse) {
      throw new Error('Servidor retornou HTML em vez de JSON. Verifique se o backend está rodando corretamente.');
    }
    throw error;
  }
};

// Buscar lista de tickets com filtros
export const getTickets = async (filters: TicketFilters = {}): Promise<TicketListResponse> => {
  try {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/tickets/?${params.toString()}`);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar tickets:', error);
    if (error.isHtmlResponse) {
      throw new Error('Servidor retornou HTML em vez de JSON. Verifique se o backend está rodando corretamente.');
    }
    throw error;
  }
};

// Buscar ticket por ID
export const getTicket = async (id: number): Promise<Ticket> => {
  const response = await api.get(`/tickets/${id}/`);
  return response.data;
};

// Criar novo ticket
export const createTicket = async (ticketData: Partial<Ticket>): Promise<Ticket> => {
  const response = await api.post('/tickets/', ticketData);
  return response.data;
};

// Atualizar ticket
export const updateTicket = async (id: number, ticketData: Partial<Ticket>): Promise<Ticket> => {
  try {
    console.log('🔄 Tentando atualizar ticket:', { id, ticketData });
    
    // Verificar se o token está presente
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token presente:', !!token);
    
    const response = await api.patch(`/tickets/${id}/`, ticketData);
    console.log('✅ Ticket atualizado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar ticket:', error);
    console.error('❌ URL da requisição:', error.config?.url);
    console.error('❌ Status da resposta:', error.response?.status);
    console.error('❌ Dados da resposta:', error.response?.data);
    console.error('❌ Headers da requisição:', error.config?.headers);
    
    // Se for erro de autenticação, sugerir login
    if (error.response?.status === 401) {
      console.error('🔐 Erro de autenticação - usuário precisa fazer login novamente');
      // Não redirecionar automaticamente, deixar o usuário decidir
    }
    
    throw error;
  }
};

// Fechar ticket
export const closeTicket = async (id: number, satisfacao?: number): Promise<Ticket> => {
  try {
    console.log('🔄 Tentando fechar ticket:', { id, satisfacao });
    
    // Verificar se o token está presente
    const token = localStorage.getItem('accessToken');
    console.log('🔑 Token presente:', !!token);
    
    const response = await api.post(`/tickets/${id}/fechar/`, { satisfacao });
    console.log('✅ Ticket fechado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao fechar ticket:', error);
    console.error('❌ URL da requisição:', error.config?.url);
    console.error('❌ Status da resposta:', error.response?.status);
    console.error('❌ Dados da resposta:', error.response?.data);
    console.error('❌ Headers da requisição:', error.config?.headers);
    
    // Se for erro de autenticação, sugerir login
    if (error.response?.status === 401) {
      console.error('🔐 Erro de autenticação - usuário precisa fazer login novamente');
    }
    
    throw error;
  }
};

// Atribuir ticket
export const assignTicket = async (id: number, userId: number): Promise<Ticket> => {
  const response = await api.post(`/tickets/${id}/atribuir/`, { usuario_id: userId });
  return response.data;
};

// Adicionar comentário
export const addComment = async (ticketId: number, comentario: string): Promise<any> => {
  const response = await api.post(`/tickets/${ticketId}/comentarios/`, { comentario });
  return response.data;
};

// Buscar comentários do ticket
export const getTicketComments = async (ticketId: number): Promise<any[]> => {
  const response = await api.get(`/tickets/${ticketId}/comentarios/`);
  return response.data;
};
