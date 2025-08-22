import { useState, useEffect } from 'react';
import AuthService from '../services/auth';

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

  useEffect(() => {
    const initAuth = async () => {
      // Verificar se o token é válido e renovar se necessário
      const isValid = await authService.ensureValidToken();
      
      if (isValid) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } else {
        // Token inválido ou expirado, fazer logout
        authService.logout();
        setUser(null);
      }
      
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