import AuthService from '../services/auth';

class TokenManager {
  private static instance: TokenManager;
  private refreshInterval: NodeJS.Timeout | null = null;
  private authService = AuthService.getInstance();

  private constructor() {}

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Iniciar verificação automática de tokens
  startTokenRefresh(): void {
    // Verificar a cada 5 minutos se o token precisa ser renovado
    this.refreshInterval = setInterval(async () => {
      if (this.authService.isAuthenticated()) {
        await this.authService.ensureValidToken();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Parar verificação automática
  stopTokenRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Interceptor para requisições que verifica token antes de fazer a chamada
  async interceptRequest(): Promise<boolean> {
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    return await this.authService.ensureValidToken();
  }
}

export default TokenManager;