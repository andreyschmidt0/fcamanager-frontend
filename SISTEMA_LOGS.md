# Sistema de Logs de Atividades

Este documento explica como usar o sistema de logs para registrar atividades recentes no FCA Manager.

## Configuração Inicial

### 1. Provider já está configurado
O `ActivityLogProvider` já está configurado no `App.tsx` e envolve toda a aplicação.

### 2. Componente de atividades
O componente `atividadesrecentes.tsx` já está conectado ao sistema e exibe os logs automaticamente.

## Como Usar nos Componentes

### 1. Importar o hook e helpers
```typescript
import { useActivityLog, createSendCashLog, createBanLog, createDeleteLog, createTransferLog, createAlterLog } from '../../contexts/ActivityLogContext';
```

### 2. Usar o hook no componente
```typescript
const { addActivity } = useActivityLog();
```

### 3. Registrar atividades

#### Para Enviar Cash:
```typescript
const handleConfirmAction = () => {
  // Sua lógica de API aqui...
  
  const logData = createSendCashLog(
    'GM-NomeDoAdmin', // Nome do admin logado
    formData.loginAccount, // Target (jogador)
    parseInt(formData.cash), // Quantidade
    formData.justification // Justificativa (opcional)
  );
  addActivity(logData);
};
```

#### Para Banir Jogador:
```typescript
const handleConfirmAction = () => {
  // Sua lógica de API aqui...
  
  const logData = createBanLog(
    'GM-NomeDoAdmin', // Nome do admin logado
    formData.loginAccount, // Target (jogador)
    formData.banDuration, // Período do ban (ex: "7 dias")
    formData.justification // Justificativa (opcional)
  );
  addActivity(logData);
};
```

#### Para Excluir Jogador:
```typescript
const handleConfirmAction = () => {
  // Sua lógica de API aqui...
  
  const logData = createDeleteLog(
    'GM-NomeDoAdmin', // Nome do admin logado
    formData.loginAccount, // Target (jogador)
    formData.justification // Justificativa (opcional)
  );
  addActivity(logData);
};
```

#### Para Transferir:
```typescript
const handleConfirmAction = () => {
  // Sua lógica de API aqui...
  
  const logData = createTransferLog(
    'GM-NomeDoAdmin', // Nome do admin logado
    formData.targetPlayer, // Target
    'para outro servidor', // Detalhes da transferência
    formData.justification // Justificativa (opcional)
  );
  addActivity(logData);
};
```

#### Para Alterar (dados do jogador):
```typescript
const handleConfirmAction = () => {
  // Sua lógica de API aqui...
  
  const logData = createAlterLog(
    'GM-NomeDoAdmin', // Nome do admin logado
    formData.loginAccount, // Target (jogador)
    'nickname para NovoNick', // Detalhes da alteração
    formData.justification // Justificativa (opcional)
  );
  addActivity(logData);
};
```

## Estrutura dos Dados

Cada log possui a seguinte estrutura:
```typescript
interface ActivityLog {
  id: string; // Gerado automaticamente
  timestamp: Date; // Gerado automaticamente
  adminName: string; // Nome do admin que executou a ação
  action: 'Enviar' | 'Banir' | 'Excluir' | 'Transferir' | 'Alterar';
  target: string; // Jogador/entidade alvo
  details: string; // Descrição da ação
  justification?: string; // Justificativa (opcional)
  amount?: number; // Para transferências de cash
  period?: string; // Para banimentos (duração)
}
```

## Componentes que Devem Implementar

Implemente o sistema de logs nos seguintes componentes:

1. **✅ `sendcash.tsx`** - Já implementado como exemplo
2. **`banmodal.tsx`** - Para registrar banimentos
3. **`senditem.tsx`** - Para envio de itens
4. **`changeemail.tsx`** - Para alteração de email
5. **`changenickname.tsx`** - Para alteração de nickname
6. **Qualquer outro modal que execute ações administrativas**

## Filtros por Período

O componente de atividades recentes suporta filtros por período:
- **Hoje**: Mostra atividades do dia atual
- **Esta semana**: Mostra atividades da semana atual (segunda a domingo)
- **Este mês**: Mostra atividades do mês atual
- **Este ano**: Mostra atividades do ano atual

## Exemplo Completo

Veja o arquivo `src/components/modal/sendcash.tsx` para um exemplo completo de implementação.

## Próximos Passos

1. **Implementar nos outros modais**: Use o exemplo do `sendcash.tsx` como base
2. **Integrar com sistema de autenticação**: Substitua 'GM-Admin' pelo nome real do admin logado
3. **Persistência**: Opcionalmente, salve os logs em localStorage ou banco de dados
4. **Exportação**: Adicione funcionalidade para exportar logs para CSV/PDF

## Notas Importantes

- Sempre registre o log APÓS o sucesso da operação da API
- Use justificativas claras e descritivas
- O sistema é local (não persiste entre sessões). Para persistir, implemente localStorage ou API
- Os timestamps são automáticos e locais