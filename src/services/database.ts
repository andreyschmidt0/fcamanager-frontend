// Simulação de prepared statements para prevenir SQL injection
// Em uma aplicação real, isto seria implementado no backend com um ORM ou biblioteca de banco de dados

export interface PreparedQuery {
    query: string;
    parameters: any[];
}

export class DatabaseSecurity {
    // Simula prepared statement para validação de usuário
    static prepareUserQuery(username: string, password: string): PreparedQuery {
        // Em SQL real seria algo como: "SELECT * FROM users WHERE username = ? AND password = ?"
        const query = "SELECT_USER_BY_CREDENTIALS";
        
        // Validação rigorosa dos parâmetros antes de usar
        const sanitizedParams = this.sanitizeParameters([username, password]);
        
        return {
            query,
            parameters: sanitizedParams
        };
    }

    // Simula prepared statement para busca de usuário por ID
    static prepareUserByIdQuery(userId: string): PreparedQuery {
        const query = "SELECT_USER_BY_ID";
        const sanitizedParams = this.sanitizeParameters([userId]);
        
        return {
            query,
            parameters: sanitizedParams
        };
    }

    // Sanitização rigorosa de parâmetros
    private static sanitizeParameters(params: any[]): any[] {
        return params.map(param => {
            if (typeof param === 'string') {
                return this.sanitizeStringParameter(param);
            }
            return param;
        });
    }

    private static sanitizeStringParameter(param: string): string {
        if (typeof param !== 'string') {
            throw new Error('Parâmetro deve ser string');
        }

        // Remove ou escapa caracteres perigosos
        let sanitized = param
            .replace(/'/g, "''")  // Escapa aspas simples
            .replace(/"/g, '""')  // Escapa aspas duplas
            .replace(/;/g, '')    // Remove ponto e vírgula
            .replace(/--/g, '')   // Remove comentários SQL
            .replace(/\/\*/g, '') // Remove início de comentário multilinhas
            .replace(/\*\//g, '') // Remove fim de comentário multilinhas
            .replace(/xp_/gi, '') // Remove procedimentos estendidos perigosos
            .replace(/sp_/gi, '') // Remove stored procedures do sistema
            .trim();

        // Valida contra padrões conhecidos de SQL injection
        const sqlInjectionPatterns = [
            /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
            /(or\s+1\s*=\s*1)/gi,
            /(and\s+1\s*=\s*1)/gi,
            /(';\s*(drop|delete|insert|update))/gi
        ];

        for (const pattern of sqlInjectionPatterns) {
            if (pattern.test(sanitized)) {
                console.warn('Possível tentativa de SQL injection detectada:', param);
                throw new Error('Parâmetro contém conteúdo suspeito');
            }
        }

        return sanitized;
    }

    // Simula execução de prepared statement
    static executeQuery(preparedQuery: PreparedQuery): any {
        console.log('Executando query preparada:', preparedQuery.query);
        console.log('Parâmetros sanitizados:', preparedQuery.parameters);
        
        // Em uma aplicação real, aqui seria feita a execução real da query
        // com os parâmetros já sanitizados e validados
        
        return { success: true };
    }

    // Validação adicional de tipos de entrada
    static validateParameterTypes(params: any[], expectedTypes: string[]): boolean {
        if (params.length !== expectedTypes.length) {
            return false;
        }

        for (let i = 0; i < params.length; i++) {
            const paramType = typeof params[i];
            const expectedType = expectedTypes[i];
            
            if (paramType !== expectedType) {
                console.error(`Tipo de parâmetro inválido. Esperado: ${expectedType}, Recebido: ${paramType}`);
                return false;
            }
        }

        return true;
    }

    // Log de tentativas de acesso para auditoria
    static logAccessAttempt(username: string, success: boolean, ip?: string): void {
        const logEntry = {
            timestamp: new Date().toISOString(),
            username: username,
            success: success,
            ip: ip || 'unknown',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        };

        console.log('Log de acesso:', logEntry);
        
        // Em produção, isto seria salvo em um sistema de log seguro
        // localStorage é usado aqui apenas para demonstração
        try {
            const logs = JSON.parse(localStorage.getItem('accessLogs') || '[]');
            logs.push(logEntry);
            
            // Mantém apenas os últimos 100 logs
            if (logs.length > 100) {
                logs.splice(0, logs.length - 100);
            }
            
            localStorage.setItem('accessLogs', JSON.stringify(logs));
        } catch (error) {
            console.error('Erro ao salvar log:', error);
        }
    }
}