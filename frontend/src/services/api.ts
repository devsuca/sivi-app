import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api',
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função utilitária para verificar e limpar tokens inválidos
const validateAndCleanTokens = () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  // Verificar se os tokens existem e têm formato válido
  const isAccessTokenValid = accessToken && accessToken.startsWith('eyJ') && accessToken.length > 50;
  const isRefreshTokenValid = refreshToken && refreshToken.startsWith('eyJ') && refreshToken.length > 50;
  
  if (accessToken && !isAccessTokenValid) {
    console.warn('⚠️ Access token inválido detectado, removendo...');
    localStorage.removeItem('accessToken');
  }
  
  if (refreshToken && !isRefreshTokenValid) {
    console.warn('⚠️ Refresh token inválido detectado, removendo...');
    localStorage.removeItem('refreshToken');
  }
  
  return {
    hasValidAccessToken: isAccessTokenValid,
    hasValidRefreshToken: isRefreshTokenValid
  };
};

// Função para limpar todos os tokens
const clearAllTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  console.log('🧹 Todos os tokens foram removidos');
};

// Função para verificar se um endpoint precisa de autenticação
const requiresAuthentication = (url: string): boolean => {
  const authRequiredEndpoints = [
    '/visitas/',
    '/pessoas/',
    '/usuarios/',
    '/relatorios/',
    '/tickets/',
    '/audit-logs/',
    '/auth/me/',
    '/auth/token/verify/'
  ];
  
  // Endpoints que não precisam de autenticação
  const publicEndpoints = [
    '/auth/login/',
    '/auth/token/',
    '/auth/token/refresh/',
    '/auth/token/blacklist/'
  ];
  
  // Se for endpoint público, não precisa de auth
  if (publicEndpoints.some(endpoint => url.includes(endpoint))) {
    return false;
  }
  
  // Se for endpoint que precisa de auth
  return authRequiredEndpoints.some(endpoint => url.includes(endpoint));
};

// Função para verificar status de autenticação
export const checkAuthStatus = () => {
  const tokenStatus = validateAndCleanTokens();
  
  console.log('🔍 Status da autenticação:', {
    hasValidAccessToken: tokenStatus.hasValidAccessToken,
    hasValidRefreshToken: tokenStatus.hasValidRefreshToken,
    isAuthenticated: tokenStatus.hasValidAccessToken
  });
  
  return tokenStatus;
};

