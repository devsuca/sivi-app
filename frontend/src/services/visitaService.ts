import api from './api';
import { Visita } from '@/types/visita';
import { getOrgaosVisitadosReais } from './orgaoService';
import { Cracha } from '@/types/cracha';

export const getVisitaById = async (id: string): Promise<Visita> => {
  const response = await api.get(`/visitas/${id}/`);
  return response.data;
};

// Buscar a última visita registrada
export const getUltimaVisita = async (): Promise<Visita | null> => {
  try {
    console.log('🔍 Buscando última visita...');
    const response = await api.get('/visitas/?ordering=-data_entrada&limit=1');
    const visitas = response.data;
    
    if (visitas && visitas.length > 0) {
      console.log('✅ Última visita encontrada:', visitas[0]);
      return visitas[0];
    }
    
    console.log('⚠️ Nenhuma visita encontrada');
    return null;
  } catch (error: any) {
    console.error('❌ Erro ao buscar última visita:', error);
    throw error;
  }
};

export const getVisitas = async (): Promise<Visita[]> => {
  try {
    console.log('🔍 Buscando visitas...');
    const response = await api.get('/visitas/?ordering=-data_hora_entrada');
    
    // Verificar se a resposta tem paginação
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      const visitas = Array.isArray(response.data.results) ? response.data.results : [];
      console.log('✅ Visitas carregadas:', visitas.length, 'de', response.data.count, 'total');
      console.log('📊 Estrutura da resposta:', {
        hasResults: 'results' in response.data,
        resultsLength: response.data.results?.length,
        totalCount: response.data.count,
        hasNext: !!response.data.next,
        hasPrevious: !!response.data.previous
      });
      return visitas;
    } else {
      // Resposta não paginada (array direto)
      const visitas = Array.isArray(response.data) ? response.data : [];
      console.log('✅ Visitas carregadas (não paginado):', visitas.length, 'registros');
      return visitas;
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar visitas:', error);
    if (error?.response?.status === 403) {
      throw new Error('Acesso negado: seu usuário não possui vínculo de efetivo ou órgão. Solicite ao administrador.');
    }
    if (error?.response?.status === 500) {
      throw new Error('Erro interno no servidor. Tente novamente ou contate o suporte.');
    }
    throw error;
  }
};

export const getVisitasByVisitante = async (visitanteId: string): Promise<Visita[]> => {
  // Validação extra para evitar erro 500 se id for inválido
  if (!visitanteId || visitanteId === 'undefined' || visitanteId === 'null') {
    console.error('getVisitasByVisitante: visitanteId inválido', visitanteId);
    return [];
  }
  // Regex para UUID v4
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!uuidRegex.test(visitanteId)) {
    console.error('getVisitasByVisitante: visitanteId não é UUID', visitanteId);
    return [];
  }
  try {
    // Tentar buscar com expansão de órgãos
    const response = await api.get<Visita[]>(`/visitas/?visitante=${visitanteId}&expand=orgao`);
    console.log('📊 Resposta da API com expand=orgao:', response.data);
    return response.data;
  } catch (error) {
    console.log('⚠️ Tentativa com expand falhou, tentando sem expand...');
    try {
      const response = await api.get<Visita[]>(`/visitas/?visitante=${visitanteId}`);
      console.log('📊 Resposta da API sem expand:', response.data);
      return response.data;
    } catch (error2) {
      console.error('getVisitasByVisitante: erro na requisição', error2, 'visitanteId:', visitanteId);
      throw error2;
    }
  }
};

