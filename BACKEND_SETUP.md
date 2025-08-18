# FCA Manager - Backend API Setup

## 📋 Resumo do Projeto

Este documento contém todas as instruções para implementar o backend da aplicação **FCA Manager**, baseado na nossa conversa anterior. O backend será uma API REST que gerenciará logs de atividades administrativas com controle de acesso por roles.

## 🎯 Objetivo

Criar uma API Node.js + Express que:
- Conecte a um banco de dados existente para autenticação
- Gerencie logs de atividades com controle de acesso (admin vs usuário comum)
- Use Prisma ORM para queries seguras
- Seja deployado no Render

## 🏗️ Arquitetura Definida

```
Frontend (Tauri App) ←→ REST API ←→ Prisma ORM ←→ PostgreSQL
```

### **Por que essa arquitetura:**
- ✅ **Sem Socket.IO**: Logs são para auditoria, não colaboração em tempo real
- ✅ **REST API simples**: Mais fácil de manter e escalar
- ✅ **Prisma ORM**: Type safety e queries seguras
- ✅ **PostgreSQL**: Banco robusto para produção

## 📦 Stack Tecnológica

### **Backend:**
- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (conectar ao existente)
- **Auth**: JWT + bcryptjs
- **Security**: helmet, cors, express-rate-limit
- **Deploy**: Render

### **Frontend (já existe):**
- **App**: Tauri + React + TypeScript
- **HTTP Client**: axios
- **Estado**: React Context (ActivityLogContext)

## 📁 Estrutura do Projeto Backend

```
fca-manager-api/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── logs.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── logs.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   ├── lib/
│   │   └── prisma.js
│   ├── utils/
│   │   └── helpers.js
│   └── server.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Setup Inicial

### **1. Criar Projeto:**
```bash
mkdir fca-manager-api
cd fca-manager-api
npm init -y
```

### **2. Instalar Dependências:**
```bash
# Dependências principais
npm install express cors helmet
npm install jsonwebtoken bcryptjs
npm install prisma @prisma/client
npm install dotenv express-rate-limit

# Dev dependencies
npm install -D @types/node @types/express typescript ts-node nodemon
```

### **3. package.json configurado:**
```json
{
  "name": "fca-manager-api",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "npm run migrate:deploy && node src/server.js",
    "dev": "nodemon src/server.js",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:dev": "prisma migrate dev",
    "generate": "prisma generate",
    "studio": "prisma studio"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

## 🗄️ Schema do Banco de Dados

### **Prisma Schema (prisma/schema.prisma):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// TABELA EXISTENTE (não criar, apenas mapear)
model User {
  id        Int     @id @default(autoincrement())
  username  String  @unique @db.VarChar(50)
  email     String  @unique @db.VarChar(100)
  password  String  @db.VarChar(255) // Adaptar conforme hash usado
  role      String  @default("user") @db.VarChar(20) // admin, user
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relacionamento com logs
  activityLogs ActivityLog[]
  
  @@map("users") // Nome real da tabela existente
}

// TABELA NOVA (será criada para logs)
model ActivityLog {
  id            Int      @id @default(autoincrement())
  userId        Int      @map("user_id")
  adminName     String   @map("admin_name") @db.VarChar(100)
  action        String   @db.VarChar(50) // Enviar, Banir, Excluir, Transferir, Alterar
  target        String   @db.VarChar(100)
  details       String   @db.Text
  justification String?  @db.Text
  amount        Int?
  period        String?  @db.VarChar(50)
  amountType    String?  @map("amount_type") @db.VarChar(20) // cash, exp, item
  createdAt     DateTime @default(now()) @map("created_at")
  
  // FK para tabela existente
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([createdAt])
  @@index([adminName])
  @@map("activity_logs")
}
```

### **Setup do Prisma:**
```bash
# Inicializar Prisma
npx prisma init

# Conectar ao banco existente (fazer introspection)
npx prisma db pull

# Editar schema.prisma para adicionar tabela de logs

# Criar migração apenas para logs
npx prisma migrate dev --create-only --name add_activity_logs

# Aplicar migração
npx prisma migrate dev

# Gerar cliente
npx prisma generate
```

## 🔧 Implementação dos Controllers

### **1. Auth Controller (auth.controller.js):**
```javascript
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      
      // Buscar usuário na tabela existente
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          password: true,
          role: true,
          email: true
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      // Verificar senha (adaptar conforme seu sistema)
      const isValidPassword = await this.verifyPassword(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Senha inválida' });
      }

      // Gerar JWT
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({ error: 'Erro interno' });
    }
  }

  // Adaptar conforme seu sistema de senhas existente
  static async verifyPassword(plainPassword, hashedPassword) {
    // Se usa bcrypt:
    return await bcrypt.compare(plainPassword, hashedPassword);
    
    // Se usa MD5/SHA (menos seguro):
    // const crypto = require('crypto');
    // const hash = crypto.createHash('md5').update(plainPassword).digest('hex');
    // return hash === hashedPassword;
    
    // Se é plain text (muito inseguro):
    // return plainPassword === hashedPassword;
  }
}

module.exports = AuthController;
```

### **2. Logs Controller (logs.controller.js):**
```javascript
const prisma = require('../lib/prisma');

