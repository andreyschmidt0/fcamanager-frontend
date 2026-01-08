import { fetch } from '@tauri-apps/plugin-http';
import { ErrorCapture } from '../components/debug/DebugModal';
import SuccessModalManager from '../utils/SuccessModalManager';
import AuthStateManager from '../utils/authState';

export interface PlayerProfileData {
  strDiscordId: string;
  strEmail: string;
  strNexonId: string;
  strNickname: string;
}


// Configuração da API
const API_BASE = import.meta.env.VITE_API_URL || 'https://fca-backend.fly.dev/api';

// Interface para o usuário retornado pelo backend
export interface BackendUser {
  id: number;
  username: string;
  profile: {
    nickname: string;
    email: string;
    discordId: string;
  };
  role: 'admin' | 'user';
}

// Interface para resposta de login
export interface LoginResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: BackendUser;
}

// Interface para credenciais de login
export interface LoginCredentials {
  username: string;
  password: string;
}

// Interface para resultado de autenticação (compatível com o mock)
export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    profile: {
      nickname: string;
      email: string;
      discordId: string;
    };
    role: string;
    lastLogin: Date;
    password: string; // Sempre '[PROTECTED]'
  };
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
}

class ApiTauriService {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private showSuccessModal(title?: string, message?: string) {
    const successManager = SuccessModalManager.getInstance();
    successManager.showSuccess(title, message);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const errorCapture = ErrorCapture.getInstance();
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }

      // Capture API errors
      errorCapture.addError({
        error: `HTTP ${response.status}`,
        details: errorData.error || errorText || 'Unknown error',
        type: response.status === 401 ? 'auth' : 'api',
        url: response.url,
        method: 'TAURI-HTTP'
      });

