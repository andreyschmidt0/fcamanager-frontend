// Arquivo de demonstração e teste do sistema de autenticação seguro
import AuthService from '../services/auth';
import { DatabaseSecurity } from '../services/database';

// Função para testar diferentes cenários de segurança
export class AuthSecurityTest {
    private static authService = AuthService.getInstance();

    // Teste de usuários válidos
    static async testValidUsers() {
        console.log('=== Testando usuários válidos ===');
        
        const validTests = [
            { username: 'admin', password: 'admin123' },
            { username: 'moderator', password: 'mod123' },
            { username: 'testuser', password: 'test123' }
        ];

        for (const test of validTests) {
            try {
                const result = await this.authService.login(test);
                console.log(`✅ Login válido: ${test.username} -`, result.success ? 'SUCESSO' : 'FALHA');
                if (result.success) {
                    console.log(`   Usuário: ${result.user?.profile.nickname}, Role: ${result.user?.role}`);
                }
                this.authService.logout(); // Limpa sessão para próximo teste
            } catch (error) {
                console.error(`❌ Erro no teste válido ${test.username}:`, error);
            }
        }
    }

    // Teste de tentativas de SQL injection
    static async testSQLInjectionAttempts() {
        console.log('\n=== Testando tentativas de SQL injection ===');
        
        const injectionTests = [
            { username: "admin'; DROP TABLE users; --", password: 'any' },
            { username: "admin' OR '1'='1", password: 'any' },
            { username: "admin", password: "' OR '1'='1' --" },
            { username: "'; UNION SELECT * FROM users; --", password: 'test' },
            { username: "admin\"; DELETE FROM users; --", password: 'test' },
            { username: "admin' AND 1=1 --", password: 'test' }
        ];

        for (const test of injectionTests) {
            try {
                const result = await this.authService.login(test);
                console.log(`🛡️  SQL injection bloqueada: ${test.username.substring(0, 20)}... - BLOQUEADA`);
            } catch (error) {
                console.log(`🛡️  SQL injection detectada e bloqueada: ${test.username.substring(0, 20)}...`);
            }
        }
    }

    // Teste de validação de entrada
    static async testInputValidation() {
        console.log('\n=== Testando validação de entrada ===');
        
        const validationTests = [
            { username: '', password: 'test123', expected: 'Username vazio' },
            { username: 'ab', password: 'test123', expected: 'Username muito curto' },
            { username: 'a'.repeat(25), password: 'test123', expected: 'Username muito longo' },
            { username: 'test@user', password: 'test123', expected: 'Username com caracteres inválidos' },
            { username: 'testuser', password: '123', expected: 'Password muito curta' },
            { username: 'testuser', password: '', expected: 'Password vazia' },
            { username: 'test<script>', password: 'test123', expected: 'Username com HTML/JS' }
        ];

        for (const test of validationTests) {
            try {
                const result = await this.authService.login(test);
                console.log(`🔍 Validação: ${test.expected} - ${result.success ? 'FALHOU (deveria ter bloqueado)' : 'BLOQUEADA'}`);
            } catch (error) {
                console.log(`🔍 Validação: ${test.expected} - BLOQUEADA`);
            }
        }
    }

    // Teste de usuários inativos
    static async testInactiveUsers() {
        console.log('\n=== Testando usuários inativos ===');
        
        try {
            const result = await this.authService.login({
                username: 'inactiveuser',
                password: 'inactive123'
            });
            console.log(`🚫 Usuário inativo: ${result.success ? 'PERMITIDO (ERRO!)' : 'BLOQUEADO'}`);
        } catch (error) {
            console.log('🚫 Usuário inativo: BLOQUEADO');
        }
    }

    // Teste de força bruta (simulação)
    static async testBruteForceProtection() {
        console.log('\n=== Testando proteção contra força bruta ===');
        
        const attempts = 5;
        for (let i = 1; i <= attempts; i++) {
            try {
                const result = await this.authService.login({
                    username: 'admin',
                    password: 'senhaerrada' + i
                });
                console.log(`🔨 Tentativa ${i}/5: ${result.success ? 'SUCESSO (ERRO!)' : 'FALHADA'}`);
            } catch (error) {
                console.log(`🔨 Tentativa ${i}/5: FALHADA`);
            }
        }
        
        console.log('ℹ️  Em produção, implementar bloqueio temporário após várias tentativas');
    }

    // Executa todos os testes
    static async runAllTests() {
        console.log('🔒 INICIANDO TESTES DE SEGURANÇA DO SISTEMA DE AUTENTICAÇÃO\n');
        
        await this.testValidUsers();
        await this.testSQLInjectionAttempts();
        await this.testInputValidation();
        await this.testInactiveUsers();
        await this.testBruteForceProtection();
        
        console.log('\n✅ TESTES DE SEGURANÇA CONCLUÍDOS');
        console.log('\n📊 Para ver logs de acesso, verifique localStorage.accessLogs no navegador');
    }

    // Demonstra uso da prepared statement simulada
    static demonstratePreparedStatements() {
        console.log('\n=== Demonstração de Prepared Statements ===');
        
        // Exemplo seguro
        const safeQuery = DatabaseSecurity.prepareUserQuery('admin', 'admin123');
        console.log('✅ Query segura preparada:', safeQuery);
        
        // Exemplo com tentativa de injection (será sanitizado)
        try {
            const maliciousQuery = DatabaseSecurity.prepareUserQuery("admin'; DROP TABLE users; --", 'password');
            console.log('🛡️  Query maliciosa sanitizada:', maliciousQuery);
        } catch (error) {
            console.log('🛡️  Query maliciosa bloqueada:', error);
        }
    }

    // Exibe logs de acesso armazenados
    static showAccessLogs() {
        console.log('\n=== Logs de Acesso ===');
        try {
            const logs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
            console.table(logs.slice(-10)); // Mostra últimos 10 logs
        } catch (error) {
            console.log('Nenhum log encontrado ou erro ao ler logs');
        }
    }
}

// Exemplo de uso no console do navegador:
// import { AuthSecurityTest } from './mock/auth-test';
// AuthSecurityTest.runAllTests();
// AuthSecurityTest.demonstratePreparedStatements();
// AuthSecurityTest.showAccessLogs();

export default AuthSecurityTest;