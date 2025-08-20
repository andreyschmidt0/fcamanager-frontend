import apiService from './api.service';

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
        password: string;
    };
    error?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

class InputValidator {
    static sanitizeString(input: string): string {
        if (typeof input !== 'string') {
            throw new Error('Input deve ser uma string');
        }
        
        // Remove caracteres potencialmente maliciosos
        return input
            .trim()
            .replace(/[<>'"]/g, '')
            .replace(/[;-]/g, '')
            .replace(/--/g, '')
            .replace(/(\bor\b|\band\b|\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b)/gi, '');
    }

    static validateUsername(username: string): boolean {
        const sanitized = this.sanitizeString(username);
        
        // Username deve ter entre 3 e 20 caracteres, apenas letras, números e underscore
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(sanitized) && sanitized.length === username.trim().length;
    }

    static validatePassword(password: string): boolean {
        if (typeof password !== 'string') {
            return false;
        }
        
        // Password deve ter pelo menos 6 caracteres
        return password.length >= 6 && password.length <= 50;
    }

    static validateCredentials(credentials: LoginCredentials): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!credentials.username || !this.validateUsername(credentials.username)) {
            errors.push('Username inválido. Use apenas letras, números e underscore (3-20 caracteres)');
        }

        if (!credentials.password || !this.validatePassword(credentials.password)) {
            errors.push('Password inválido. Deve ter entre 6 e 50 caracteres');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

class AuthService {
    private static instance: AuthService;
    private currentUser: any = null;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private tokenExpiryTime: number | null = null;

    private constructor() {
        // Restaurar sessão do localStorage se existir
        this.restoreSession();
    }

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private restoreSession(): void {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userData = localStorage.getItem('currentUser');
        const expiryTime = localStorage.getItem('tokenExpiryTime');
        
        if (accessToken && refreshToken && userData) {
            try {
                this.accessToken = accessToken;
                this.refreshToken = refreshToken;
                this.tokenExpiryTime = expiryTime ? parseInt(expiryTime) : null;
                const backendUser = JSON.parse(userData);
                // Converter formato do backend para o formato esperado
                this.currentUser = {
                    id: backendUser.id,
                    username: backendUser.username,
                    profile: {
                        nickname: backendUser.profile?.nickname || backendUser.nickname,
                        email: backendUser.profile?.email || backendUser.email,
                        discordId: backendUser.profile?.discordId || backendUser.discordId
                    },
                    role: backendUser.role,
                    lastLogin: new Date(),
                    password: '[PROTECTED]'
                };
            } catch (error) {
                console.error('Erro ao restaurar sessão:', error);
                this.clearSession();
            }
        }
    }

    private clearSession(): void {
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiryTime = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('tokenExpiryTime');
        apiService.logout();
    }

    async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            // Validação de entrada básica
            const validation = InputValidator.validateCredentials(credentials);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            console.log('🔄 Fazendo login no backend...', { username: credentials.username });

            // Fazer login via API backend real
            const result = await apiService.loginCompatible(credentials);
            
            if (result.success && result.user && result.accessToken) {
                this.currentUser = result.user;
                this.accessToken = result.accessToken;
                this.refreshToken = result.refreshToken || null;
                
                // Calcular tempo de expiração (15 minutos)
                this.tokenExpiryTime = Date.now() + (15 * 60 * 1000);
                
                // Salvar no localStorage
                localStorage.setItem('accessToken', result.accessToken);
                if (result.refreshToken) {
                    localStorage.setItem('refreshToken', result.refreshToken);
                }
                localStorage.setItem('currentUser', JSON.stringify(result.user));
                localStorage.setItem('tokenExpiryTime', this.tokenExpiryTime.toString());
                
                // Configurar header de autorização
                apiService.setAuthToken(result.accessToken);
                
                console.log('✅ Login realizado com sucesso:', {
                    username: result.user.username,
                    nickname: result.user.profile.nickname,
                    role: result.user.role
                });
            }

            return result;

        } catch (error) {
            console.error('❌ Erro durante autenticação:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro interno do servidor'
            };
        }
    }

    logout(): void {
        console.log('🚪 Realizando logout...');
        this.clearSession();
    }

    getCurrentUser(): any {
        return this.currentUser;
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    getRefreshToken(): string | null {
        return this.refreshToken;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null && this.accessToken !== null;
    }

    isTokenExpired(): boolean {
        if (!this.tokenExpiryTime) return true;
        return Date.now() >= this.tokenExpiryTime;
    }

    async refreshAccessToken(): Promise<boolean> {
        if (!this.refreshToken) return false;
        
        try {
            const result = await apiService.refreshToken(this.refreshToken);
            
            if (result.success && result.accessToken) {
                this.accessToken = result.accessToken;
                this.refreshToken = result.refreshToken || this.refreshToken;
                this.tokenExpiryTime = Date.now() + (15 * 60 * 1000);
                
                // Atualizar localStorage
                localStorage.setItem('accessToken', result.accessToken);
                if (result.refreshToken) {
                    localStorage.setItem('refreshToken', result.refreshToken);
                }
                localStorage.setItem('tokenExpiryTime', this.tokenExpiryTime.toString());
                
                // Configurar header de autorização
                apiService.setAuthToken(result.accessToken);
                
                return true;
            }
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            this.clearSession();
        }
        
        return false;
    }

    async ensureValidToken(): Promise<boolean> {
        if (!this.isAuthenticated()) return false;
        
        if (this.isTokenExpired()) {
            console.log('🔄 Token expirado, renovando...');
            return await this.refreshAccessToken();
        }
        
        return true;
    }

    // Método adicional para testar conexão com backend
    async testBackendConnection(): Promise<boolean> {
        try {
            const isConnected = await apiService.testConnection();
            console.log('🌐 Conexão com backend:', isConnected ? '✅ OK' : '❌ FALHA');
            return isConnected;
        } catch (error) {
            console.error('❌ Erro ao testar conexão:', error);
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

export default AuthService;