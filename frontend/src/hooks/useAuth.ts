import { useState, useEffect, useCallback } from 'react';
import { checkAuthStatus, logout } from '@/services/api';

interface AuthStatus {
  isAuthenticated: boolean;
  hasValidAccessToken: boolean;
  hasValidRefreshToken: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    hasValidAccessToken: false,
    hasValidRefreshToken: false,
    isLoading: true
  });

  const checkAuth = useCallback(() => {
    try {
      const status = checkAuthStatus();
      setAuthStatus({
        isAuthenticated: !!status.hasValidAccessToken,
        hasValidAccessToken: !!status.hasValidAccessToken,
        hasValidRefreshToken: !!status.hasValidRefreshToken,
        isLoading: false
      });
      return status;
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      setAuthStatus({
        isAuthenticated: false,
        hasValidAccessToken: false,
        hasValidRefreshToken: false,
        isLoading: false
      });
      return {
        hasValidAccessToken: false,
        hasValidRefreshToken: false
      };
    }
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setAuthStatus({
      isAuthenticated: false,
      hasValidAccessToken: false,
      hasValidRefreshToken: false,
      isLoading: false
    });
  }, []);

  // Verificar autenticação na inicialização
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Verificar autenticação periodicamente (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!authStatus.isLoading) {
        checkAuth();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [checkAuth, authStatus.isLoading]);

  return {
    ...authStatus,
    checkAuth,
    logout: handleLogout
  };
};