// Buscar órgãos visitados por um visitante (apenas dados reais)
export const getOrgaosVisitadosByVisitante = async (visitanteId: string): Promise<{ orgao: any; quantidade: number }[]> => {
  try {
    console.log('🔍 Buscando órgãos visitados reais pelo visitante:', visitanteId);
    
    // Buscar dados reais dos órgãos
    const orgaosReais = await getOrgaosVisitadosReais(visitanteId);
    
    if (orgaosReais.length > 0) {
      console.log('✅ Dados reais dos órgãos encontrados:', orgaosReais);
      return orgaosReais;
    }
    
    console.log('⚠️ Nenhum órgão real encontrado, tentando método alternativo...');
    
    // Buscar todas as visitas do visitante
    const visitas = await getVisitasByVisitante(visitanteId);
    console.log('📊 Visitas encontradas:', visitas.length);
    
    if (visitas.length === 0) {
      console.log('⚠️ Nenhuma visita encontrada');
      return [];
    }
    
    // Contar órgãos únicos das visitas (apenas dados reais)
    const orgaosMap = new Map<string, { orgao: any; quantidade: number }>();
    
    visitas.forEach((visita, index) => {
      console.log(`🔍 Processando visita ${index + 1}:`, visita);
      console.log(`🔍 Órgão da visita:`, visita.orgao);
      
      // Verificação mais robusta de órgão válido
      if (visita.orgao && 
          visita.orgao !== '' && 
          visita.orgao !== null && 
          visita.orgao !== undefined &&
          visita.orgao !== 'null' &&
          visita.orgao !== 'undefined') {
        
        const orgaoId = typeof visita.orgao === 'string' ? visita.orgao : visita.orgao.id;
        const orgaoNome = typeof visita.orgao === 'string' ? orgaoId : visita.orgao.nome;
        
        console.log(`🔍 Órgão ID: ${orgaoId}, Nome: ${orgaoNome}`);
        
        if (orgaosMap.has(orgaoId)) {
          orgaosMap.get(orgaoId)!.quantidade++;
        } else {
          orgaosMap.set(orgaoId, {
            orgao: typeof visita.orgao === 'string' ? { id: orgaoId, nome: orgaoNome } : visita.orgao,
            quantidade: 1
          });
        }
      }
    });
    
    const orgaosVisitados = Array.from(orgaosMap.values());
    console.log('✅ Órgãos visitados encontrados:', orgaosVisitados);
    
    // Retornar apenas dados reais - sem dados fictícios
    if (orgaosVisitados.length === 0) {
      console.log('ℹ️ Nenhum órgão visitado encontrado para este visitante');
    }
    
    return orgaosVisitados;
  } catch (error) {
    console.error('❌ Erro ao buscar órgãos visitados:', error);
    return [];
  }
};

// Função de debug para verificar dados de visitas
export const debugVisitasData = async (visitanteId: string): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Verificando dados de visitas para visitante:', visitanteId);
    
    const visitas = await getVisitasByVisitante(visitanteId);
    console.log('📊 Total de visitas encontradas:', visitas.length);
    
    if (visitas.length > 0) {
      console.log('📋 Primeira visita (exemplo):', visitas[0]);
      console.log('📋 Estrutura da primeira visita:');
      console.log('  - ID:', visitas[0].id);
      console.log('  - Número:', visitas[0].numero);
      console.log('  - Visitante:', visitas[0].visitante);
      console.log('  - Órgão:', visitas[0].orgao);
      console.log('  - Tipo do órgão:', typeof visitas[0].orgao);
      console.log('  - Efetivo:', visitas[0].efetivo_visitar);
      console.log('  - Estado:', visitas[0].estado);
      console.log('  - Data entrada:', visitas[0].data_hora_entrada);
      
      // Verificar todas as visitas
      let visitasComOrgao = 0;
      let visitasSemOrgao = 0;
      
      visitas.forEach((visita, index) => {
        console.log(`📋 Visita ${index + 1}:`);
        console.log(`  - Órgão:`, visita.orgao);
        console.log(`  - Tipo:`, typeof visita.orgao);
        console.log(`  - Órgão é null/undefined:`, visita.orgao == null);
        console.log(`  - Órgão é string vazia:`, visita.orgao === '');
        console.log(`  - Órgão é "null" string:`, visita.orgao === 'null');
        console.log(`  - Órgão é "undefined" string:`, visita.orgao === 'undefined');
        
        if (visita.orgao && 
            visita.orgao !== '' && 
            visita.orgao !== null && 
            visita.orgao !== undefined &&
            visita.orgao !== 'null' &&
            visita.orgao !== 'undefined') {
          visitasComOrgao++;
          if (typeof visita.orgao === 'object') {
            console.log(`  - Órgão ID:`, visita.orgao.id);
            console.log(`  - Órgão Nome:`, visita.orgao.nome);
            console.log(`  - Órgão Sigla:`, visita.orgao.sigla);
          } else {
            console.log(`  - Órgão como string:`, visita.orgao);
          }
        } else {
          visitasSemOrgao++;
          console.log(`  - ⚠️ Visita sem órgão válido`);
        }
      });
      
      console.log(`📊 Resumo: ${visitasComOrgao} visitas com órgão, ${visitasSemOrgao} visitas sem órgão`);
      
      // Se não encontrou órgãos, tentar buscar com diferentes parâmetros
      if (visitasComOrgao === 0) {
        console.log('🔄 Tentando buscar visitas com parâmetros diferentes...');
        try {
          const response1 = await api.get(`/visitas/?visitante=${visitanteId}&expand=orgao`);
          console.log('📊 Resposta com expand=orgao:', response1.data);
          
          const response2 = await api.get(`/visitas/?visitante=${visitanteId}&include=orgao`);
          console.log('📊 Resposta com include=orgao:', response2.data);
          
          const response3 = await api.get(`/visitas/?visitante=${visitanteId}&select_related=orgao`);
          console.log('📊 Resposta com select_related=orgao:', response3.data);
        } catch (error) {
          console.log('⚠️ Tentativas alternativas falharam:', error);
        }
      }
    } else {
      console.log('⚠️ Nenhuma visita encontrada para este visitante');
    }
  } catch (error) {
    console.error('❌ Erro no debug de visitas:', error);
  }
};

