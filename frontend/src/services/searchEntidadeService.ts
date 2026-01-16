import api from './api';
import { Visitante } from '@/types/pessoa';

/**
 * Service para pesquisar entidades (empresas e representantes)
 */

/**
 * Pesquisa empresas por nome, NIF ou email
 * @param query - Termo de pesquisa
 * @returns Lista de empresas encontradas
 */
export const searchEmpresa = async (query: string): Promise<Visitante[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await api.get('/pessoas/visitantes/', {
      params: {
        search: query.trim(),
        tipo_pessoa: 'coletiva',
        page_size: 10, // Limitar a 10 resultados
      },
    });

    // A resposta pode ser paginada ou array direto
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return Array.isArray(response.data.results) ? response.data.results : [];
    }

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Erro ao pesquisar empresa:', error);
    return [];
  }
};

/**
 * Pesquisa representantes legais (pessoas singulares)
 * @param query - Termo de pesquisa (nome)
 * @returns Lista de pessoas singulares encontradas
 */
export const searchRepresentante = async (query: string): Promise<Visitante[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const response = await api.get('/pessoas/visitantes/', {
      params: {
        search: query.trim(),
        tipo_pessoa: 'singular',
        page_size: 10,
      },
    });

    // A resposta pode ser paginada ou array direto
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return Array.isArray(response.data.results) ? response.data.results : [];
    }

    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Erro ao pesquisar representante:', error);
    return [];
  }
};

/**
 * Verifica se um NIF já está cadastrado
 * @param nif - Número de Identificação Fiscal
 * @returns true se o NIF já existe, false caso contrário
 */
export const checkNIFExists = async (nif: string): Promise<boolean> => {
  try {
    if (!nif || nif.trim().length === 0) {
      return false;
    }

    const response = await api.get('/pessoas/visitantes/', {
      params: {
        nif: nif.trim(),
        tipo_pessoa: 'coletiva',
      },
    });

    // Verificar se retornou algum resultado
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      return Array.isArray(response.data.results) && response.data.results.length > 0;
    }

    return Array.isArray(response.data) && response.data.length > 0;
  } catch (error) {
    console.error('Erro ao verificar NIF:', error);
    return false;
  }
};

/**
 * Busca uma empresa específica por NIF
 * @param nif - Número de Identificação Fiscal
 * @returns Empresa encontrada ou null
 */
export const getEmpresaByNIF = async (nif: string): Promise<Visitante | null> => {
  try {
    if (!nif || nif.trim().length === 0) {
      return null;
    }

    const response = await api.get('/pessoas/visitantes/', {
      params: {
        nif: nif.trim(),
        tipo_pessoa: 'coletiva',
      },
    });

    let results: Visitante[] = [];

    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      results = Array.isArray(response.data.results) ? response.data.results : [];
    } else if (Array.isArray(response.data)) {
      results = response.data;
    }

    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Erro ao buscar empresa por NIF:', error);
    return null;
  }
};
