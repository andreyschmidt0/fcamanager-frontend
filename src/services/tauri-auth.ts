import { invoke } from '@tauri-apps/api/core';
import AuthService, { AuthResult, LoginCredentials } from './auth';

// Enhanced authentication service with Tauri integration
class TauriAuthService {
    private static tauriInstance: TauriAuthService;
    private authService: AuthService;

    private constructor() {
        this.authService = AuthService.getInstance();
    }

    static getInstance(): TauriAuthService {
        if (!TauriAuthService.tauriInstance) {
            TauriAuthService.tauriInstance = new TauriAuthService();
        }
        return TauriAuthService.tauriInstance;
    }

    async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            // First, perform the standard web-based authentication
            const result = await this.authService.login(credentials);

            // Log security events to Tauri backend
            await this.logSecurityEvent(
                'login_attempt',
                credentials.username,
                result.success
            );

            return result;
        } catch (error) {
            console.error('Tauri auth error:', error);
            
            // Log the error event
            await this.logSecurityEvent(
                'login_error',
                credentials.username,
                false
            );

            return {
                success: false,
                error: 'Authentication service error'
            };
        }
    }

    private async logSecurityEvent(event: string, username: string, success: boolean): Promise<void> {
        try {
            await invoke('log_security_event', {
                event,
                username,
                success
            });
        } catch (error) {
            console.error('Failed to log security event:', error);
        }
    }

    async getAppVersion(): Promise<string> {
        try {
            return await invoke('get_app_version');
        } catch (error) {
            console.error('Failed to get app version:', error);
            return 'Unknown';
        }
    }

    // Enhanced session management with Tauri storage
    async saveSessionSecurely(token: string, user: any): Promise<void> {
        try {
            // In a real app, you would use Tauri's secure storage
            // For now, we'll use the existing localStorage with enhanced logging
            localStorage.setItem('secure_session', JSON.stringify({ token, user }));
            
            await this.logSecurityEvent(
                'session_created',
                user.username,
                true
            );
        } catch (error) {
            console.error('Failed to save session:', error);
        }
    }

    async loadSecureSession(): Promise<{ token: string; user: any } | null> {
        try {
            const session = localStorage.getItem('secure_session');
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Failed to load session:', error);
            return null;
        }
    }

    async clearSecureSession(): Promise<void> {
        try {
            localStorage.removeItem('secure_session');
            
            if (this.getCurrentUser()) {
                await this.logSecurityEvent(
                    'session_destroyed',
                    this.getCurrentUser()?.username || 'unknown',
                    true
                );
            }

            this.logout();
        } catch (error) {
            console.error('Failed to clear session:', error);
        }
    }

    // Delegate methods to the wrapped AuthService
    logout(): void {
        this.authService.logout();
    }

    getCurrentUser() {
        return this.authService.getCurrentUser();
    }

    getSessionToken(): string | null {
        return this.authService.getSessionToken();
    }

    isAuthenticated(): boolean {
        return this.authService.isAuthenticated();
    }

    validateSession(token: string): boolean {
        return this.authService.validateSession(token);
    }
}

// Check if running in Tauri context
export const isRunningInTauri = (): boolean => {
    return (window as any).__TAURI__ !== undefined;
};

// Factory function to get the appropriate auth service
export const getAuthService = (): AuthService | TauriAuthService => {
    if (isRunningInTauri()) {
        return TauriAuthService.getInstance();
    }
    return AuthService.getInstance();
};

export default TauriAuthService;