// Função para logout
export const logout = () => {
  clearAllTokens();
  console.log('🚪 Logout realizado, tokens removidos');
  
  // Redirecionar para login se não estiver já lá
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Função para verificar conectividade com o backend
export const checkBackendConnectivity = async () => {
  try {
    console.log('🔍 Verificando conectividade com o backend...');
    const response = await axios.get(
      (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api') + '/health/',
      { timeout: 5000 }
    );
    console.log('✅ Backend acessível:', response.data);
    return { isAccessible: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Backend não acessível:', error.message);
    return { 
      isAccessible: false, 
      error: error.message,
      isNetworkError: error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED'
    };
  }
};

// Função para verificar se o token é válido no backend
export const verifyToken = async () => {
  try {
    const tokenStatus = validateAndCleanTokens();
    if (!tokenStatus.hasValidAccessToken) {
      console.warn('⚠️ Nenhum token válido para verificação');
      return { isValid: false, reason: 'No valid token' };
    }

    const token = localStorage.getItem('accessToken');
    console.log('🔍 Verificando token no backend...');
    const response = await api.get('/auth/token/verify/', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Token válido no backend:', response.data);
    return { isValid: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Token inválido no backend:', error.response?.status, error.response?.data);
    return { 
      isValid: false, 
      reason: error.response?.data?.detail || error.message,
      status: error.response?.status
    };
  }
};

api.interceptors.request.use(
  (config) => {
    // Para endpoints de login, não adicionar token
    if (config.url?.includes('/auth/token/')) {
      console.log(`🔐 Requisição de login: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    }
    
    // Validar e limpar tokens inválidos antes de cada requisição
    const tokenStatus = validateAndCleanTokens();
    
    if (tokenStatus.hasValidAccessToken) {
      const token = localStorage.getItem('accessToken');
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 Token válido encontrado para requisição: ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.log(`⚠️ Nenhum token válido encontrado para requisição: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Verificar se é uma requisição que precisa de autenticação
      const needsAuth = config.url ? requiresAuthentication(config.url) : false;
      
      if (needsAuth) {
        console.warn('🚨 Requisição que precisa de autenticação sem token válido:', config.url);
        // Não bloquear a requisição, deixar o interceptor de resposta lidar com o 401
      }
    }
    
    // Log da requisição em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        hasValidToken: tokenStatus.hasValidAccessToken,
        hasValidRefreshToken: tokenStatus.hasValidRefreshToken,
        headers: config.headers
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta para refresh automático e tratamento de erros
api.interceptors.response.use(
  (response) => {
    // Verificar se a resposta é realmente JSON
    const contentType = response.headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      console.warn('⚠️ Resposta não é JSON:', {
        url: response.config.url,
        contentType: contentType,
        status: response.status,
        data: typeof response.data === 'string' ? response.data.substring(0, 100) : response.data
      });
    }
    
    // Log da resposta em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Verificar se a resposta de erro é HTML em vez de JSON
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
      console.error('🚨 Resposta HTML recebida em vez de JSON:', {
        url: error.config?.url,
        status: error.response?.status,
        contentType: error.response?.headers?.['content-type'],
        data: error.response.data.substring(0, 200)
      });
      
      // Determinar o tipo de erro baseado no status
      let errorMessage = 'Erro no servidor';
      if (error.response?.status === 404) {
        errorMessage = 'Endpoint não encontrado. Verifique se o backend está configurado corretamente.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Verifique os logs do backend.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Acesso negado. Verifique suas permissões.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Não autorizado. Faça login novamente.';
      }
      
      // Retornar erro mais específico para HTML
      return Promise.reject({
        ...error,
        message: errorMessage,
        isHtmlResponse: true,
        originalError: error
      });
    }
    
    // Log do erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.code || 'NETWORK_ERROR'} ${error.config?.url}`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
    }
    
    // Tratamento de erro de rede
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED' || !error.response) {
      console.error('🌐 Network Error - Backend não está acessível');
      // Não redirecionar para login em caso de erro de rede
      return Promise.reject({
        ...error,
        message: 'Erro de conectividade. Verifique se o backend está rodando.',
        isNetworkError: true
      });
    }
    
    // Tratamento de token expirado ou inválido
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      const accessToken = localStorage.getItem('accessToken');
      
      console.log('🔍 Analisando erro 401:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        url: originalRequest.url,
        method: originalRequest.method,
        accessTokenValid: accessToken && accessToken.startsWith('eyJ') && accessToken.length > 50,
        refreshTokenValid: refreshToken && refreshToken.startsWith('eyJ') && refreshToken.length > 50,
        errorResponse: error.response?.data,
        errorHeaders: error.response?.headers,
        requestHeaders: originalRequest.headers
      });
      
      if (refreshToken && refreshToken.startsWith('eyJ') && refreshToken.length > 50) {
        try {
          console.log('🔄 Tentando refresh do token...');
          const res = await axios.post(
            (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api') + '/auth/token/refresh/',
            { refresh: refreshToken }
          );
          const newAccessToken = res.data.access;
          localStorage.setItem('accessToken', newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          console.log('✅ Token renovado com sucesso, repetindo requisição...');
          return api(originalRequest);
        } catch (refreshError: any) {
          console.error('❌ Erro ao renovar token:', refreshError);
          console.error('📊 Detalhes do erro de refresh:', {
            status: refreshError.response?.status,
            data: refreshError.response?.data,
            message: refreshError.message
          });
          
          // Limpar tokens inválidos
          clearAllTokens();
          
          // Só redirecionar para login se não estiver já na página de login
          if (window.location.pathname !== '/login') {
            console.log('🚪 Redirecionando para login devido a token inválido...');
            window.location.href = '/login';
          }
          return Promise.reject({
            ...refreshError,
            message: 'Sessão expirada. Faça login novamente.',
            isAuthError: true
          });
        }
      } else {
        console.warn('⚠️ Nenhum refresh token válido encontrado para renovação');
        clearAllTokens();
        
        // Só redirecionar para login se não estiver já na página de login
        if (window.location.pathname !== '/login') {
          console.log('🚪 Redirecionando para login devido a falta de refresh token...');
          window.location.href = '/login';
        }
        
        return Promise.reject({
          ...error,
          message: 'Não autenticado. Faça login novamente.',
          isAuthError: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);


// Função de diagnóstico para debug (disponível no console)
export const diagnoseAuthIssues = async () => {
  console.log('🔍 === DIAGNÓSTICO DE AUTENTICAÇÃO ===');
  
  // 1. Verificar conectividade do backend
  console.log('1️⃣ Verificando conectividade do backend...');
  const connectivity = await checkBackendConnectivity();
  console.log('Conectividade:', connectivity);
  
  // 2. Verificar tokens locais
  console.log('2️⃣ Verificando tokens locais...');
  const tokenStatus = checkAuthStatus();
  console.log('Status dos tokens:', tokenStatus);
  
  // 3. Verificar token no backend
  if (tokenStatus.hasValidAccessToken) {
    console.log('3️⃣ Verificando token no backend...');
    const tokenVerification = await verifyToken();
    console.log('Verificação do token:', tokenVerification);
  } else {
    console.log('3️⃣ Pulando verificação do token (nenhum token válido)');
  }
  
  // 4. Testar endpoint específico
  console.log('4️⃣ Testando endpoint /visitas/em_curso/...');
  try {
    const response = await api.get('/visitas/em_curso/');
    console.log('✅ Endpoint funcionando:', response.data);
  } catch (error: any) {
    console.error('❌ Erro no endpoint:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
  
  console.log('🔍 === FIM DO DIAGNÓSTICO ===');
};

// Tornar a função disponível globalmente para debug
if (typeof window !== 'undefined') {
  (window as any).diagnoseAuthIssues = diagnoseAuthIssues;
  console.log('🔧 Função de diagnóstico disponível: diagnoseAuthIssues()');
}

export default api;
