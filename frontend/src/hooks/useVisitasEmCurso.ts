import { useState, useEffect } from 'react';
import { getVisitasEmCurso } from '@/services/visitaService';
import { Visita } from '@/types/visita';
import { useAuth } from '@/lib/auth';

export function useVisitasEmCurso() {
  const [visitasEmCurso, setVisitasEmCurso] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchVisitasEmCurso = async () => {
    // Usuários de Recepção não podem visualizar visitas em curso
    if (user?.role === 'recepcao') {
      setVisitasEmCurso([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Verificar se o usuário está autenticado
    if (!user) {
      console.warn('⚠️ Usuário não autenticado, pulando busca de visitas em curso');
      setVisitasEmCurso([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Verificar se há token válido
    const token = localStorage.getItem('accessToken');
    if (!token || !token.startsWith('eyJ') || token.length < 50) {
      console.warn('⚠️ Token inválido ou ausente, pulando busca de visitas em curso');
      setVisitasEmCurso([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const visitas = await getVisitasEmCurso();
      setVisitasEmCurso(visitas);
      console.log('🔔 Visitas em curso carregadas:', visitas.length);
    } catch (err: any) {
      // Se for erro 401, não logar como erro (pode ser token expirado)
      if (err.response?.status === 401) {
        console.warn('🔑 Token expirado ou inválido, aguardando refresh automático...');
        setError(null);
        setVisitasEmCurso([]);
      } else if (err.isAuthError) {
        console.warn('🔑 Erro de autenticação, aguardando resolução...');
        setError(null);
        setVisitasEmCurso([]);
      } else if (err.isNetworkError) {
        console.warn('🌐 Erro de rede, aguardando conectividade...');
        setError(null);
        setVisitasEmCurso([]);
      } else {
        console.error('Erro ao carregar visitas em curso:', err);
        setError('Erro ao carregar visitas em curso');
        setVisitasEmCurso([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Só fazer a busca se o usuário estiver autenticado e não for recepção
    if (user && user.role !== 'recepcao') {
      fetchVisitasEmCurso();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(fetchVisitasEmCurso, 30000);
      return () => clearInterval(interval);
    } else {
      // Se não estiver autenticado ou for recepção, limpar dados
      setVisitasEmCurso([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  return {
    visitasEmCurso,
    loading,
    error,
    refetch: fetchVisitasEmCurso,
    count: visitasEmCurso.length
  };
}
