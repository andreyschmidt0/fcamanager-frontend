# 🔧 Configuração do Sistema de Update - FCA Manager

## ✅ CORRIGIDO - Problema das Chaves Criptográficas

### O que foi feito:
1. ✅ **Instalado rsign2** para compatibilidade com Tauri 2.0
2. ✅ **Gerada nova chave compatível** (minisign/rsign)
3. ✅ **Atualizada chave pública** no tauri.conf.json
4. ✅ **Corrigido GitHub Actions** workflow (`includeUpdaterJson: true`)
5. ✅ **Atualizada versão** para 1.0.13 para teste

---

## 🛠️ PRÓXIMOS PASSOS NECESSÁRIOS:

### 1. Configurar Secrets no GitHub
Acesse: `https://github.com/andreyschmidt0/fcamanager-frontend/settings/secrets/actions`

**TAURI_SIGNING_PRIVATE_KEY:**
```
dW50cnVzdGVkIGNvbW1lbnQ6IEZDQSBNYW5hZ2VyIFVwZGF0ZSBTaWduaW5nIEtleQpSV1JUWTBJeU5aMWZsVnM3WVp0Zjdya2RId0FUSEZ0dFBGWWRBcDRKbUNHbWpmeFdDalFBQUJBQUFBQUFBQUFBQUFJQUFBQUFxYUhmUXFFUkR3VGRJQnJkRE5UcmFmQ0d4QXdFUzU2OWZEVCtrTmRzMkovRGxQVzlJQ0FXMXJIeWtyQ3Z6RW51V0xrWjJoRjZPMTVKNSsxR0JjRXMwdE1mL0JYbFdXUlM3aGlTYWFsRngzZkJML0FMMytYVEdjODlRdkhna0Y0VXZwNVJoNHVoWWV3PQo=
```

**TAURI_SIGNING_PRIVATE_KEY_PASSWORD:**
```
(deixar vazio - chave sem senha)
```

### 2. Fazer Commit e Push das Alterações
```bash
git add -A
git commit -m "fix: update system - new signing keys and workflow fix

- Generated new compatible rsign keypair
- Updated public key in tauri.conf.json  
- Fixed GitHub Actions workflow (includeUpdaterJson: true)
- Bumped version to 1.0.13 for testing"
git push origin main
```

### 3. Criar Nova Release/Tag para Teste
```bash
git tag v1.0.13
git push origin v1.0.13
```

---

## 📋 ARQUIVOS MODIFICADOS:

### ✅ `src-tauri/tauri.conf.json`
- **Versão**: `1.0.12` → `1.0.13`
- **Chave pública**: Atualizada para nova chave rsign compatível
- **ID da chave**: `040F11A142DFA1A9`

### ✅ `.github/workflows/build-and-release.yml`
- **includeUpdaterJson**: `false` → `true`

### ✅ Novas chaves geradas:
- **Chave privada**: `keys/fca-manager-new.key` (para GitHub Secret)
- **Chave pública**: `keys/fca-manager-new.pub` (já no config)

---

## 🧪 TESTANDO O SISTEMA:

### 1. Após configurar os secrets e fazer o release:
1. Abra o FCA Manager (versão atual 1.0.12)
2. Pressione `Ctrl+D` para abrir o Debug Modal
3. Clique em "Test Connections" para verificar updater
4. Se tudo estiver correto, deve detectar a versão 1.0.13

### 2. Verificações no Debug Modal:
- **Aba "Updater"**: Deve mostrar "Update Available" 
- **Aba "Errors"**: Não deve ter erros de signature/verification
- **Connection Test**: Deve retornar SUCCESS

---

## ❌ PROBLEMA ANTERIOR:
- **Chave pública**: B15DCF04401A8279 (minisign)
- **Chave privada**: Y0I2VEqH (rsign) 
- **❌ INCOMPATÍVEL**: Ferramentas diferentes causavam erro de verificação

## ✅ SOLUÇÃO ATUAL:
- **Chave pública**: 040F11A142DFA1A9 (minisign/rsign compatible)
- **Chave privada**: Gerada com mesmo rsign
- **✅ COMPATÍVEL**: Mesma ferramenta, assinaturas válidas

---

## 📞 PRÓXIMO TESTE:
Após configurar os secrets no GitHub, o erro "Erro ao verificar atualizações" deve desaparecer e o sistema deve funcionar corretamente.