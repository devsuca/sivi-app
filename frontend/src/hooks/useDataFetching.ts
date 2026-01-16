
import { useState, useEffect } from 'react';
import { getVisitantes } from '@/services/pessoaService';
import { getOrgaos } from '@/services/orgaoService';
import { getEfetivos } from '@/services/efetivoService';
import { Visitante } from '@/types/pessoa';
import { Orgao } from '@/types/orgao';
import { Efetivo } from '@/types/efetivo';

export interface FetchedData {
  visitantes: Visitante[];
  orgaos: Orgao[];
  efetivos: Efetivo[];
}

export function useDataFetching() {
  const [data, setData] = useState<FetchedData>({ visitantes: [], orgaos: [], efetivos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [visitantesData, orgaosData, efetivosData] = await Promise.all([
          getVisitantes(),
          getOrgaos(),
          getEfetivos(),
        ]);
        
        console.log('🔍 Dados carregados no hook:', {
          visitantes: Array.isArray(visitantesData) ? visitantesData.length : 'não é array',
          orgaos: Array.isArray(orgaosData) ? orgaosData.length : 'não é array',
          efetivos: Array.isArray(efetivosData) ? efetivosData.length : 'não é array'
        });
        
        setData({
          visitantes: Array.isArray(visitantesData) ? visitantesData : [],
          orgaos: Array.isArray(orgaosData) ? orgaosData : [],
          efetivos: Array.isArray(efetivosData) ? efetivosData : [],
        });
      } catch (err) {
        setError('Erro ao carregar dados iniciais.');
        console.error('❌ Erro no useDataFetching:', err);
        // Em caso de erro, garantir que todos sejam arrays vazios
        setData({
          visitantes: [],
          orgaos: [],
          efetivos: [],
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { ...data, setData, loading, error };
}
