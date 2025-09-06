// Sistema para controlar estado de autenticação e quando mostrar modais
class AuthStateManager {
  private static instance: AuthStateManager;
  private isInitializing: boolean = false;
  private appReady: boolean = false;

  private constructor() {}

  static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  setInitializing(initializing: boolean): void {
    this.isInitializing = initializing;
  }

  isInInitialization(): boolean {
    return this.isInitializing;
  }

  setAppReady(ready: boolean): void {
    this.appReady = ready;
  }

  isAppReady(): boolean {
    return this.appReady;
  }

  // Determina se devemos mostrar o modal de sessão expirada
  shouldShowSessionExpiredModal(): boolean {
    // Só mostrar modal se:
    // 1. App já terminou inicialização
    // 2. Usuário está na área principal (não em login)
    return this.appReady && 
           !this.isInitializing && 
           window.location.pathname !== '/login';
  }
}

export default AuthStateManager;