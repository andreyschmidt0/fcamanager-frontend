import { fetch } from '@tauri-apps/plugin-http';
import { ErrorCapture } from '../components/debug/DebugModal';

export interface PlayerProfileData {
  strDiscordId: string;
  strEmail: string;
  strNexonId: string;
  strNickname: string;
}


// Configuração da API
const API_BASE = import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api';

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
        // Token expirado ou inválido
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tokenExpiryTime');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
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


  async getLogs(period?: string, gmNickname?: string, limit?: number, discordId?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (gmNickname) params.append('gmNickname', gmNickname);
      if (limit) params.append('limit', limit.toString());
      if (discordId) params.append('discordId', discordId);
      
      const response = await fetch(`${API_BASE}/logs?${params.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
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
  async getGMList(discordId: string): Promise<{isAuthorized: boolean, gms?: any[], gmUsers?: any[]}> {
    try {
      const response = await fetch(`${API_BASE}/users/gms?discordId=${encodeURIComponent(discordId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<{isAuthorized: boolean, gms?: any[], gmUsers?: any[]}>(response);
    } catch (error) {
      console.error('Erro ao buscar GMs:', error);
      return {isAuthorized: false};
    }
  }

  // GM Management endpoints
  async getGMManagementList(): Promise<{success: boolean, gms: any[], total: number}> {
    try {
      const response = await fetch(`${API_BASE}/gm-management/list`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<{success: boolean, gms: any[], total: number}>(response);
    } catch (error) {
      console.error('Erro ao buscar lista de GMs:', error);
      return {success: false, gms: [], total: 0};
    }
  }

  async updateGMRole(discordId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gm-management/role?discordId=${encodeURIComponent(discordId)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao atualizar role do GM:', error);
      throw error;
    }
  }

  async updateGMStatus(discordId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gm-management/status?discordId=${encodeURIComponent(discordId)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao atualizar status do GM:', error);
      throw error;
    }
  }

  async updateGMNotes(discordId: string, data: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gm-management/notes?discordId=${encodeURIComponent(discordId)}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao atualizar notas do GM:', error);
      throw error;
    }
  }

  // Get GM user info by Discord ID
  async getGMUser(discordId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE}/gm-management/user/${encodeURIComponent(discordId)}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        connectTimeout: 30000
      });

      return await this.handleResponse<any>(response);
    } catch (error) {
      console.error('Erro ao buscar informações do GM:', error);
      throw error;
    }
  }

  // Change user password
  async changePassword(data: {
    targetNexonId: string;
    newPassword: string;
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
    } catch (error) {
      console.error('Erro ao alterar email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar email'
      };
    }
  }

  async banUser(data: {
    targetNexonId: string;
    reason: string;
    adminDiscordId: string;
    targetOidUser?: number;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
    } catch (error) {
      console.error('Erro ao banir usuário:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao banir usuário'
      };
    }
  }

  async removeAccount(data: {
    targetNexonId: string;
    reason: string;
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
    } catch (error) {
      console.error('Erro ao enviar cash:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao enviar cash'
      };
    }
  }

  // Deletar clã usando BSP_DeleteSingleClan
  async deleteClan(data: {
    oidGuild: number;
    reason: string;
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
    } catch (error) {
      console.error('Erro ao excluir clã:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir clã'
      };
    }
  }

  // Transferir liderança de clã usando BSP_AdminTransferClanLeadership
  async transferClanLeadership(data: {
    gmOidUser: number;
    oldLeaderOidUser: number;
    newLeaderOidUser: number;
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
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
    adminDiscordId: string;
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

      return await this.handleResponse<{
        success: boolean;
        message?: string;
        data?: any;
      }>(response);
    } catch (error) {
      console.error('Erro ao alterar Discord ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar Discord ID'
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
}

// Exportar instância única
export default new ApiTauriService();