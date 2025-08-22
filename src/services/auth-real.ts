import apiService from './api.service';
import type { AuthResult, LoginCredentials } from './auth';

// Service de autenticação que usa o backend real
// Mantém a mesma interface do AuthService mock para compatibilidade
class RealAuthService {
  private static instance: RealAuthService;
  private currentUser: any = null;
  private sessionToken: string | null = null;

  private constructor() {
    // Restaurar sessão do localStorage se existir
    this.restoreSession();
  }

  static getInstance(): RealAuthService {
    if (!RealAuthService.instance) {
      RealAuthService.instance = new RealAuthService();
    }
    return RealAuthService.instance;
  }

  private restoreSession(): void {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('currentUser');
    
    if (token && userData) {
      try {
        this.sessionToken = token;
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error);
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    this.currentUser = null;
    this.sessionToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validações básicas
      if (!credentials.username?.trim()) {
        return {
          success: false,
          error: 'Username é obrigatório'
        };
      }

      if (!credentials.password?.trim()) {
        return {
          success: false,
          error: 'Password é obrigatório'
        };
      }

      // Fazer login via API
      const result = await apiService.loginCompatible(credentials);
      
      if (result.success && result.user && result.accessToken) {
        this.currentUser = result.user;
        this.sessionToken = result.accessToken;
        
          ( {
          username: result.user.username,
          nickname: result.user.profile.nickname,
          role: result.user.role
        });
      }

      return result;
    } catch (error) {;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  logout(): void {
    apiService.logout();
    this.clearSession();
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  getSessionToken(): string | null {
    return this.sessionToken;
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.sessionToken);
  }

  validateSession(token: string): boolean {
    return this.sessionToken === token && this.isAuthenticated();
  }

  // Método adicional para testar conexão
  async testBackendConnection(): Promise<boolean> {
    try {
      const isConnected = await apiService.testConnection();
      return isConnected;
    } catch (error) {
      return false;
    }
  }

  // Método para verificar se o token ainda é válido
  async verifyToken(): Promise<boolean> {
    try {
      return await apiService.verifyToken();
    } catch {
      this.clearSession();
      return false;
    }
  }
}

export default RealAuthService;