# 🚀 FCA Manager Auto-Updater Setup

## 📋 Passos para Configurar Auto-Update

### 1. Gerar Chaves de Assinatura

Execute o comando para gerar as chaves de assinatura:

```bash
npm run generate-keys
```

Este comando irá:
- Criar a pasta `/keys/` (se não existir)
- Gerar `fca-manager.key` (chave privada)
- Gerar `fca-manager.pub` (chave pública)
- Solicitar uma senha para proteger a chave privada

**⚠️ IMPORTANTE:**
- A chave privada (`fca-manager.key`) **NUNCA** deve ser commitada no git
- Guarde a senha em local seguro - sem ela não conseguirá assinar updates
- A chave pública será colocada no `tauri.conf.json`

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com:

```bash
TAURI_SIGNING_PRIVATE_KEY_PATH=./keys/fca-manager.key
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=sua_senha_aqui
```

### 3. Configurar GitHub Secrets

No repositório GitHub, adicione os seguintes secrets:

- `TAURI_SIGNING_PRIVATE_KEY`: Conteúdo completo do arquivo `fca-manager.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Senha da chave privada

### 4. Testar Geração de Build

Depois de configurar, teste:

```bash
npm run tauri:build
```

### 5. Configurar GitHub Repository

Atualize o `tauri.conf.json` com o URL correto do seu repositório:

```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/andreyschmidt0/fcamanager-frontend.git/releases/latest/download/latest.json"
      ]
    }
  }
}
```

### 6. Deploy Automático

Após fazer push de uma tag (ex: `git tag v1.0.0 && git push origin v1.0.0`), o GitHub Actions irá:
1. Compilar a aplicação para Windows, Linux e macOS
2. Criar um release automático
3. Gerar o arquivo `latest.json` para updates
4. Os usuários receberão automaticamente a notificação de update

## 🔐 Segurança

- ✅ Chaves protegidas por senha
- ✅ Chave privada nunca no repositório
- ✅ Assinatura digital obrigatória
- ✅ Verificação de integridade automática

## 📞 Troubleshooting

Se encontrar problemas:
1. Verifique se as chaves foram geradas corretamente
2. Confirme que a senha está correta
3. Teste o build localmente antes do deploy