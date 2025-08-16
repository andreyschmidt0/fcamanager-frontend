import { MockUser, findUserByCredentials, isValidCredentials } from '../mock/users';

export interface AuthResult {
    success: boolean;
    user?: MockUser;
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
    private currentUser: MockUser | null = null;
    private sessionToken: string | null = null;

    private constructor() {}

    static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    private generateSecureToken(): string {
        // Gera um token simples para o mock (em produção, use JWT ou similar)
        return btoa(Date.now() + Math.random().toString()).replace(/[^a-zA-Z0-9]/g, '');
    }

    async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            // Validação de entrada
            const validation = InputValidator.validateCredentials(credentials);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.errors.join(', ')
                };
            }

            // Sanitização adicional
            const sanitizedUsername = InputValidator.sanitizeString(credentials.username);
            const sanitizedPassword = credentials.password; // Password não deve ser sanitizado da mesma forma

            // Verificação de credenciais usando prepared statement simulado
            const user = this.authenticateUser(sanitizedUsername, sanitizedPassword);

            if (!user) {
                return {
                    success: false,
                    error: 'Credenciais inválidas'
                };
            }

            // Gera token de sessão
            const token = this.generateSecureToken();
            
            // Atualiza último login
            user.lastLogin = new Date();
            
            // Define usuário atual
            this.currentUser = user;
            this.sessionToken = token;

            return {
                success: true,
                user: {
                    ...user,
                    password: '[PROTECTED]' // Nunca retorna a senha
                } as MockUser,
                token
            };

        } catch (error) {
            console.error('Erro durante autenticação:', error);
            return {
                success: false,
                error: 'Erro interno do servidor'
            };
        }
    }

    private authenticateUser(username: string, password: string): MockUser | null {
        // Simula prepared statement - previne SQL injection
        // Em uma aplicação real, isso seria feito no backend com prepared statements reais
        
        // Validação adicional para prevenir ataques
        if (username.includes('\'') || username.includes('"') || 
            username.includes(';') || username.includes('--')) {
            console.warn('Tentativa de SQL injection detectada:', username);
            return null;
        }

        return findUserByCredentials(username, password);
    }

    logout(): void {
        this.currentUser = null;
        this.sessionToken = null;
    }

    getCurrentUser(): MockUser | null {
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
}

export default AuthService;