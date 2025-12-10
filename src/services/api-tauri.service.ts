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
const API_BASE = import.meta.env.VITE_API_URL || 'http://181.215.45.220:3000/api';

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


  async getLogs(period?: string, gmNickname?: string, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (gmNickname) params.append('gmNickname', gmNickname);
      if (limit) params.append('limit', limit.toString());
      
      const response = await fetch(`${API_BASE}/logs?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 15000
      });

      const data = await this.handleResponse<{ logs: any[] }>(response);
      return data.logs || [];
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      return [];
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

      return await this.handleResponse(response);
    } catch (error) {
      console.error('Erro ao inserir na blacklist de Fireteam:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao inserir na blacklist de Fireteam'
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
  async getBanHistory(targetOidUser: number): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
    message?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/ban-history/${targetOidUser}`, {
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
  async getCampItems(): Promise<{
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
      const response = await fetch(`${API_BASE}/actions/items/mode-camp`, {
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
  async getAllItemBoxes(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{ BoxName: string; GachaponItemNo: number }>;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/boxes/items`, {
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
  async getAllProductBoxes(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
    data?: Array<{ BoxName: string; GachaponItemNo: number }>;
  }> {
    try {
      const response = await fetch(`${API_BASE}/actions/boxes/products`, {
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
  async getItemsInBox(gachaponItemNo: number): Promise<{
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
      const response = await fetch(`${API_BASE}/actions/boxes/items/${gachaponItemNo}/contents`, {
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
  async getProductsInBox(gachaponItemNo: number): Promise<{
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
      const response = await fetch(`${API_BASE}/actions/boxes/products/${gachaponItemNo}/contents`, {
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

}

// Exportar instância única
export default new ApiTauriService();