      if (response.status === 401) {
        // Token expirado ou inválido (apenas 401, não 403)
        // 403 significa que o token é válido mas sem permissão para ação específica
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tokenExpiryTime');
        
        const authStateManager = AuthStateManager.getInstance();
        
        // Só emitir evento e mostrar modal se não estivermos inicializando
        if (authStateManager.shouldShowSessionExpiredModal()) {
          window.dispatchEvent(new CustomEvent('tokenExpired'));
        }
        
        // Sempre redirecionar se não estivermos na página de login
        if (window.location.pathname !== '/login') {
          // Se estamos inicializando, fazer redirect silencioso
          if (authStateManager.isInInitialization()) {
            window.location.replace('/login');
          } else {
            window.location.href = '/login';
          }
        }
      }

      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Login no backend real
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
        connectTimeout: 60000
      });

      return await this.handleResponse<LoginResponse>(response);
    } catch (error) {
      const errorCapture = ErrorCapture.getInstance();
      
      // Specifically capture login connection errors
      errorCapture.addError({
        error: 'Login Connection Failed (Tauri)',
        details: `Failed to connect to server during login attempt. API URL: ${API_BASE}. Error: ${error}`,
        type: 'connection',
        url: '/auth/login',
        method: 'POST'
      });

      const message = error instanceof Error ? error.message : 'Erro de conexão com o servidor';
      throw new Error(message);
    }
  }

  // Método compatível com o sistema de mock atual
  async loginCompatible(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await this.login(credentials);
      
      // Converter resposta do backend para o formato esperado pelo frontend
      return {
        success: response.success,
        user: {
          id: response.user.id,
          username: response.user.username,
          profile: {
            nickname: response.user.profile.nickname,
            email: response.user.profile.email,
            discordId: response.user.profile.discordId
          },
          role: response.user.role,
          lastLogin: new Date(),
          password: '[PROTECTED]'
        },
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresIn: response.expiresIn
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Verificar se o token ainda é válido
  async verifyToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/verify`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Obter dados do usuário atual
  async getCurrentUser(): Promise<BackendUser | null> {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const data = await this.handleResponse<{ user: BackendUser }>(response);
      return data.user;
    } catch {
      return null;
    }
  }
  
  // Logout
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiryTime');
  }
  
  // Verificar se está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
  }
  
  // Obter access token atual
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  // Obter refresh token atual
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Obter usuário do localStorage
  getUserFromStorage(): BackendUser | null {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }
  
  // Testar conexão com o backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE.replace('/api', '')}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        connectTimeout: 30000
      });
      
      const data = await response.json();
      return data.status === 'OK';
    } catch (error) {
      const errorCapture = ErrorCapture.getInstance();
      errorCapture.addError({
        error: 'Health Check Failed (Tauri)',
        details: `Cannot connect to server health endpoint. API Base: ${API_BASE}. Error: ${error}`,
        type: 'connection',
        url: `${API_BASE.replace('/api', '')}/health`,
        method: 'GET'
      });
      return false;
    }
  }

  async getPlayerProfileByDiscordId(discordId: string): Promise<PlayerProfileData | null> {
    try {
      const response = await fetch(`${API_BASE}/users/profile/${encodeURIComponent(discordId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<PlayerProfileData>(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do jogador:', error);
      return null;
    }
  }

  async getPlayerProfile(nickname: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/users/profile/${encodeURIComponent(nickname)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao buscar perfil do jogador por nickname:', error);
      return null;
    }
  }


  async getLogs(period?: string, gmNickname?: string, page: number = 1, pageSize: number = 20): Promise<{ logs: any[], pagination: { page: number, pageSize: number, total: number, totalPages: number } }> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (gmNickname) params.append('gmNickname', gmNickname);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`${API_BASE}/logs?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 15000
      });

      const data = await this.handleResponse<{ logs: any[], pagination: any }>(response);
      return {
        logs: data.logs || [],
        pagination: data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 }
      };
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return {
        logs: [],
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
      };
    }
  }

  // Validação cross-check de Discord ID + Login
  async validatePlayerCrossCheck(discordId: string, login: string): Promise<{
    isValid: boolean;
    player?: any;
    message?: string;
    error?: string;
    details?: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('discordId', discordId);
      params.append('login', login);
      
      const response = await fetch(`${API_BASE}/users/validate-player?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<{
        isValid: boolean;
        player?: any;
        message?: string;
        error?: string;
        details?: string;
      }>(response);
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Erro inesperado na validação'
      };
    }
  }

  // Buscar usuários
  async searchUsers(searchParams: { [key: string]: string }): Promise<any[]> {
    try {
      const params = new URLSearchParams(searchParams);
      
      const response = await fetch(`${API_BASE}/users/search?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }
  }

  // Buscar clãs
  async searchClans(clanName: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/users/clans/search?clanName=${encodeURIComponent(clanName)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('Erro ao buscar clãs:', error);
      return [];
    }
  }

  // Obter clã por ID
  async getClanById(clanId: string): Promise<any | null> {
    try {
      const response = await fetch(`${API_BASE}/users/clans/${clanId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao buscar clã:', error);
      return null;
    }
  }

  // Obter lista de GMs
  async getGMList(discordId: string): Promise<{isAuthorized: boolean, gms?: any[], gmUsers?: any[], users?: any[]}> {
    try {
      const response = await fetch(`${API_BASE}/users/gms`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<{isAuthorized: boolean, gms?: any[], gmUsers?: any[], users?: any[]}>(response);
    } catch (error) {
      console.error('Erro ao buscar usuários com permissões:', error);
      return {isAuthorized: false};
    }
  }


  // Change user password
  async changePassword(data: {
    targetNexonId: string;
    newPassword: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Senha Alterada', 'Senha do usuário foi alterada com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar senha'
      };
    }
  }

  // Change user nickname
  async changeNickname(data: {
    targetNexonId: string;
    newNickname: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/change-nickname`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Nickname Alterado', 'Nickname do usuário foi alterado com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar nickname:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar nickname'
      };
    }
  }

  // Change user email
  async changeEmail(data: {
    targetNexonId: string;
    newEmail: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/change-email`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Email Alterado', 'Email do usuário foi alterado com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar email'
      };
    }
  }

  // Change user login
  async changeLogin(data: {
    targetNexonId: string;
    newLogin: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/change-login`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Login Alterado', 'Login do usuário foi alterado com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar login:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar login'
      };
    }
  }

  async banUser(data: {
    discordId: string;
    loginAccount: string;
    banDuration?: number;
    banReason: string;
    banScope?: string;
    addMacToBlockList?: string;
    excluirClans?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/ban-user`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Usuário Banido', 'Usuário foi banido com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao banir usuário'
      };
    }
  }

  async unbanUser(data: {
    discordId: string;
    loginAccount: string;
    reason: string;
    unbanScope: string;
    clearMacBlockEntry: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/unban-user`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Usuário Desbanido', 'Usuário foi desbanido com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao desbanir usuário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao desbanir usuário'
      };
    }
  }

  async adjustUserKD(data: {
    discordId: string;
    loginAccount: string;
    reduceKillPct: number;
    reduceDeathPct?: number;
    setKDAOne: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/adjust-user-kd`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('KDA Ajustado', 'KDA do usuário foi ajustado com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao ajustar KDA:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ajustar KDA'
      };
    }
  }

  async updateFireteamStat(data: {
    discordId: string;
    loginAccount: string;
    mapName: string;
    attributeName: string;
    newValue: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/update-fireteam-stat`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Valor Atualizado', `Valor de ${data.attributeName} atualizado com sucesso no mapa ${data.mapName}!`);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar valor fireteam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar valor fireteam'
      };
    }
  }

  async setInventoryItemStatus(data: {
    targetOidUser: number;
    inventorySeqNo: number;
    action: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/set-inventory-item-status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        const actionText = data.action === 'A' ? 'ativado' : 'desativado';
        this.showSuccessModal('Status Atualizado', `Item ${actionText} com sucesso!`);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar status do item'
      };
    }
  }

  async setUserStoreItemStatus(data: {
    targetOidUser: number;
    userStoreSeqNo: number;
    action: string;
    newExpireDate?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/set-user-store-item-status`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        const actionText = data.action === 'A' ? 'ativado' : 'desativado';
        this.showSuccessModal('Status Atualizado', `Item do inbox ${actionText} com sucesso!`);
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar status do item do inbox:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar status do item do inbox'
      };
    }
  }

  async removeAccount(data: {
    targetNexonId: string;
    reason: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/remove-account`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Conta Removida', 'Conta do usuário foi removida com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao remover conta:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover conta'
      };
    }
  }

  async sendProductToList(data: {
    nexonIdList: string;
    productListString: string;
    count: number;
    message: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/send-product-list`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Produtos Enviados', 'Produtos foram enviados com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao enviar produtos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar produtos'
      };
    }
  }

  async creditCashToList(data: {
    nexonIdList: string;
    cashAmount: number;
    creditReason: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/credit-cash-list`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Cash Enviado', 'Cash foi creditado com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao enviar cash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar cash'
      };
    }
  }

  // Remover cash de um usuário usando BSP_RemoveCashFromUser
  async removeCashFromUser(data: {
    targetNexonId: string;
    amountToRemove: number;
    reason: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/remove-cash`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Cash Removido', 'Cash foi removido com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao remover cash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover cash'
      };
    }
  }

  // Inserir jogador na blacklist de recompensa de Fireteam
  async insertFireteamRewardBlacklist(data: {
    discordId: string;
    loginAccount: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/fireteam-blacklist`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Blacklist EA', result.message || 'Jogador inserido na blacklist de Fireteam.');
      }

      return result;
    } catch (error) {
      console.error('Erro ao inserir na blacklist de Fireteam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao inserir na blacklist de Fireteam'
      };
    }
  }

  // Consultar blacklist de recompensa de Fireteam
  async getFireteamBlacklist(filters?: { nickname?: string; reason?: string; date?: string }): Promise<{
    success: boolean;
    data?: Array<{
      oidUser: number;
      Reason: string;
      AddedAt: string;
      NickName: string;
    }>;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.nickname) queryParams.append('nickname', filters.nickname);
      if (filters?.reason) queryParams.append('reason', filters.reason);
      if (filters?.date) queryParams.append('date', filters.date);

      const url = `${API_BASE}/actions/fireteam-blacklist${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        data?: any[];
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao consultar blacklist de Fireteam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao consultar blacklist de Fireteam'
      };
    }
  }

  // Deletar clã usando BSP_DeleteSingleClan
  async deleteClan(data: {
    oidGuild: number;
    reason: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/delete-clan`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Clã Excluído', 'Clã foi excluído com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao excluir clã:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir clã'
      };
    }
  }

  // Remover emblema de clã usando BSP_RemoveClanEmblem
  async removeClanEmblem(data: {
    oidGuild: number;
    reason: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/remove-clan-emblem`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Emblema Removido', 'Emblema do clã foi removido com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao remover emblema do clã:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover emblema do clã'
      };
    }
  }

  // Transferir liderança de clã usando BSP_AdminTransferClanLeadership
  async transferClanLeadership(data: {
    oldLeaderOidUser: number;
    newLeaderOidUser: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/transfer-clan-leadership`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Liderança Transferida', 'Liderança do clã foi transferida com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao transferir liderança do clã:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro inesperado na transferência'
      };
    }
  }

  // Definir rank de usuário usando BSP_SetUserRankByLevel
  async setUserRank(data: {
    discordId: string;
    loginAccount: string;
    targetGradeLevel: number;
    reason: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/set-user-rank`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Rank Definido', 'Rank do usuário foi alterado com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao definir rank:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao definir rank'
      };
    }
  }

  // Remover EXP de um usuario usando BSP_RemoveUserExp
  async removeUserExp(data: {
    discordId: string;
    loginAccount: string;
    expToRemove: number;
    reason: string;
    targetOidUser?: number;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/remove-exp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        const expAfterRaw = (result as any)?.data?.expAfter;
        const expAfter =
          typeof expAfterRaw === 'bigint'
            ? Number(expAfterRaw)
            : typeof expAfterRaw === 'number'
              ? expAfterRaw
              : typeof expAfterRaw === 'string'
                ? Number(expAfterRaw)
                : null;

        const message =
          expAfter === null || Number.isNaN(expAfter)
            ? 'EXP foi removida com sucesso!'
            : `EXP foi removida com sucesso! Novo EXP: ${expAfter.toLocaleString('pt-BR')}`;

        this.showSuccessModal('EXP Removida', message);
      }

      return result;
    } catch (error) {
      console.error('Erro ao remover EXP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover EXP'
      };
    }
  }

  // Change user Discord ID using BSP_ChangeUserDiscordID
  async changeUserDiscordId(data: {
    gmOidUser: number;
    targetOidUser: number;
    newDiscordID: string;
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/change-discord-id`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
      
      if (result.success) {
        this.showSuccessModal('Discord ID Alterado', 'Discord ID do usuário foi alterado com sucesso!');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao alterar Discord ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar Discord ID'
      };
    }
  }

  // Buscar histórico de ban do jogador
  async getBanHistory(targetOidUser: number, filters?: { status?: string; executor?: string; motivo?: string; logDate?: string }): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
    message?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.executor) queryParams.append('executor', filters.executor);
      if (filters?.motivo) queryParams.append('motivo', filters.motivo);
      if (filters?.logDate) queryParams.append('logDate', filters.logDate);

      const url = `${API_BASE}/actions/ban-history/${targetOidUser}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        data?: any[];
        message?: string;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar histórico de ban:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar histórico de ban'
      };
    }
  }

  // Consultar histórico de doações
  async getDonationHistory(oidUser: number): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
    error?: string;
  }> {
    try {
      const url = `${API_BASE}/actions/donation-history/${oidUser}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        data?: any[];
        message?: string;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar histórico de doações:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar histórico de doações'
      };
    }
  }

  // Consultar histórico de nicknames
  async getNicknameHistory(targetOidUser: number): Promise<{
    success: boolean;
    data?: Array<{
      Ordem: number;
      Nickname: string;
      RegDate: string;
    }>;
    message?: string;
    error?: string;
  }> {
    try {
      const url = `${API_BASE}/actions/nickname-history/${targetOidUser}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        data?: Array<{
          Ordem: number;
          Nickname: string;
          RegDate: string;
        }>;
        message?: string;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar histórico de nicknames:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar histórico de nicknames'
      };
    }
  }


  // Search player inventory with filters
  async searchInventory(oidUser: string, useType?: string, itemName?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('oidUser', oidUser);

      if (useType !== undefined && useType !== '') {
        params.append('useType', useType);
      }

      if (itemName && itemName.trim() !== '') {
        params.append('itemName', itemName.trim());
      }

      const response = await fetch(`${API_BASE}/users/inventory?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
      return [];
    }
  }

  // Search player inbox (user store)
  async searchInbox(oidUser: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('oidUser', oidUser);

      const response = await fetch(`${API_BASE}/users/inbox?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('Erro ao buscar inbox:', error);
      return [];
    }
  }

  // Get clan members
  async getClanMembers(oidGuild: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('oidGuild', oidGuild);

      const response = await fetch(`${API_BASE}/users/clan-members?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any[]>(response);
    } catch (error) {
      console.error('Erro ao buscar membros do clã:', error);
      return [];
    }
  }

  // Search items with advanced filters and pagination
  async searchItems(filters: {
    itemname?: string;
    availableItems?: number;
    daysperiod?: number;
    periodIn?: number[];
    selltype?: number;
    productId?: number;
    productIds?: number[];
    itemNo?: number;
    itemTypes?: number[];
    itemGrade?: number;
    priceNotEqual99999?: boolean;
    sellBackPriceFilter?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      
      // Adicionar filtros apenas se tiverem valor
      if (filters.itemname && filters.itemname.trim() !== '') {
        params.append('itemname', filters.itemname.trim());
      }
      
      if (filters.availableItems !== undefined && filters.availableItems !== null) {
        params.append('availableItems', filters.availableItems.toString());
      }
      
      if (filters.daysperiod !== undefined && filters.daysperiod !== null && filters.daysperiod > 0) {
        params.append('daysperiod', filters.daysperiod.toString());
      }

      // Filtro de múltiplos períodos
      if (filters.periodIn && filters.periodIn.length > 0) {
        filters.periodIn.forEach(period => {
          params.append('periodIn', period.toString());
        });
      }
      
      if (filters.selltype !== undefined && filters.selltype !== null) {
        params.append('selltype', filters.selltype.toString());
      }
      
      if (filters.productId !== undefined && filters.productId !== null && filters.productId > 0) {
        params.append('productId', filters.productId.toString());
      }

      // Filtro de múltiplos product IDs
      if (filters.productIds && filters.productIds.length > 0) {
        filters.productIds.forEach(id => {
          params.append('productIds', id.toString());
        });
      }
      
      if (filters.itemNo !== undefined && filters.itemNo !== null && filters.itemNo > 0) {
        params.append('itemNo', filters.itemNo.toString());
      }

      // Filtro de múltiplos item types
      if (filters.itemTypes && filters.itemTypes.length > 0) {
        filters.itemTypes.forEach(type => {
          params.append('itemTypes', type.toString());
        });
      }
      
      if (filters.itemGrade !== undefined && filters.itemGrade !== null) {
        params.append('itemGrade', filters.itemGrade.toString());
      }

      // Filtro de preço != 99999
      if (filters.priceNotEqual99999 === true) {
        params.append('priceNotEqual99999', 'true');
      }

      // Filtro de SellBackPrice
      if (filters.sellBackPriceFilter) {
        params.append('sellBackPriceFilter', filters.sellBackPriceFilter);
      }
      
      // Parâmetros de paginação
      params.append('page', (filters.page || 1).toString());
      params.append('pageSize', (filters.pageSize || 30).toString());

      const response = await fetch(`${API_BASE}/actions/search-items?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<{
        success: boolean;
        data: any[];
        pagination: {
          page: number;
          pageSize: number;
          total: number;
          totalPages: number;
        };
      }>(response);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          pageSize: 30,
          total: 0,
          totalPages: 0
        },
        error: error instanceof Error ? error.message : 'Erro ao buscar itens'
      };
    }
  }

  // Listar itens habilitados para o modo CAMP
  async getCampItems(filters?: { name?: string; value?: string }): Promise<{
    success: boolean;
    data: Array<{
      Name: string;
      ItemType?: number | null;
      AllowType: number;
      ValueType: number;
      Value: number;
    }>;
    message?: string;
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.name) queryParams.append('name', filters.name);
      if (filters?.value) queryParams.append('value', filters.value);

      const url = `${API_BASE}/actions/items/mode-camp${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao buscar itens do modo CAMP:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Erro ao buscar itens do modo CAMP'
      };
    }
  }

  async addCampItem(itemNo: number, allowType: number = 1, valueType: number = 2): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/items/mode-camp`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ itemNo, allowType, valueType }),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao adicionar item CAMP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao adicionar item CAMP'
      };
    }
  }

  async deleteCampItem(itemNo: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/items/mode-camp/${itemNo}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao remover item CAMP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover item CAMP'
      };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{success: boolean; accessToken?: string; refreshToken?: string; error?: string}> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        connectTimeout: 30000
      });

      return await this.handleResponse<{success: boolean; accessToken?: string; refreshToken?: string}>(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao renovar token'
      };
    }
  }

  async setUserMarcaBatalha(data: {
    targetNexonId?: string;
    targetOidUser?: number;
    marcaID?: number;
    acao: 'A' | 'D';
  }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/set-user-marca-batalha`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
        error?: string;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Marca de Batalha', result.message || 'Marca de batalha atualizada com sucesso!');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar marca de batalha'
      };
    }
  }

  /**
   * Obtém o ambiente atual do banco de dados (production ou test)
   * @returns Promise com o ambiente atual
   */
  async getCurrentEnvironment(): Promise<'production' | 'test'> {
    try {
      const response = await fetch(`${API_BASE}/database/environment`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{ environment: string }>(response);
      return result.environment as 'production' | 'test';
    } catch (error) {
      console.error('Erro ao obter ambiente:', error);
      // Retornar produção como padrão em caso de erro
      return 'production';
    }
  }

  /**
   * Alterna o ambiente do banco de dados entre produção e teste
   * Requer permissão de Master
   * @param environment - 'production' ou 'test'
   * @returns Promise com resultado da operação
   */
  async switchEnvironment(environment: 'production' | 'test'): Promise<{
    success: boolean;
    environment: string;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/database/environment/switch`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ environment }),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        environment: string;
        message?: string;
      }>(response);

      if (result.success && result.message) {
        this.showSuccessModal('Ambiente Alterado', result.message);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao alternar ambiente';
      
      return {
        success: false,
        environment: environment,
        error: errorMessage
      };
    }
  }

  /**
   * Obtém status detalhado das conexões de banco de dados
   * Requer permissão de Master
   * @returns Promise com status das conexões
   */
  async getDatabaseStatus(): Promise<{
    currentEnvironment: string;
    isTestEnvironment: boolean;
    isProductionEnvironment: boolean;
    databaseUrls: {
      production: string;
      test: string;
    };
  }> {
    try {
      const response = await fetch(`${API_BASE}/database/status`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      throw new Error('Erro ao obter status do banco de dados');
    }
  }

  // Obter todas as caixas de items (Gachapon)
  async getAllItemBoxes(filters?: { boxName?: string; gachaponItemNo?: string }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{ BoxName: string; GachaponItemNo: number }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.boxName) queryParams.append('boxName', filters.boxName);
      if (filters?.gachaponItemNo) queryParams.append('gachaponItemNo', filters.gachaponItemNo);

      const url = `${API_BASE}/actions/boxes/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: Array<{ BoxName: string; GachaponItemNo: number }>;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar caixas de items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar caixas de items'
      };
    }
  }

  // Obter todas as caixas de produtos (Gachapon)
  async getAllProductBoxes(filters?: { boxName?: string; gachaponItemNo?: string }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{ BoxName: string; GachaponItemNo: number }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.boxName) queryParams.append('boxName', filters.boxName);
      if (filters?.gachaponItemNo) queryParams.append('gachaponItemNo', filters.gachaponItemNo);

      const url = `${API_BASE}/actions/boxes/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: Array<{ BoxName: string; GachaponItemNo: number }>;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar caixas de produtos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar caixas de produtos'
      };
    }
  }

  // Obter itens dentro de uma caixa específica
  async getItemsInBox(gachaponItemNo: number, filters?: { itemNo?: string; itemName?: string; itemType?: string; percentage?: string }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{
      BoxName: string;
      GachaponItemNo: number;
      ItemNo: number;
      ItemName: string;
      ItemType: number;
      Percentage: number;
      Period: number;
      ConsumeType: number;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.itemNo) queryParams.append('itemNo', filters.itemNo);
      if (filters?.itemName) queryParams.append('itemName', filters.itemName);
      if (filters?.itemType) queryParams.append('itemType', filters.itemType);
      if (filters?.percentage) queryParams.append('percentage', filters.percentage);

      const url = `${API_BASE}/actions/boxes/items/${gachaponItemNo}/contents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: Array<{
          BoxName: string;
          GachaponItemNo: number;
          ItemNo: number;
          ItemName: string;
          ItemType: number;
          Percentage: number;
          Period: number;
          ConsumeType: number;
        }>;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar itens da caixa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar itens da caixa'
      };
    }
  }

  // Obter produtos dentro de uma caixa específica
  async getProductsInBox(gachaponItemNo: number, filters?: { productID?: string; productName?: string; period?: string; percentage?: string }): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{
      BoxName: string;
      GachaponItemNo: number;
      ProductID: number;
      ProductName: string;
      ItemNo00: number;
      Percentage: number;
      Period: number;
      ConsumeType: number;
    }>;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.productID) queryParams.append('productID', filters.productID);
      if (filters?.productName) queryParams.append('productName', filters.productName);
      if (filters?.period) queryParams.append('period', filters.period);
      if (filters?.percentage) queryParams.append('percentage', filters.percentage);

      const url = `${API_BASE}/actions/boxes/products/${gachaponItemNo}/contents${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: Array<{
          BoxName: string;
          GachaponItemNo: number;
          ProductID: number;
          ProductName: string;
          ItemNo00: number;
          Percentage: number;
          Period: number;
          ConsumeType: number;
        }>;
      }>(response);

      return result;
    } catch (error) {
      console.error('Erro ao buscar produtos da caixa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos da caixa'
      };
    }
  }

  // ============================================
  // GACHAPON MANAGEMENT - API Methods
  // ============================================

  /**
   * Buscar itens para adicionar em caixa de gachapon
   */
  async searchGachaponItems(filters: {
    searchTerm?: string;
    itemNo?: string;
    name?: string;
    period?: string;
  }): Promise<{
    success: boolean;
    data?: Array<{
      ItemNo: number;
      Name: string;
      ItemType: number;
      ConsumeType: number;
      DefaultPeriod: number;
    }>;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.itemNo) params.append('itemNo', filters.itemNo);
      if (filters.name) params.append('name', filters.name);
      if (filters.period) params.append('period', filters.period);

      const response = await fetch(`${API_BASE}/actions/gachapon/search-items?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar itens'
      };
    }
  }

  /**
   * Buscar produtos para adicionar em caixa de gachapon
   */
  async searchGachaponProducts(filters: {
    searchTerm?: string;
    productID?: string;
    name?: string;
    period?: string;
  }): Promise<{
    success: boolean;
    data?: Array<{
      ProductID: number;
      ProductName: string;
      ItemNo00: number;
      ConsumeType00: number;
      Period00: number;
      Period01?: number;
      Period02?: number;
      Period03?: number;
      Period04?: number;
    }>;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
      if (filters.productID) params.append('productID', filters.productID);
      if (filters.name) params.append('name', filters.name);
      if (filters.period) params.append('period', filters.period);

      const response = await fetch(`${API_BASE}/actions/gachapon/search-products?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos'
      };
    }
  }

  /**
   * Obter configuração atual de uma caixa
   */
  async getGachaponBoxConfig(gachaponItemNo: number, type: 'item' | 'produto'): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/box-config/${gachaponItemNo}/${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao obter configuração da caixa:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter configuração'
      };
    }
  }

  /**
   * Criar solicitação de aprovação de caixa
   */
  async createGachaponRequest(data: {
    tipoCaixa: 'item' | 'produto';
    gachaponItemNo: number;
    gachaponName: string;
    config: {
      items: Array<{
        itemNo?: number;
        productID?: number;
        name: string;
        percentage: number;
        percentageDisplay: number;
        period: number;
        consumeType: number;
        broadcast: boolean;
      }>;
      totalPercentage: number;
      itemCount: number;
    };
  }): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/create-request`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Solicitação Criada', result.message || 'Solicitação criada com sucesso! Aguardando aprovação.');
      }

      return result;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar solicitação'
      };
    }
  }

  /**
   * Listar solicitações pendentes (apenas oidUser = 2)
   */
  async getPendingGachaponRequests(): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      solicitante_oiduser: number;
      solicitante_nickname: string;
      solicitante_discord: string;
      tipo_caixa: string;
      gachapon_itemno: number;
      gachapon_name: string;
      config_json: string;
      status: string;
      data_solicitacao: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/pending-requests`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao listar solicitações pendentes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar solicitações'
      };
    }
  }

  /**
   * Listar minhas solicitações
   */
  async getMyGachaponRequests(status?: string, period?: string): Promise<{
    success: boolean;
    data?: Array<{
      id: number;
      solicitante_oiduser: number;
      solicitante_nickname: string;
      solicitante_discord: string;
      tipo_caixa: string;
      gachapon_itemno: number;
      gachapon_name: string;
      config_json: string;
      status: string;
      data_solicitacao: string;
      data_aprovacao?: string;
      motivo_rejeicao?: string;
    }>;
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();

      if (status) {
        params.append('status', status);
      }

      if (period) {
        params.append('period', period);
      }

      const url = `${API_BASE}/actions/gachapon/my-requests${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao listar minhas solicitações:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar minhas solicitações'
      };
    }
  }

  /**
   * Aprovar solicitação (apenas oidUser = 2)
   */
  async approveGachaponRequest(id: number): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/approve/${id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Solicitação Aprovada', result.message || 'Caixa configurada com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao aprovar solicitação'
      };
    }
  }

  /**
   * Rejeitar solicitação (apenas oidUser = 2)
   */
  async rejectGachaponRequest(id: number, motivoRejeicao: string): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/reject/${id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ motivoRejeicao }),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Solicitação Rejeitada', result.message || 'Solicitação rejeitada');
      }

      return result;
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao rejeitar solicitação'
      };
    }
  }

  /**
   * Reenviar solicitação rejeitada
   */
  async resubmitGachaponRequest(id: number, config: any): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/resubmit/${id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ config }),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Solicitação Reenviada', result.message || 'Solicitação reenviada para aprovação!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao reenviar solicitação:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reenviar solicitação'
      };
    }
  }

  /**
   * Enviar alterações para PRODUÇÃO
   */
  async sendGachaponToProduction(id: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/send-to-production/${id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Enviado para Produção', result.message || 'Alterações enviadas para PRODUÇÃO com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao enviar para produção:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar para produção'
      };
    }
  }

  /**
   * Reverter alterações para o estado original
   */
  async revertGachaponChanges(id: number): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/gachapon/revert/${id}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Alterações Revertidas', result.message || 'Alterações revertidas com sucesso!');
      }

      return result;
    } catch (error) {
      console.error('Erro ao reverter alterações:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao reverter alterações'
      };
    }
  }

  // Obter todos os itens para mudança de grade
  async getAllItemsForGradeChange(): Promise<{
    success: boolean;
    data?: Array<{ ItemNo: number; Name: string; ItemGrade: number }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/items/for-grade-change`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });
      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar itens'
      };
    }
  }

  // Buscar itens para mudança de grade com termo de busca
  async searchItemsForGradeChange(searchTerm: string): Promise<{
    success: boolean;
    data?: Array<{ ItemNo: number; Name: string; ItemGrade: number; ItemType: number }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/itemgrade/search?searchTerm=${encodeURIComponent(searchTerm)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });
      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar itens'
      };
    }
  }

  // Obter produtos afetados por um array de ItemNos
  async getAffectedProductsByItemNos(itemNos: number[], newItemGrade?: number): Promise<{
    success: boolean;
    data?: Array<{
      ProductID: number;
      ProductName: string;
      ItemNo00: number;
      ItemName: string;
      CurrentItemGrade: number;
      ItemType: number;
      ConsumeType00: number;
      Period00: number;
      CashPrice: number;
      PointPrice: number;
      PeriodName: string;
      NewCashPrice?: number;
      NewItemGrade?: number;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/itemgrade/affected-products`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ itemNos, newItemGrade }),
        connectTimeout: 30000
      });
      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar produtos afetados'
      };
    }
  }

  // Atualizar o ItemGrade de uma lista de itens
  async updateItemGrade(itemNos: number[], newItemGrade: number): Promise<{
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/itemgrade/execute`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ itemNos, newItemGrade }),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);

      if (result.success) {
        this.showSuccessModal('ItemGrade Alterado', `${itemNos.length} item(ns) alterado(s) para ${newItemGrade} estrelas`);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar itens'
      };
    }
  }

  // Obter matriz de preços para um ItemType
  async getPriceMatrixForItemType(itemType: number): Promise<{
    success: boolean;
    data?: {
      ItemType: number;
      TypeName: string;
      Price9Stars_1Day: number;
      Price9Stars_7Days: number;
      Price9Stars_30Days: number;
      Price9Stars_90Days: number;
      Price9Stars_Perm: number;
      Price8Stars_1Day: number;
      Price8Stars_7Days: number;
      Price8Stars_30Days: number;
      Price8Stars_90Days: number;
      Price8Stars_Perm: number;
      Price7Stars_1Day: number;
      Price7Stars_7Days: number;
      Price7Stars_30Days: number;
      Price7Stars_90Days: number;
      Price7Stars_Perm: number;
      Price6Stars_1Day: number;
      Price6Stars_7Days: number;
      Price6Stars_30Days: number;
      Price6Stars_90Days: number;
      Price6Stars_Perm: number;
      Price5Stars_1Day: number;
      Price5Stars_7Days: number;
      Price5Stars_30Days: number;
      Price5Stars_90Days: number;
      Price5Stars_Perm: number;
    };
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/itemgrade/price-matrix?itemType=${itemType}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });
      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar matriz de preços'
      };
    }
  }

  // Buscar todas as recompensas GOA
  async getGoaRankRewards(): Promise<{
    success: boolean;
    data?: Array<{
      RankEmblem: number;
      RankName: string;
      RankEXP: number;
      ProductIDs: string;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/goa-rank-rewards`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });
      return await this.handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar recompensas GOA'
      };
    }
  }

  // Atualizar recompensa GOA
  async updateGoaRankReward(rankEmblem: number, productIDs: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/goa-rank-rewards`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ rankEmblem, productIDs }),
        connectTimeout: 30000
      });

      const result = await this.handleResponse<{
        success: boolean;
        message?: string;
      }>(response);

      if (result.success) {
        this.showSuccessModal('Recompensa GOA Alterada', 'As recompensas do rank GOA foram atualizadas com sucesso!');
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar recompensa GOA'
      };
    }
  }

}

// Exportar instância única
export default new ApiTauriService();
