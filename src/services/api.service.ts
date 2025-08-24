import axios, { AxiosError } from 'axios';

export interface PlayerProfileData {
  strDiscordId: string;
  strEmail: string;
  strNexonId: string;
  strNickname: string;
}

export interface LogPayload {
  adminDiscordId: string;
  adminNickname: string;
  targetDiscordId: string;
  targetNickname: string;
  action: string;
  old_value?: string;
  new_value?: string;
  details: string;
  notes?: string;
}


// Configuração da API
const API_BASE = import.meta.env.PROD 
  ? 'https://fca-manager-api.onrender.com/api'  // Para produção
  : 'http://localhost:3000/api';                // Para desenvolvimento local

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros e logout automático
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('tokenExpiryTime');
      // Opcional: redirecionar para login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

class ApiService {
  // Login no backend real
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || 'Erro de conexão com o servidor';
        throw new Error(message);
      }
      throw new Error('Erro inesperado durante o login');
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
      await api.get('/auth/verify');
      return true;
    } catch {
      return false;
    }
  }

  // Obter dados do usuário atual
  async getCurrentUser(): Promise<BackendUser | null> {
    try {
      const response = await api.get<{ user: BackendUser }>('/auth/me');
      return response.data.user;
    } catch {
      return null;
    }
  }

  
  // Configurar token de autorização
  setAuthToken(token: string): void {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Remover token de autorização
  removeAuthToken(): void {
    delete api.defaults.headers.common['Authorization'];
  }
  
  // Refresh token
  async refreshToken(refreshToken: string): Promise<{success: boolean; accessToken?: string; refreshToken?: string; error?: string}> {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error || 'Erro ao renovar token'
        };
      }
      return {
        success: false,
        error: 'Erro inesperado ao renovar token'
      };
    }
  }
  
  // Logout
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiryTime');
    this.removeAuthToken();
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
      const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
      return response.data.status === 'OK';
    } catch {
      return false;
    }
  }

  async getPlayerProfileByDiscordId(discordId: string): Promise<PlayerProfileData | null> {
    try {
      const response = await api.get(`/users/profile/${encodeURIComponent(discordId)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil do jogador:', error);
      return null;
    }
  }

  async getPlayerProfile(nickname: string): Promise<any | null> {
    try {
      const response = await api.get(`/users/profile/${encodeURIComponent(nickname)}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar perfil do jogador por nickname:', error);
      return null;
    }
  }

  async createLog(logData: LogPayload): Promise<void> {
    try {
      await api.post('/logs/create', logData);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erro ao registrar log:', error.response?.data?.error || 'Erro desconhecido');
      }
      throw new Error('Falha ao registrar log no backend.');
    }
  }

  async getLogs(period?: string, gmNickname?: string, limit?: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (gmNickname) params.append('gmNickname', gmNickname);
      if (limit) params.append('limit', limit.toString());
      
      const response = await api.get(`/logs?${params.toString()}`);
      return response.data.logs || [];
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
      
      const response = await api.get(`/users/validate-player?${params.toString()}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          isValid: false,
          error: error.response?.data?.error || 'Erro na validação',
          details: error.response?.data?.details || 'Erro de conexão'
        };
      }
      return {
        isValid: false,
        error: 'Erro inesperado na validação'
      };
    }
  }
}

// Exportar instância única
export default new ApiService();