class LogsController {
  // Criar novo log
  static async createLog(req, res) {
    try {
      const { 
        adminName, 
        action, 
        target, 
        details, 
        justification, 
        amount, 
        period,
        amountType 
      } = req.body;
      
      const userId = req.user.id; // Vem do middleware de auth
      
      const log = await prisma.activityLog.create({
        data: {
          userId,
          adminName,
          action,
          target,
          details,
          justification,
          amount,
          period,
          amountType
        },
        include: {
          user: {
            select: { username: true, role: true }
          }
        }
      });
      
      res.status(201).json(log);
    } catch (error) {
      console.error('Erro ao criar log:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Buscar logs (filtrado por role)
  static async getLogs(req, res) {
    try {
      const { page = 1, limit = 50, period, action } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      let whereClause = {};
      
      // Controle de acesso por role
      if (userRole !== 'admin') {
        whereClause.userId = userId; // Usuário comum vê apenas seus logs
      }
      
      // Filtro por período
      if (period) {
        const now = new Date();
        let startDate;
        
        switch (period) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
        }
        
        if (startDate) {
          whereClause.createdAt = { gte: startDate };
        }
      }

      // Filtro por ação
      if (action) {
        whereClause.action = action;
      }

      const logs = await prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { username: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit)
      });

      const total = await prisma.activityLog.count({ where: whereClause });

      res.json({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Exportar logs (CSV)
  static async exportLogs(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let whereClause = {};
      if (userRole !== 'admin') {
        whereClause.userId = userId;
      }

      const logs = await prisma.activityLog.findMany({
        where: whereClause,
        include: {
          user: { select: { username: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Converter para CSV
      const csvHeader = 'Data,Admin,Ação,Alvo,Detalhes,Justificativa\n';
      const csvData = logs.map(log => 
        `${log.createdAt.toISOString()},${log.adminName},${log.action},${log.target},"${log.details}","${log.justification || ''}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=activity_logs.csv');
      res.send(csvHeader + csvData);
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

module.exports = LogsController;
```

## 🛡️ Middleware de Autenticação

### **auth.middleware.js:**
```javascript
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuário atual no banco existente
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        role: true,
        email: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
```

## 🌐 Server Principal

### **server.js:**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth.routes');
const logsRoutes = require('./routes/logs.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas tentativas, tente novamente em 15 minutos'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check para Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'FCA Manager API'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Porta dinâmica do Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 FCA Manager API running on port ${PORT}`);
});
```

## 📊 Deploy no Render

### **1. Variáveis de Ambiente (.env):**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=sua_chave_super_secreta_aqui
ALLOWED_ORIGINS=tauri://localhost,https://seudominio.com
```

### **2. Configuração no Render:**
1. **New** → **Web Service**
2. **Connect GitHub repository**
3. **Configurações:**
   - **Name**: `fca-manager-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
   - **Plan**: Free (para começar)

### **3. PostgreSQL no Render:**
1. **New** → **PostgreSQL**
2. **Name**: `fca-manager-db`
3. **Plan**: Free (1GB)
4. **Copiar DATABASE_URL** para as env vars do web service

## 🔄 Integração com Frontend

### **1. Service Layer (services/api.service.ts):**
```typescript
import axios from 'axios';

const API_BASE = import.meta.env.PROD 
  ? 'https://fca-manager-api.onrender.com/api'
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para logout automático se token expirar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

class ApiService {
  // Auth
  async login(username: string, password: string) {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  }

  // Logs
  async createActivityLog(logData: any) {
    const response = await api.post('/logs', logData);
    return response.data;
  }

  async getLogs(filters: any = {}) {
    const response = await api.get('/logs', { params: filters });
    return response.data;
  }

  async exportLogs() {
    const response = await api.get('/logs/export', { 
      responseType: 'blob' 
    });
    return response.data;
  }
}

export default new ApiService();
```

### **2. Atualizar Frontend (useActivityLog):**
```typescript
// hooks/useLogs.ts
import { useState, useEffect } from 'react';
import apiService from '../services/api.service';

export const useLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const createLog = async (logData: any) => {
    try {
      const response = await apiService.createActivityLog(logData);
      setLogs(prev => [response, ...prev]);
      return response;
    } catch (error) {
      console.error('Erro ao criar log:', error);
      throw error;
    }
  };

  const fetchLogs = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await apiService.getLogs(filters);
      setLogs(response.logs);
      return response;
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading, createLog, fetchLogs };
};
```

## 📈 Próximos Passos

### **Fase 1 - Setup Básico:**
1. ✅ Criar estrutura do projeto
2. ✅ Configurar Prisma com banco existente
3. ✅ Implementar autenticação JWT
4. ✅ Criar endpoints de logs
5. ✅ Deploy no Render

### **Fase 2 - Integração:**
1. ✅ Conectar frontend com API
2. ✅ Migrar sistema de logs do Context para API
3. ✅ Implementar controle de acesso
4. ✅ Testes e validação

### **Fase 3 - Melhorias:**
1. ✅ Sistema de exportação (CSV/PDF)
2. ✅ Filtros avançados
3. ✅ Logs de auditoria de login
4. ✅ Rate limiting por usuário
5. ✅ Monitoramento e logging

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Prisma
npx prisma studio
npx prisma migrate dev
npx prisma generate

# Deploy
git push origin main  # Auto-deploy no Render
```

## 📝 Notas Importantes

1. **Banco Existente**: Usar `prisma db pull` para não afetar estrutura atual
2. **Senhas**: Adaptar `verifyPassword()` conforme hash usado no sistema atual
3. **Tabela Users**: Mapear para nome correto da tabela existente
4. **JWT Secret**: Gerar chave forte para produção
5. **CORS**: Configurar origins permitidos
6. **Rate Limiting**: Ajustar conforme necessidade

---

**Este documento contém todas as instruções para implementar o backend da aplicação FCA Manager baseado em nossa conversa anterior. Siga os passos sequencialmente para uma implementação bem-sucedida.**