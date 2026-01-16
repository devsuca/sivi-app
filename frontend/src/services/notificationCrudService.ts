import { DSINotification } from './notificationService';

// Interface para criação de notificação
export interface CreateNotificationData {
  nome_pessoa: string;
  data_visita: string;
  hora_visita: string;
  observacoes?: string;
  urgencia: 'baixa' | 'media' | 'alta';
  visitante_id?: number;
  orgao_id?: number;
}

// Interface para atualização de notificação
export interface UpdateNotificationData {
  status?: 'pendente' | 'visualizada' | 'processada';
  observacoes?: string;
  urgencia?: 'baixa' | 'media' | 'alta';
}

// Função utilitária para fazer requisições HTTP seguras
async function safeFetch(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, options);
    
    if (response.ok) {
      try {
        const data = await response.json();
        return { success: true, data, response };
      } catch (jsonError) {
        const text = await response.text();
        return { success: true, data: text, response };
      }
    } else {
      try {
        const errorData = await response.json();
        return { 
          success: false, 
          error: {
            ...errorData,
            status: response.status,
            statusText: response.statusText,
            url: response.url
          }, 
          response 
        };
      } catch (jsonError) {
        const errorText = await response.text();
        return { 
          success: false, 
          error: { 
            message: errorText, 
            status: response.status, 
            statusText: response.statusText,
            url: response.url,
            jsonError: jsonError instanceof Error ? jsonError.message : 'Erro de parsing JSON'
          }, 
          response 
        };
      }
    }
  } catch (networkError) {
    return { 
      success: false, 
      error: { 
        message: 'Erro de rede', 
        details: networkError instanceof Error ? networkError.message : 'Erro desconhecido' 
      }, 
      response: null 
    };
  }
}

// Função utilitária para extrair mensagem de erro
function extractErrorMessage(error: any, response?: Response | null): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (!error || (typeof error === 'object' && Object.keys(error).length === 0)) {
    if (response) {
      return `Erro ${response.status}: ${response.statusText || 'Erro na API'}`;
    }
    return 'Erro desconhecido';
  }
  
  if (typeof error === 'object') {
    const possibleMessages = [
      error.detail,
      error.message,
      error.error,
      error.description,
      error.reason
    ];
    
    for (const msg of possibleMessages) {
      if (msg && typeof msg === 'string' && msg.trim()) {
        return msg;
      }
    }
    
    if (error.status) {
      return `Erro ${error.status}: ${error.statusText || 'Erro na API'}`;
    }
    
    try {
      return JSON.stringify(error);
    } catch {
      return 'Erro desconhecido';
    }
  }
  
  return 'Erro desconhecido';
}

class NotificationCrudService {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  private getHeaders() {
    // Obter token atualizado do localStorage
    const currentToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!currentToken) {
      throw new Error('Token de autenticação não encontrado. Faça login novamente.');
    }
    
    return {
      'Authorization': `Bearer ${currentToken}`,
      'Content-Type': 'application/json'
    };
  }

  // CREATE - Criar nova notificação
  async create(data: CreateNotificationData): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    try {
      
      // Se não tem visitante_id, criar um visitante temporário
      let visitanteId = data.visitante_id;
      if (!visitanteId) {
        const visitanteResult = await this.createTemporaryVisitor(data.nome_pessoa);
        if (visitanteResult.success) {
          visitanteId = visitanteResult.data?.id;
        } else {
          return { success: false, error: `Erro ao criar visitante: ${visitanteResult.error}` };
        }
      }

      // Preparar dados para envio
      const notificationData = {
        visitante: visitanteId,
        orgao: data.orgao_id,
        nome_pessoa: data.nome_pessoa,
        data_visita: data.data_visita,
        hora_visita: data.hora_visita,
        observacoes: data.observacoes || '',
        urgencia: data.urgencia
      };

      
      const result = await safeFetch(`${this.baseUrl}/notifications/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(notificationData)
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Criar visitante temporário
  private async createTemporaryVisitor(nomePessoa: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const visitanteData = {
        nome_completo: nomePessoa,
        documento_numero: `TEMP_${Date.now()}`,
        documento_tipo: 'BI',
        telefone: '',
        email: '',
        tipo_pessoa: 'singular'
      };


      const result = await safeFetch(`${this.baseUrl}/pessoas/visitantes/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(visitanteData)
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // READ - Listar todas as notificações
  async list(): Promise<{ success: boolean; data?: DSINotification[]; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (result.success) {
        const notifications = Array.isArray(result.data) ? result.data : (result.data.results || []);
        return { success: true, data: notifications };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // READ - Obter notificação por ID
  async getById(id: string | number): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/${id}/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // UPDATE - Atualizar notificação
  async update(id: string | number, data: UpdateNotificationData): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/${id}/`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // DELETE - Excluir notificação
  async delete(id: string | number): Promise<{ success: boolean; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/${id}/`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      if (result.success) {
        return { success: true };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Ações específicas
  async markAsViewed(id: string | number): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    return this.update(id, { status: 'visualizada' });
  }

  async markAsProcessed(id: string | number): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    return this.update(id, { status: 'processada' });
  }

  // Criar notificação de teste
  async createTest(): Promise<{ success: boolean; data?: DSINotification; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/create_test/`, {
        method: 'POST',
        headers: this.getHeaders()
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Obter estatísticas
  async getStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      
      const result = await safeFetch(`${this.baseUrl}/notifications/stats/`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const errorMessage = extractErrorMessage(result.error, result.response);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }
}

// Instância singleton
export const notificationCrudService = new NotificationCrudService();
