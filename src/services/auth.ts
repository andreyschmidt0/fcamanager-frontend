import apiService from './api.service';

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
        password: string;
    };
    error?: string;
    token?: string;
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
    private sessionToken: string | null = null;

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
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('currentUser');
        
        if (token && userData) {
            try {
                this.sessionToken = token;
                const backendUser = JSON.parse(userData);
                // Converter formato do backend para o formato esperado
                this.currentUser = {
                    id: backendUser.id,
                    username: backendUser.username,
                    profile: {
                        nickname: backendUser.nickname,
                        email: backendUser.email
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
        this.sessionToken = null;
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
            
            if (result.success && result.user && result.token) {
                this.currentUser = result.user;
                this.sessionToken = result.token;
                
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

    getSessionToken(): string | null {
        return this.sessionToken;
    }

    isAuthenticated(): boolean {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    validateSession(token: string): boolean {
        return this.sessionToken === token && this.isAuthenticated();
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