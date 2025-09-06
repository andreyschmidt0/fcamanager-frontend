import { useState, useEffect } from 'react';
import AuthService from '../services/auth';
import AuthStateManager from '../utils/authState';

interface AuthUser {
  id: number;
  username: string;
  profile: {
    nickname: string;
    discordId: string;
    email: string;
  };
  role: string;
  permissions: string[];
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authService = AuthService.getInstance();
  const authStateManager = AuthStateManager.getInstance();

  useEffect(() => {
    const initAuth = async () => {
      // Marcar que estamos iniciando autenticação
      authStateManager.setInitializing(true);
      
      // Verificar se existe dados de autenticação
      const hasAuthData = authService.isAuthenticated();
      
      if (hasAuthData) {
        // Se o token não estiver expirado, usar diretamente
        if (!authService.isTokenExpired()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsLoading(false);
          return;
        }
        
        // Se expirou mas temos refresh token, tentar renovar
        const refreshToken = authService.getRefreshToken();
        if (refreshToken) {
          const isValid = await authService.ensureValidToken();
          
          if (isValid) {
            const currentUser = authService.getCurrentUser();
            setUser(currentUser);
          } else {
            // Falhou ao renovar - logout silencioso na inicialização
            authService.logout();
            setUser(null);
          }
        } else {
          // Sem refresh token - logout silencioso
          authService.logout();
          setUser(null);
        }
      } else {
        // Sem dados de auth
        setUser(null);
      }
      
      // Marcar fim da inicialização
      authStateManager.setInitializing(false);
      setIsLoading(false);
    };

    initAuth();

    // Escutar por atualizações do usuário
    const handleUserUpdate = () => {
      const updatedUser = authService.getCurrentUser();
      setUser(updatedUser);
    };

    window.addEventListener('user-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, []);

  const updateUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    localStorage.clear();
    window.location.href = '/login';
  };

  return {
    user,
    isLoading,
    updateUser,
    logout,
    isAuthenticated: authService.isAuthenticated()
  };
};