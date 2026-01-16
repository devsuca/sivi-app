import api from './api';
import { Orgao } from '@/types/orgao';
import { extractDataFromResponse } from '@/utils/apiUtils';

// Buscar todos os órgãos
export const getOrgaos = async (): Promise<Orgao[]> => {
  try {
    console.log('🔍 Buscando órgãos da API...');
    const response = await api.get('/orgaos/');
    const orgaos = extractDataFromResponse(response.data);
    console.log('✅ Órgãos carregados:', orgaos.length, 'registros');
    return orgaos;
  } catch (error: any) {
    console.error('❌ Erro ao buscar órgãos:', error);
    throw error;
  }
};

// Buscar órgão por ID
export const getOrgaoById = async (id: string): Promise<Orgao | null> => {
  try {
    console.log('🔍 Buscando órgão por ID:', id);
    const response = await api.get(`/orgaos/${id}/`);
    console.log('✅ Órgão encontrado:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar órgão por ID:', error);
    return null;
  }
};

// Buscar órgãos com filtros
export const getOrgaosWithFilters = async (filters?: {
  nome?: string;
  sigla?: string;
  bloco?: string;
}): Promise<Orgao[]> => {
  try {
    console.log('🔍 Buscando órgãos com filtros:', filters);
    
    let url = '/orgaos/';
    const params = new URLSearchParams();
    
    if (filters?.nome) params.append('nome__icontains', filters.nome);
    if (filters?.sigla) params.append('sigla__icontains', filters.sigla);
    if (filters?.bloco) params.append('bloco__icontains', filters.bloco);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    const orgaos = extractDataFromResponse(response.data);
    console.log('✅ Órgãos encontrados com filtros:', orgaos.length, 'registros');
    return orgaos;
  } catch (error: any) {
    console.error('❌ Erro ao buscar órgãos com filtros:', error);
    throw error;
  }
};

// Buscar órgãos visitados por um visitante (dados reais)
export const getOrgaosVisitadosReais = async (visitanteId: string): Promise<{ orgao: Orgao; quantidade: number }[]> => {
  try {
    console.log('🔍 Buscando órgãos visitados reais para visitante:', visitanteId);
    
    // Tentar múltiplas estratégias de busca
    const strategies = [
      `/visitas/?visitante=${visitanteId}`,
      `/visitas/?visitante=${visitanteId}&expand=orgao`,
      `/visitas/?visitante=${visitanteId}&include=orgao`,
      `/visitas/?visitante=${visitanteId}&select_related=orgao`,
      `/visitas/?visitante=${visitanteId}&prefetch_related=orgao`
    ];
    
    let visitas: any[] = [];
    let strategyUsed = '';
    
    for (const strategy of strategies) {
      try {
        console.log(`🔄 Tentando estratégia: ${strategy}`);
        const response = await api.get(strategy);
        if (response.data && response.data.length > 0) {
          visitas = response.data;
          strategyUsed = strategy;
          console.log(`✅ Sucesso com estratégia: ${strategy}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ Estratégia ${strategy} falhou:`, error);
      }
    }
    
    console.log('📊 Visitas encontradas:', visitas.length, 'usando estratégia:', strategyUsed);
    
    if (visitas.length === 0) {
      console.log('⚠️ Nenhuma visita encontrada');
      return [];
    }
    
    // Log detalhado das visitas
    visitas.forEach((visita, index) => {
      console.log(`📋 Visita ${index + 1}:`, {
        id: visita.id,
        orgao: visita.orgao,
        tipo_orgao: typeof visita.orgao,
        orgao_null: visita.orgao == null,
        orgao_vazio: visita.orgao === '',
        orgao_string_null: visita.orgao === 'null'
      });
    });
    
    // Extrair IDs únicos de órgãos das visitas
    const orgaoIds = new Set<string>();
    visitas.forEach((visita: any) => {
      if (visita.orgao) {
        const orgaoId = typeof visita.orgao === 'string' ? visita.orgao : visita.orgao.id;
        if (orgaoId && 
            orgaoId !== 'null' && 
            orgaoId !== 'undefined' && 
            orgaoId !== '' &&
            orgaoId !== null &&
            orgaoId !== undefined) {
          orgaoIds.add(orgaoId);
          console.log(`🔍 Órgão ID encontrado: ${orgaoId}`);
        }
      }
    });
    
    console.log('📊 IDs de órgãos únicos encontrados:', Array.from(orgaoIds));
    
    if (orgaoIds.size === 0) {
      console.log('⚠️ Nenhum órgão válido encontrado nas visitas');
      return [];
    }
    
    // Buscar dados completos dos órgãos
    const orgaosCompletos: { orgao: Orgao; quantidade: number }[] = [];
    
    for (const orgaoId of orgaoIds) {
      try {
        const orgao = await getOrgaoById(orgaoId);
        if (orgao) {
          // Contar quantas vezes este órgão foi visitado
          const quantidade = visitas.filter((visita: any) => {
            const visitaOrgaoId = typeof visita.orgao === 'string' ? visita.orgao : visita.orgao?.id;
            return visitaOrgaoId === orgaoId;
          }).length;
          
          orgaosCompletos.push({
            orgao,
            quantidade
          });
          
          console.log(`✅ Órgão ${orgao.nome} (${orgao.sigla}): ${quantidade} visita(s)`);
        }
      } catch (error) {
        console.error(`❌ Erro ao buscar órgão ${orgaoId}:`, error);
      }
    }
    
    console.log('✅ Órgãos visitados reais encontrados:', orgaosCompletos);
    return orgaosCompletos;
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar órgãos visitados reais:', error);
    return [];
  }
};

// Criar novo órgão
export const createOrgao = async (data: Partial<Orgao>): Promise<Orgao> => {
  try {
    console.log('🔍 Criando novo órgão:', data);
    const response = await api.post('/orgaos/', data);
    console.log('✅ Órgão criado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar órgão:', error);
    throw error;
  }
};

// Atualizar órgão existente
export const updateOrgao = async (id: string, data: Partial<Orgao>): Promise<Orgao> => {
  try {
    console.log('🔍 Atualizando órgão:', id, data);
    const response = await api.put(`/orgaos/${id}/`, data);
    console.log('✅ Órgão atualizado com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar órgão:', error);
    throw error;
  }
};

// Excluir órgão
export const deleteOrgao = async (id: string): Promise<void> => {
  try {
    console.log('🔍 Excluindo órgão:', id);
    await api.delete(`/orgaos/${id}/`);
    console.log('✅ Órgão excluído com sucesso');
  } catch (error: any) {
    console.error('❌ Erro ao excluir órgão:', error);
    throw error;
  }
};