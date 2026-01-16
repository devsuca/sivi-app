import api from './api';
import { Cracha } from '@/types/cracha';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function getCrachas(page: number = 1, pageSize: number = 6): Promise<PaginatedResponse<Cracha>> {
  try {
    console.log('🔍 Buscando crachás da API...', { page, pageSize });
    const res = await api.get(`/crachas/?page=${page}&page_size=${pageSize}`);
    console.log('✅ Crachás carregados com sucesso:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar crachás:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Dados:', error.response?.data);
    throw error;
  }
}

export async function createCracha(data: Partial<Cracha>): Promise<Cracha> {
  try {
    console.log('🔄 Criando crachá:', data);
    console.log('🔍 URL da requisição: /crachas/');
    console.log('🔍 Headers da requisição:', {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer [token]'
    });
    
    const res = await api.post('/crachas/', data);
    console.log('✅ Crachá criado com sucesso:', res.data);
    console.log('✅ Status da resposta:', res.status);
    console.log('✅ Headers da resposta:', res.headers);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar crachá:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Status Text:', error.response?.statusText);
    console.error('❌ Dados enviados:', data);
    console.error('❌ Resposta do servidor:', error.response?.data);
    console.error('❌ Headers da resposta:', error.response?.headers);
    console.error('❌ Config da requisição:', error.config);
    console.error('❌ Mensagem do erro:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Log detalhado para erro 400
    if (error.response?.status === 400) {
      console.error('🔍 ANÁLISE DETALHADA DO ERRO 400:');
      console.error('   - URL:', error.config?.url);
      console.error('   - Método:', error.config?.method);
      console.error('   - Headers enviados:', error.config?.headers);
      console.error('   - Dados brutos enviados:', JSON.stringify(data, null, 2));
      console.error('   - Resposta completa:', JSON.stringify(error.response?.data, null, 2));
    }
    
    // Se não há dados na resposta, tentar extrair mais informações
    if (!error.response?.data || Object.keys(error.response.data).length === 0) {
      console.error('❌ Resposta vazia - possíveis causas:');
      console.error('   - Problema de autenticação');
      console.error('   - Problema de permissão');
      console.error('   - Erro interno do servidor');
      console.error('   - Problema de validação');
    } else {
      // Analisar erros específicos
      if (error.response.data.numero) {
        console.error('❌ Erro no campo número:', error.response.data.numero);
        if (Array.isArray(error.response.data.numero)) {
          error.response.data.numero.forEach((err: string) => {
            if (err.includes('already exists')) {
              console.error('   → Número já existe no banco de dados');
            } else {
              console.error('   → Erro de validação:', err);
            }
          });
        }
      }
    }
    
    throw error;
  }
}

export async function updateCracha(id: string, data: Partial<Cracha>): Promise<Cracha> {
  try {
    console.log('🔄 Atualizando crachá:', { id, data });
    const res = await api.put(`/crachas/${id}/`, data);
    console.log('✅ Crachá atualizado com sucesso:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar crachá:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Dados enviados:', data);
    console.error('❌ Resposta do servidor:', error.response?.data);
    throw error;
  }
}

export async function deleteCracha(id: string): Promise<void> {
  try {
    console.log('🗑️ Excluindo crachá:', id);
    await api.delete(`/crachas/${id}/`);
    console.log('✅ Crachá excluído com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao excluir crachá:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Resposta do servidor:', error.response?.data);
    throw error;
  }
}

export async function getCrachaById(id: string): Promise<Cracha> {
  try {
    console.log('🔍 Buscando crachá por ID:', id);
    const res = await api.get(`/crachas/${id}/`);
    console.log('✅ Crachá encontrado:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar crachá por ID:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Resposta do servidor:', error.response?.data);
    throw error;
  }
}

export async function devolverCracha(id: string): Promise<Cracha> {
  try {
    console.log('🔄 Devolvendo crachá:', id);
    const res = await api.post(`/crachas/${id}/devolver/`, {});
    console.log('✅ Crachá devolvido com sucesso:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao devolver crachá:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Resposta do servidor:', error.response?.data);
    throw error;
  }
}