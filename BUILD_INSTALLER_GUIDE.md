# 📦 FCA Manager - Guia de Build e Instalador

## 🎯 Como criar um instalador do seu app Tauri

Este guia mostra como gerar um instalador executável (.exe, .msi) do seu app FCA Manager para distribuição e testes em outros computadores.

## 🚀 Comandos para Build

### **1. Build de Desenvolvimento (rápido para testes):**
```bash
npm run tauri:build
```

### **2. Build de Produção (completo):**
```bash
# Limpar cache primeiro
npm run build
npm run tauri:build
```

### **3. Build apenas para Windows:**
```bash
npx tauri build --target x86_64-pc-windows-msvc
```

## 📁 Onde encontrar os arquivos gerados

Após o build, os instaladores serão criados em:

```
src-tauri/target/release/bundle/
├── msi/              # Instalador .msi (recomendado)
│   └── FCA Manager_0.1.0_x64_en-US.msi
├── nsis/             # Instalador .exe
│   └── FCA Manager_0.1.0_x64_en-US.exe
└── exe/              # Executável portable
    └── FCA Manager.exe
```

## 🛠️ Configurações do Instalador

### **Seu arquivo tauri.conf.json já está configurado corretamente:**

```json
{
  "productName": "FCA Manager",
  "version": "0.1.0",
  "identifier": "com.fcamanager.app",
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Utility",
    "copyright": "Copyright © 2024 FCA Manager",
    "shortDescription": "Combat Arms FCA Management Tool",
    "longDescription": "A comprehensive management tool for Combat Arms FCA operations including user management, clan administration, and game statistics.",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png", 
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

### **Para personalizar ainda mais (opcional):**

```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "",
      "tsp": false,
      "wix": {
        "language": ["en-US", "pt-BR"],
        "template": "templates/main.wxs"
      },
      "nsis": {
        "displayLanguageSelector": true,
        "languages": ["English", "Portuguese"],
        "customLanguageFiles": {
          "Portuguese": "path/to/portuguese.nsh"
        }
      }
    }
  }
}
```

## ⚡ Passo a Passo Rápido

### **1. Preparar para build:**
```bash
# Certificar que todas as dependências estão instaladas
npm install

# Verificar se Rust está atualizado
rustup update
```

### **2. Executar o build:**
```bash
npm run tauri:build
```

### **3. Aguardar o processo:**
- ⏳ **Frontend build**: ~2-5 minutos
- ⏳ **Tauri bundle**: ~5-15 minutos
- 💾 **Arquivos gerados**: Vários instaladores

### **4. Testar em outro computador:**
- 📂 Copie o arquivo `.msi` ou `.exe` da pasta `bundle/`
- 💻 Execute no computador de teste
- ✅ Verifique se instala e executa corretamente

## 📋 Tipos de Instaladores Gerados

### **1. `.msi` (Microsoft Installer) - RECOMENDADO**
- ✅ Instalação padrão do Windows
- ✅ Desinstalação limpa via Painel de Controle
- ✅ Suporte a atualizações
- ✅ Assinatura digital (quando configurada)

### **2. `.exe` (NSIS Installer)**
- ✅ Instalador compacto
- ✅ Customização visual
- ✅ Múltiplos idiomas
- ✅ Instalação silenciosa

### **3. Executável Portable**
- ✅ Sem instalação necessária
- ✅ Ideal para testes rápidos
- ⚠️ Sem integração com sistema
- ⚠️ Sem atualizações automáticas

## 🔧 Troubleshooting

### **Erro: "Rust not found"**
```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs/ | sh
```

### **Erro: "Build failed"**
```bash
# Limpar cache e tentar novamente
npm run build
npx tauri clean
npm run tauri:build
```

### **Erro: "Icon not found"**
```bash
# Gerar ícones automaticamente
npm run icons
```

### **Build muito lento**
```bash
# Build apenas para Windows (mais rápido)
npx tauri build --target x86_64-pc-windows-msvc
```

## 📊 Tamanhos Esperados

- **Instalador .msi**: ~15-25 MB
- **Instalador .exe**: ~10-20 MB  
- **Executável portable**: ~20-30 MB
- **Pasta de build completa**: ~100-200 MB

## 🚀 Distribuição

### **Para testes internos:**
- 📧 Envie apenas o arquivo `.msi`
- 💾 Ou use Google Drive/Dropbox
- 🔗 Ou GitHub Releases (privado)

### **Para produção:**
- 🔐 Assinar digitalmente o instalador
- 🌐 Hospedar em site oficial
- 📱 Criar auto-updater
- 📋 Documentação de instalação

## ⚠️ Importante para Testes

### **No computador de teste:**
1. ✅ **Windows 10/11** (recomendado)
2. ✅ **Antivírus pode bloquear** inicialmente (normal)
3. ✅ **Executar como administrador** se necessário
4. ✅ **Verificar logs** em caso de erro

### **Checklist de teste:**
- [ ] Instalação completa sem erros
- [ ] App abre corretamente
- [ ] Todas as funcionalidades funcionam
- [ ] Logs de atividade funcionam
- [ ] Autenticação funciona
- [ ] Modals e componentes responsivos
- [ ] Desinstalação limpa

## 📝 Logs de Build

Durante o build, observe os logs para:
- ✅ **Frontend compiled successfully**
- ✅ **Tauri bundled successfully**
- ⚠️ **Warnings** (podem ser ignorados)
- ❌ **Errors** (precisam ser corrigidos)

## 🎯 Próximos Passos

1. **✅ Fazer primeiro build de teste**
2. **📱 Testar em outro computador**
3. **🔧 Ajustar configurações se necessário**
4. **🚀 Build final para distribuição**
5. **📋 Documentar processo de instalação**

---

**Execute `npm run tauri:build` e em ~10-15 minutos você terá seus instaladores prontos na pasta `src-tauri/target/release/bundle/`!**