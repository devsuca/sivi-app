import api from './api';
import { Visitante } from '@/types/pessoa';

export const getVisitanteById = async (id: string): Promise<Visitante> => {
  try {
    console.log('🔍 Buscando visitante por ID:', id);
    
    const response = await api.get(`/pessoas/visitantes/${id}/`);
    
    console.log('✅ Visitante carregado:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar visitante:', error);
    throw error;
  }
};

export const getVisitantes = async (): Promise<Visitante[]> => {
  try {
    console.log('🔍 Buscando visitantes...');
    
    const response = await api.get('/pessoas/visitantes/?ordering=-data_registo');
    
    // Verificar se a resposta tem paginação
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      const visitantes = Array.isArray(response.data.results) ? response.data.results : [];
      console.log('✅ Visitantes carregados:', visitantes.length, 'de', response.data.count, 'total');
      console.log('📊 Estrutura da resposta:', {
        hasResults: 'results' in response.data,
        resultsLength: response.data.results?.length,
        totalCount: response.data.count,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous
      });
      return visitantes;
    } else {
      // Resposta não paginada (array direto)
      const visitantes = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Visitantes carregados (não paginado):', visitantes.length, 'registros');
      return visitantes;
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar visitantes:', error);
    
    // Fallback: tentar sem ordenação se o parâmetro não for suportado
    if (error.response?.status === 400) {
      console.log('⚠️ Tentando sem ordenação...');
      try {
        const response = await api.get('/pessoas/visitantes/');
        
        // Verificar se a resposta tem paginação
        if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const visitantes = Array.isArray(response.data.results) ? response.data.results : [];
          
          // Ordenar localmente por data de registro (mais recentes primeiro)
          const sortedData = visitantes.sort((a: Visitante, b: Visitante) => {
            const dateA = new Date(a.data_registo || a.id || 0);
            const dateB = new Date(b.data_registo || b.id || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('✅ Visitantes ordenados localmente:', sortedData.length, 'registros');
          return sortedData;
        } else {
          const visitantes = Array.isArray(response.data) ? response.data : [];
          
          // Ordenar localmente por data de registro (mais recentes primeiro)
          const sortedData = visitantes.sort((a: Visitante, b: Visitante) => {
            const dateA = new Date(a.data_registo || a.id || 0);
            const dateB = new Date(b.data_registo || b.id || 0);
            return dateB.getTime() - dateA.getTime();
          });
          
          console.log('✅ Visitantes ordenados localmente:', sortedData.length, 'registros');
          return sortedData;
        }
      } catch (fallbackError: any) {
        console.error('❌ Erro no fallback:', fallbackError);
        throw fallbackError;
      }
    }
    throw error;
  }
};

// Buscar o último visitante cadastrado (solução robusta)
export const getUltimoVisitante = async (): Promise<Visitante | null> => {
  try {
    console.log('🔍 Buscando último visitante cadastrado...');
    
    // Estratégia 1: Tentar ordenação por data_registo
    try {
      console.log('📋 Estratégia 1: Ordenação por data_registo');
      const response1 = await api.get('/pessoas/visitantes/?ordering=-data_registo&limit=1');
      if (response1.data && response1.data.length > 0) {
        const ultimo = response1.data[0];
        console.log('✅ Último visitante encontrado por data_registo:', ultimo);
        return ultimo;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 1 falhou:', error);
    }
    
    // Estratégia 2: Tentar ordenação por ID (UUIDs são ordenáveis)
    try {
      console.log('📋 Estratégia 2: Ordenação por ID');
      const response2 = await api.get('/pessoas/visitantes/?ordering=-id&limit=1');
      if (response2.data && response2.data.length > 0) {
        const ultimo = response2.data[0];
        console.log('✅ Último visitante encontrado por ID:', ultimo);
        return ultimo;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 2 falhou:', error);
    }
    
    // Estratégia 3: Buscar todos e ordenar localmente
    try {
      console.log('📋 Estratégia 3: Buscar todos e ordenar localmente');
      const response3 = await api.get('/pessoas/visitantes/');
      if (response3.data && response3.data.length > 0) {
        // Ordenar por data_registo se disponível, senão por ID
        const sorted = response3.data.sort((a: Visitante, b: Visitante) => {
          if (a.data_registo && b.data_registo) {
            return new Date(b.data_registo).getTime() - new Date(a.data_registo).getTime();
          }
          return b.id.localeCompare(a.id);
        });
        const ultimo = sorted[0];
        console.log('✅ Último visitante encontrado por ordenação local:', ultimo);
        return ultimo;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 3 falhou:', error);
    }
    
    console.log('❌ Todas as estratégias falharam');
    return null;
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar último visitante:', error);
    return null;
  }
};

// Função alternativa para buscar último visitante com múltiplas estratégias
export const getUltimoVisitanteAlternativo = async (): Promise<Visitante | null> => {
  try {
    console.log('🔍 Buscando último visitante com estratégia alternativa...');
    
    // Estratégia 1: Tentar ordenação por data_registo
    try {
      console.log('📋 Estratégia 1: Ordenação por data_registo');
      const response1 = await api.get('/pessoas/visitantes/?ordering=-data_registo&limit=1');
      if (response1.data && response1.data.length > 0) {
        console.log('✅ Sucesso com data_registo:', response1.data[0]);
        return response1.data[0];
      }
    } catch (error) {
      console.log('⚠️ Estratégia 1 falhou:', error);
    }
    
    // Estratégia 2: Tentar ordenação por ID (UUIDs são ordenáveis)
    try {
      console.log('📋 Estratégia 2: Ordenação por ID');
      const response2 = await api.get('/pessoas/visitantes/?ordering=-id&limit=1');
      if (response2.data && response2.data.length > 0) {
        console.log('✅ Sucesso com ID:', response2.data[0]);
        return response2.data[0];
      }
    } catch (error) {
      console.log('⚠️ Estratégia 2 falhou:', error);
    }
    
    // Estratégia 3: Buscar todos e ordenar localmente
    try {
      console.log('📋 Estratégia 3: Buscar todos e ordenar localmente');
      const response3 = await api.get('/pessoas/visitantes/');
      if (response3.data && response3.data.length > 0) {
        // Ordenar por data_registo se disponível, senão por ID
        const sorted = response3.data.sort((a: Visitante, b: Visitante) => {
          if (a.data_registo && b.data_registo) {
            return new Date(b.data_registo).getTime() - new Date(a.data_registo).getTime();
          }
          return b.id.localeCompare(a.id);
        });
        console.log('✅ Sucesso com ordenação local:', sorted[0]);
        return sorted[0];
      }
    } catch (error) {
      console.log('⚠️ Estratégia 3 falhou:', error);
    }
    
    console.log('❌ Todas as estratégias falharam');
    return null;
  } catch (error: any) {
    console.error('❌ Erro geral na busca alternativa:', error);
    return null;
  }
};

// Buscar o primeiro visitante cadastrado (mais antigo) - solução robusta
export const getPrimeiroVisitante = async (): Promise<Visitante | null> => {
  try {
    console.log('🔍 Buscando primeiro visitante cadastrado...');
    
    // Estratégia 1: Tentar ordenação por data_registo (ascendente)
    try {
      console.log('📋 Estratégia 1: Ordenação por data_registo (ascendente)');
      const response1 = await api.get('/pessoas/visitantes/?ordering=data_registo&limit=1');
      if (response1.data && response1.data.length > 0) {
        const primeiro = response1.data[0];
        console.log('✅ Primeiro visitante encontrado por data_registo:', primeiro);
        return primeiro;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 1 falhou:', error);
    }
    
    // Estratégia 2: Tentar ordenação por ID (ascendente)
    try {
      console.log('📋 Estratégia 2: Ordenação por ID (ascendente)');
      const response2 = await api.get('/pessoas/visitantes/?ordering=id&limit=1');
      if (response2.data && response2.data.length > 0) {
        const primeiro = response2.data[0];
        console.log('✅ Primeiro visitante encontrado por ID:', primeiro);
        return primeiro;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 2 falhou:', error);
    }
    
    // Estratégia 3: Buscar todos e ordenar localmente
    try {
      console.log('📋 Estratégia 3: Buscar todos e ordenar localmente');
      const response3 = await api.get('/pessoas/visitantes/');
      if (response3.data && response3.data.length > 0) {
        // Ordenar por data_registo se disponível, senão por ID (ascendente)
        const sorted = response3.data.sort((a: Visitante, b: Visitante) => {
          if (a.data_registo && b.data_registo) {
            return new Date(a.data_registo).getTime() - new Date(b.data_registo).getTime();
          }
          return a.id.localeCompare(b.id);
        });
        const primeiro = sorted[0];
        console.log('✅ Primeiro visitante encontrado por ordenação local:', primeiro);
        return primeiro;
      }
    } catch (error) {
      console.log('⚠️ Estratégia 3 falhou:', error);
    }
    
    console.log('❌ Todas as estratégias falharam');
    return null;
  } catch (error: any) {
    console.error('❌ Erro geral ao buscar primeiro visitante:', error);
    return null;
  }
};

// Função de debug para verificar ordenação
export const debugVisitantesOrdering = async (): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Verificando ordenação de visitantes...');
    
    // Buscar todos os visitantes sem ordenação
    const response = await api.get('/pessoas/visitantes/');
    const visitantes = response.data;
    
    console.log('📊 Todos os visitantes (sem ordenação):');
    visitantes.forEach((visitante: Visitante, index: number) => {
      console.log(`${index + 1}. ${visitante.nome || visitante.designacao_social} - Data: ${visitante.data_registo} - ID: ${visitante.id}`);
    });
    
    // Ordenar localmente por data_registo
    const sortedByDataRegisto = [...visitantes].sort((a, b) => {
      const dateA = new Date(a.data_registo || 0);
      const dateB = new Date(b.data_registo || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('📊 Visitantes ordenados por data_registo (local):');
    sortedByDataRegisto.forEach((visitante, index) => {
      console.log(`${index + 1}. ${visitante.nome || visitante.designacao_social} - Data: ${visitante.data_registo} - ID: ${visitante.id}`);
    });
    
    // Ordenar localmente por ID (como fallback)
    const sortedById = [...visitantes].sort((a, b) => {
      return b.id.localeCompare(a.id);
    });
    
    console.log('📊 Visitantes ordenados por ID (local):');
    sortedById.forEach((visitante, index) => {
      console.log(`${index + 1}. ${visitante.nome || visitante.designacao_social} - Data: ${visitante.data_registo} - ID: ${visitante.id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro no debug de ordenação:', error);
  }
};

export const searchVisitanteByDocument = async (documentoNumero: string): Promise<Visitante | null> => {
  try {
    if (!documentoNumero || !documentoNumero.trim()) {
      return null;
    }

    // Tentar diferentes variações do documento
    const variacoes = [
      documentoNumero.trim(), // Sem espaços
      documentoNumero.replace(/\s+/g, ''), // Sem espaços
      documentoNumero.toUpperCase(), // Maiúsculas
      documentoNumero.toLowerCase(), // Minúsculas
    ];
    
    for (const variacao of variacoes) {
      if (!variacao) continue;
      
      try {
        const url = `/pessoas/visitantes/?documento_numero=${encodeURIComponent(variacao)}`;
        const response = await api.get(url);
        
        // Verificar se a resposta tem paginação
        if (response.data && typeof response.data === 'object' && 'results' in response.data) {
          const visitantes = Array.isArray(response.data.results) ? response.data.results : [];
          if (visitantes.length > 0) {
            return visitantes[0];
          }
        } else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0];
        }
      } catch (searchError) {
        // Continuar para próxima variação se esta falhar
        continue;
      }
    }
    
    return null;
  } catch (error: any) {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error("Erro ao pesquisar visitante por documento:", error);
    }
    return null;
  }
};

export const createVisitante = async (data: Partial<Visitante>): Promise<Visitante> => {
  try {
    console.log('🔍 Criando visitante com dados:', data);
    console.log('🔍 Campos de data específicos:', {
      data_nascimento: data.data_nascimento,
      documento_emissao: data.documento_emissao,
      documento_validade: data.documento_validade
    });
    
    // Validar datas antes de enviar
    const validateDateField = (fieldName: string, value: any) => {
      if (value && typeof value === 'string') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          console.warn(`⚠️ Campo ${fieldName} não está no formato YYYY-MM-DD:`, value);
        } else {
          console.log(`✅ Campo ${fieldName} está no formato correto:`, value);
        }
      } else if (value) {
        console.warn(`⚠️ Campo ${fieldName} não é string:`, typeof value, value);
      }
    };
    
    validateDateField('data_nascimento', data.data_nascimento);
    validateDateField('documento_emissao', data.documento_emissao);
    validateDateField('documento_validade', data.documento_validade);
    
    const response = await api.post('/pessoas/visitantes/', data);
    console.log('✅ Visitante criado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar visitante:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Dados enviados:', data);
    console.error('❌ Resposta do servidor:', error.response?.data);
    
    // Log específico para erros de data
    if (error.response?.data) {
      const errorData = error.response.data;
      if (typeof errorData === 'object') {
        Object.entries(errorData).forEach(([field, messages]) => {
          if (field.includes('data') || field.includes('validade') || field.includes('emissao')) {
            console.error(`❌ Erro específico no campo ${field}:`, messages);
          }
        });
      }
    }
    
    throw error;
  }
};

export const updateVisitante = async (id: string, data: Partial<Visitante>): Promise<Visitante> => {
  const response = await api.put(`/pessoas/visitantes/${id}/`, data);
  return response.data;
};

export const deleteVisitante = async (id: string): Promise<void> => {
  await api.delete(`/pessoas/visitantes/${id}/`);
};
