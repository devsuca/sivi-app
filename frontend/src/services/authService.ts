import api from './api';
import { LoginCredentials, TokenResponse } from '@/types/auth';

export const login = async (credentials: LoginCredentials): Promise<TokenResponse> => {
  try {
    console.log('🔐 Tentando fazer login com credenciais:', { 
      email: credentials.email, 
      password: credentials.password ? '***' : 'undefined' 
    });
    
    // Validar credenciais antes de enviar
    if (!credentials.email || !credentials.password) {
      throw new Error('Email e senha são obrigatórios.');
    }
    
    // Garantir que as credenciais estão no formato correto
    const loginData = {
      email: credentials.email.trim(),
      password: credentials.password
    };
    
    console.log('📤 Enviando requisição para:', '/auth/token/');
    console.log('📤 Dados enviados:', { email: loginData.email, password: '***' });
    
    const response = await api.post<TokenResponse>('/auth/token/', loginData);
    
    console.log('✅ Login bem-sucedido, resposta recebida:', {
      hasAccessToken: !!response.data.access,
      hasRefreshToken: !!response.data.refresh
    });
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Erro no login:', error);
    
    // Log detalhado do erro
    if (error.response) {
      console.error('📊 Detalhes da resposta de erro:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Tratamento específico para erro 400
      if (error.response.status === 400) {
        const errorData = error.response.data;
        
        // Verificar se é erro de senha incorreta
        if (typeof errorData === 'object' && errorData !== null) {
          // Verificar se há erro de senha incorreta
          if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
            const passwordError = errorData.non_field_errors.find((err: string) => 
              err.toLowerCase().includes('incorrect password') || 
              err.toLowerCase().includes('senha incorreta') ||
              err.toLowerCase().includes('invalid credentials')
            );
            
            if (passwordError) {
              throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
            }
          }
          
          // Verificar erros específicos de campo
          if (errorData.email && Array.isArray(errorData.email)) {
            const emailError = errorData.email.find((err: string) => 
              err.toLowerCase().includes('user not found') ||
              err.toLowerCase().includes('usuário não encontrado')
            );
            
            if (emailError) {
              throw new Error('Usuário não encontrado. Verifique seu email.');
            }
          }
          
          // Tratamento genérico de erros de campo
          const fieldErrors = Object.keys(errorData).map(field => {
            const fieldError = errorData[field];
            if (Array.isArray(fieldError)) {
              return `${field}: ${fieldError.join(', ')}`;
            }
            return `${field}: ${fieldError}`;
          }).join('; ');
          
          throw new Error(`Dados inválidos: ${fieldErrors}`);
        } 
        // Se é uma string de erro
        else if (typeof errorData === 'string') {
          // Verificar se é erro de senha
          if (errorData.toLowerCase().includes('incorrect password') || 
              errorData.toLowerCase().includes('senha incorreta') ||
              errorData.toLowerCase().includes('invalid credentials')) {
            throw new Error('Email ou senha incorretos. Verifique suas credenciais.');
          }
          throw new Error(errorData);
        } 
        // Se é um array de erros
        else if (Array.isArray(errorData)) {
          throw new Error(errorData.join('; '));
        }
        // Erro genérico
        else {
          throw new Error('Credenciais inválidas. Verifique seu email e senha.');
        }
      }
      // Tratamento para erro 401 (não autorizado)
      else if (error.response.status === 401) {
        throw new Error('Email ou senha incorretos.');
      }
      // Tratamento para erro 403 (proibido)
      else if (error.response.status === 403) {
        throw new Error('Conta desativada. Entre em contato com o administrador.');
      }
      // Tratamento para erro 500 (erro interno do servidor)
      else if (error.response.status >= 500) {
        throw new Error('Erro interno do servidor. Tente novamente mais tarde.');
      }
    } else if (error.request) {
      console.error('🌐 Erro de rede - sem resposta do servidor:', error.request);
      throw new Error('Erro de conectividade. Verifique se o servidor está rodando em http://127.0.0.1:8000');
    } else {
      console.error('⚠️ Erro na configuração da requisição:', error.message);
      throw new Error('Erro interno. Tente novamente.');
    }
    
    throw error;
  }
};