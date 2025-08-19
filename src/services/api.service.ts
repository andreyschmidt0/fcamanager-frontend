import axios, { AxiosError } from 'axios';

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
  const token = localStorage.getItem('authToken');
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
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
  nickname: string;
  email: string;
  role: 'admin' | 'user';
}

// Interface para resposta de login
export interface LoginResponse {
  token: string;
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
    };
    role: string;
    lastLogin: Date;
    password: string; // Sempre '[PROTECTED]'
  };
  error?: string;
  token?: string;
}

class ApiService {
  // Login no backend real
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Salvar token e usuário no localStorage
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      
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
        success: true,
        user: {
          id: response.user.id,
          username: response.user.username,
          profile: {
            nickname: response.user.nickname,
            email: response.user.email
          },
          role: response.user.role,
          lastLogin: new Date(),
          password: '[PROTECTED]'
        },
        token: response.token
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

  // Logout
  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
  }

  // Obter token atual
  getToken(): string | null {
    return localStorage.getItem('authToken');
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
}

// Exportar instância única
export default new ApiService();