// Busca visitas em curso para notificações
export const getVisitasEmCurso = async (): Promise<Visita[]> => {
  try {
    console.log('🔍 Buscando visitas em curso...');
    
    // Verificar se há token de autenticação
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('⚠️ Nenhum token de autenticação encontrado');
      return [];
    }
    
    // Validar formato do token
    if (!token.startsWith('eyJ') || token.length < 50) {
      console.warn('⚠️ Token inválido detectado, removendo...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return [];
    }
    
    console.log('🔑 Token válido encontrado, fazendo requisição para /visitas/em_curso/...');
    console.log('🔍 Detalhes da requisição:', {
      url: '/visitas/em_curso/',
      method: 'GET',
      hasToken: !!token,
      tokenLength: token.length,
      tokenStart: token.substring(0, 20) + '...',
      timestamp: new Date().toISOString()
    });
    
    const response = await api.get('/visitas/em_curso/');
    console.log('✅ Visitas em curso carregadas:', {
      count: response.data?.length || 0,
      data: response.data,
      timestamp: new Date().toISOString()
    });
    return response.data || [];
  } catch (error: any) {
    // Log detalhado do erro com mais informações
    const errorDetails = {
      type: 'VisitasEmCursoError',
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ Erro detalhado ao buscar visitas em curso:', errorDetails);
    
    // Tratamento específico por tipo de erro
    if (error.response?.status === 400) {
      console.error('❌ Erro 400 - Bad Request:', {
        possibleCauses: [
          'Endpoint não encontrado ou mal configurado',
          'Parâmetros inválidos na requisição',
          'Problema de permissão do usuário',
          'Erro de validação no backend'
        ],
        responseData: error.response?.data,
        suggestion: 'Verificar se o endpoint /visitas/em_curso/ está funcionando no backend'
      });
    } else if (error.response?.status === 401) {
      console.warn('🔑 Token expirado ou inválido para visitas em curso, aguardando refresh automático...');
    } else if (error.response?.status === 403) {
      console.error('❌ Erro 403 - Forbidden:', {
        possibleCauses: [
          'Usuário não tem permissão para acessar visitas em curso',
          'Perfil do usuário não permite visualizar este endpoint',
          'Restrição de órgão aplicada'
        ],
        userProfile: 'Verificar perfil do usuário e permissões',
        suggestion: 'Usuário pode não ter perfil adequado (admin, portaria, secretaria)'
      });
    } else if (error.response?.status === 404) {
      console.error('❌ Erro 404 - Not Found:', {
        possibleCauses: [
          'Endpoint /visitas/em_curso/ não existe no backend',
          'URL incorreta na requisição',
          'Rota não configurada corretamente'
        ],
        suggestion: 'Verificar se o endpoint está registrado nas URLs do backend'
      });
    } else if (error.response?.status === 500) {
      console.error('❌ Erro 500 - Internal Server Error:', {
        possibleCauses: [
          'Erro interno no servidor',
          'Problema na lógica do endpoint',
          'Erro de banco de dados'
        ],
        suggestion: 'Verificar logs do backend para mais detalhes'
      });
    } else if (error.isAuthError) {
      console.warn('🔑 Erro de autenticação, aguardando resolução...');
    } else if (error.isNetworkError) {
      console.warn('🌐 Erro de rede, aguardando conectividade...');
    } else {
      console.error('❌ Erro desconhecido ao buscar visitas em curso:', error);
    }
    
    return [];
  }
};

export const createVisita = async (data: Partial<Visita>): Promise<Visita> => {
  // Sanitização e tipagem do payload conforme serializer do backend
  const sanitized: any = {
    visitante: data.visitante ? String(data.visitante) : undefined, // UUID
    orgao: data.orgao != null && data.orgao !== '' ? Number(data.orgao as any) : undefined, // integer
    efetivo_visitar: data.efetivo_visitar != null && data.efetivo_visitar !== '' ? Number(data.efetivo_visitar as any) : undefined, // integer | null
    motivo: data.motivo ?? '',
    estado: data.estado || undefined,
    observacoes: data.observacoes || undefined,
    acompanhantes: Array.isArray((data as any).acompanhantes)
      ? (data as any).acompanhantes.filter((a: any) => a && a.nome && a.documento_tipo && a.documento_numero)
      : undefined,
    viaturas: Array.isArray((data as any).viaturas)
      ? (data as any).viaturas.filter((v: any) => v && (v.marca || v.matricula || v.tipo || v.cor))
      : undefined,
  };

  // Remover chaves undefined para evitar validações desnecessárias
  Object.keys(sanitized).forEach((k) => sanitized[k] === undefined && delete sanitized[k]);

  const response = await api.post('/visitas/', sanitized);
  return response.data;
};

export const updateVisita = async (id: string, data: Partial<Visita>): Promise<Visita> => {
  try {
    console.log('🔄 Atualizando visita:', { id, data });
    
    // Sanitizar dados antes de enviar
    const sanitizedData = {
      ...data,
      // Garantir que campos de data estejam no formato correto
      data_hora_entrada: data.data_hora_entrada ? new Date(data.data_hora_entrada).toISOString() : data.data_hora_entrada,
      data_hora_saida: data.data_hora_saida ? new Date(data.data_hora_saida).toISOString() : data.data_hora_saida,
    };
    
    console.log('📤 Dados sanitizados para envio:', sanitizedData);
    
    const response = await api.put(`/visitas/${id}/`, sanitizedData);
    
    console.log('✅ Visita atualizada com sucesso:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar visita:', error);
    console.error('❌ Status:', error.response?.status);
    console.error('❌ Dados enviados:', data);
    console.error('❌ Resposta do servidor:', error.response?.data);
    throw error;
  }
};

export const deleteVisita = async (id: string): Promise<void> => {
  await api.delete(`/visitas/${id}/`);
};

// Atribui uma lista de crachás (por id) a uma visita específica
// Backend: POST /visitas/{id}/atribuir-crachas/  { cracha_ids: number[] }
export async function assignCrachasToVisita(
  visitaId: string,
  crachaIds: Array<number | string>
): Promise<{ status: string; crachas?: Array<string | number>; erros?: string[] }> {
  try {
    console.log('🔄 Atribuindo crachás à visita:', { visitaId, crachaIds });
    
    const payload = {
      cracha_ids: crachaIds.map((c) => (typeof c === 'string' ? Number(c) : c)).filter((n) => Number.isFinite(n)),
    };
    
    console.log('📤 Payload enviado:', payload);
    
    const res = await api.post(`/visitas/${visitaId}/atribuir-crachas/`, payload);
    
    console.log('✅ Resposta da API:', res.data);
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro na atribuição de crachás:', error);
    
    if (error.response?.status === 403) {
      throw new Error('Acesso negado: você não tem permissão para associar crachás a visitas.');
    } else if (error.response?.status === 404) {
      throw new Error('Visita não encontrada.');
    } else if (error.response?.data) {
      // Retornar erro do backend
      return {
        status: 'error',
        erros: [error.response.data.detail || 'Erro ao atribuir crachás']
      };
    } else {
      throw new Error('Erro ao atribuir crachás à visita. Tente novamente.');
    }
  }
}

// Verifica se uma visita tem crachás associados
export async function getVisitaCrachas(visitaId: string): Promise<any[]> {
  try {
    console.log('🔍 Buscando crachás para visita:', visitaId);
    // Usar o endpoint específico para buscar crachás da visita
    const response = await api.get(`/visitas/${visitaId}/crachas/`);
    const crachas = response.data || [];
    
    console.log('🔍 Crachás encontrados para visita:', crachas.length);
    console.log('🔍 Crachás associados:', crachas.map((c: any) => c.numero));
    
    return crachas;
  } catch (error) {
    console.error('Erro ao buscar crachás da visita:', error);
    return [];
  }
}

// Finaliza a visita. Se houver crachás associados, deve enviar { devolver_cracha: true }
export async function finalizeVisita(visitaId: string, options?: { devolver_cracha?: boolean }) {
  console.log('Enviando requisição para finalizar visita:', {
    url: `/visitas/${visitaId}/finalizar/`,
    data: options || {}
  });
  
  const res = await api.post(`/visitas/${visitaId}/finalizar/`, options || {});
  return res.data;
}

// Busca acompanhantes por número de documento
export async function searchAcompanhanteByDocument(documentoNumero: string): Promise<any[]> {
  try {
    const response = await api.get(`/visitas/buscar_acompanhante_por_documento/?documento_numero=${documentoNumero}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao pesquisar acompanhante por documento:", error);
    return [];
  }
}

// Função de diagnóstico específica para o endpoint de visitas em curso
export const diagnoseVisitasEmCurso = async (): Promise<void> => {
  try {
    console.log('🔍 === DIAGNÓSTICO: VISITAS EM CURSO ===');
    
    // 1. Verificar token
    const token = localStorage.getItem('accessToken');
    console.log('1️⃣ Verificando token:', {
      hasToken: !!token,
      tokenValid: token && token.startsWith('eyJ') && token.length > 50,
      tokenLength: token?.length || 0
    });
    
    // 2. Testar endpoint básico de visitas
    console.log('2️⃣ Testando endpoint básico /visitas/...');
    try {
      const response = await api.get('/visitas/');
      console.log('✅ Endpoint básico funcionando:', {
        status: response.status,
        count: response.data?.length || 0
      });
    } catch (error: any) {
      console.error('❌ Erro no endpoint básico:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    // 3. Testar endpoint específico de visitas em curso
    console.log('3️⃣ Testando endpoint específico /visitas/em_curso/...');
    try {
      const response = await api.get('/visitas/em_curso/');
      console.log('✅ Endpoint em_curso funcionando:', {
        status: response.status,
        count: response.data?.length || 0,
        data: response.data
      });
    } catch (error: any) {
      console.error('❌ Erro no endpoint em_curso:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
      
      // Análise específica do erro
      if (error.response?.status === 400) {
        console.error('🔍 Análise do erro 400:', {
          possibleCauses: [
            'Problema de permissão do usuário',
            'Endpoint não configurado corretamente',
            'Erro de validação no backend',
            'Problema com o queryset ou filtros'
          ],
          suggestion: 'Verificar perfil do usuário e permissões no backend'
        });
      }
    }
    
    // 4. Verificar perfil do usuário (se disponível)
    console.log('4️⃣ Verificando perfil do usuário...');
    try {
      const response = await api.get('/auth/me/');
      console.log('✅ Perfil do usuário:', {
        username: response.data?.username,
        perfil: response.data?.perfil,
        orgao: response.data?.orgao
      });
    } catch (error: any) {
      console.error('❌ Erro ao verificar perfil:', {
        status: error.response?.status,
        data: error.response?.data
      });
    }
    
    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  }
};
