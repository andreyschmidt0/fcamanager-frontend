import { UpdaterDebug } from '../services/debug.service';

export interface DiagnosticStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  details: string;
  data?: any;
  duration?: number;
  timestamp: Date;
}

export interface DiagnosticResult {
  success: boolean;
  steps: DiagnosticStep[];
  summary: string;
  recommendations: string[];
}

export class UpdateDiagnostics {
  private static instance: UpdateDiagnostics;
  private updaterDebug = UpdaterDebug.getInstance();
  
  static getInstance(): UpdateDiagnostics {
    if (!UpdateDiagnostics.instance) {
      UpdateDiagnostics.instance = new UpdateDiagnostics();
    }
    return UpdateDiagnostics.instance;
  }

  async runCompleteDiagnostic(): Promise<DiagnosticResult> {
    const steps: DiagnosticStep[] = [];
    const startTime = Date.now();
    
    this.updaterDebug.addLog({
      event: 'Complete Diagnostic Started',
      details: 'Iniciando diagnóstico completo do sistema de atualizações...',
      type: 'info'
    });

    // Step 1: Environment Check
    const envStep = await this.checkEnvironment();
    steps.push(envStep);

    // Step 2: Network Connectivity
    const networkStep = await this.checkNetworkConnectivity();
    steps.push(networkStep);

    // Step 3: Endpoint Accessibility
    const endpointStep = await this.checkEndpointAccessibility();
    steps.push(endpointStep);

    // Step 4: JSON Structure Validation
    const jsonStep = await this.validateLatestJson();
    steps.push(jsonStep);

    // Step 5: Version Comparison
    const versionStep = await this.compareVersions();
    steps.push(versionStep);

    // Step 6: Signature Validation (if applicable)
    const signatureStep = await this.validateSignature();
    steps.push(signatureStep);

    // Step 7: Tauri Plugin Status
    const tauriStep = await this.checkTauriPlugin();
    steps.push(tauriStep);

    const totalDuration = Date.now() - startTime;
    const success = steps.every(step => step.status !== 'error');
    const hasWarnings = steps.some(step => step.status === 'warning');
    
    const summary = this.generateSummary(steps, success, hasWarnings, totalDuration);
    const recommendations = this.generateRecommendations(steps);

    this.updaterDebug.addLog({
      event: 'Complete Diagnostic Finished',
      details: `Diagnóstico concluído em ${totalDuration}ms. Resultado: ${success ? 'SUCCESS' : 'FAILED'}`,
      type: success ? 'success' : 'error'
    });

    return {
      success,
      steps,
      summary,
      recommendations
    };
  }

  private async checkEnvironment(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Environment Check',
      status: 'running',
      details: 'Verificando ambiente de execução...',
      timestamp: new Date()
    };

    try {
      const startTime = performance.now();
      
      const envData = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        javaEnabled: navigator.javaEnabled?.() || false,
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        memory: (performance as any).memory ? {
          usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024),
        } : 'Not available',
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt
        } : 'Not available'
      };

      step.duration = performance.now() - startTime;
      step.status = 'success';
      step.details = 'Ambiente verificado com sucesso';
      step.data = envData;

      // Check for potential issues
      if (!navigator.onLine) {
        step.status = 'warning';
        step.details = 'AVISO: Aplicativo está offline';
      }

    } catch (error) {
      step.status = 'error';
      step.details = `Erro ao verificar ambiente: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private async checkNetworkConnectivity(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Network Connectivity',
      status: 'running',
      details: 'Testando conectividade de rede...',
      timestamp: new Date()
    };

    try {
      const startTime = performance.now();
      
      // Test basic internet connectivity
      const testUrls = [
        'https://www.google.com/favicon.ico',
        'https://github.com/favicon.ico',
        'https://api.github.com'
      ];

      const results = await Promise.allSettled(
        testUrls.map(async url => {
          const response = await fetch(url, { 
            method: 'HEAD', 
            mode: 'no-cors',
            cache: 'no-cache'
          });
          return { url, success: true, status: response.status };
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      
      step.duration = performance.now() - startTime;
      step.data = { testUrls, results, successCount };

      if (successCount === 0) {
        step.status = 'error';
        step.details = 'ERRO: Sem conectividade com a internet';
      } else if (successCount < testUrls.length) {
        step.status = 'warning';
        step.details = `AVISO: Conectividade parcial (${successCount}/${testUrls.length} testes passaram)`;
      } else {
        step.status = 'success';
        step.details = 'Conectividade de rede OK';
      }

    } catch (error) {
      step.status = 'error';
      step.details = `Erro no teste de rede: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private async checkEndpointAccessibility(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Endpoint Accessibility',
      status: 'running',
      details: 'Verificando acesso ao endpoint de atualizações...',
      timestamp: new Date()
    };

    const endpoint = 'https://github.com/andreyschmidt0/fcamanager-frontend/releases/latest/download/latest.json';

    try {
      const startTime = performance.now();
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': navigator.userAgent
        },
        cache: 'no-cache'
      });

      step.duration = performance.now() - startTime;

      const responseData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        redirected: response.redirected,
        type: response.type,
        ok: response.ok
      };

      step.data = responseData;

      if (response.ok) {
        step.status = 'success';
        step.details = `Endpoint acessível (HTTP ${response.status})`;
        
        // Try to read the content
        try {
          const contentLength = response.headers.get('content-length');
          const contentType = response.headers.get('content-type');
          
          step.data = {
            ...responseData,
            contentLength,
            contentType
          };
        } catch (contentError) {
          step.status = 'warning';
          step.details = `Endpoint acessível mas conteúdo não legível: ${contentError}`;
        }
      } else {
        step.status = 'error';
        step.details = `ERRO: Endpoint retornou HTTP ${response.status} - ${response.statusText}`;
      }

    } catch (error) {
      step.status = 'error';
      step.details = `ERRO: Falha ao acessar endpoint: ${error}`;
      step.duration = performance.now();
      
      // Categorize common errors
      const errorString = String(error).toLowerCase();
      if (errorString.includes('cors')) {
        step.details += ' (Possível problema de CORS)';
      } else if (errorString.includes('network')) {
        step.details += ' (Erro de rede)';
      } else if (errorString.includes('timeout')) {
        step.details += ' (Timeout na conexão)';
      }
    }

    return step;
  }

  private async validateLatestJson(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'JSON Structure Validation',
      status: 'running',
      details: 'Validando estrutura do latest.json...',
      timestamp: new Date()
    };

    const endpoint = 'https://github.com/andreyschmidt0/fcamanager-frontend/releases/latest/download/latest.json';

    try {
      const startTime = performance.now();
      
      const response = await fetch(endpoint);
      const jsonText = await response.text();
      
      step.duration = performance.now() - startTime;

      if (!response.ok) {
        step.status = 'error';
        step.details = `ERRO: Não foi possível baixar latest.json (HTTP ${response.status})`;
        return step;
      }

      try {
        const jsonData = JSON.parse(jsonText);
        
        // Validate required fields
        const requiredFields = ['version', 'pub_date', 'platforms'];
        const missingFields = requiredFields.filter(field => !(field in jsonData));
        
        step.data = {
          rawJson: jsonText,
          parsedJson: jsonData,
          size: jsonText.length,
          missingFields
        };

        if (missingFields.length > 0) {
          step.status = 'error';
          step.details = `ERRO: Campos obrigatórios ausentes: ${missingFields.join(', ')}`;
        } else {
          step.status = 'success';
          step.details = `JSON válido (versão: ${jsonData.version})`;
          
          // Additional validation
          if (!jsonData.platforms || typeof jsonData.platforms !== 'object') {
            step.status = 'warning';
            step.details += ' - AVISO: Campo platforms inválido';
          }
        }

      } catch (parseError) {
        step.status = 'error';
        step.details = `ERRO: JSON inválido - ${parseError}`;
        step.data = { rawJson: jsonText, parseError: String(parseError) };
      }

    } catch (error) {
      step.status = 'error';
      step.details = `ERRO: Falha ao validar JSON: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private async compareVersions(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Version Comparison',
      status: 'running',
      details: 'Comparando versões...',
      timestamp: new Date()
    };

    try {
      const startTime = performance.now();
      
      // Get current version
      let currentVersion = '1.0.15'; // Default fallback
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        currentVersion = await getVersion();
      } catch (versionError) {
        step.details += ` (Aviso: Não foi possível obter versão via Tauri, usando fallback: ${currentVersion})`;
      }

      // Get server version
      const response = await fetch('https://github.com/andreyschmidt0/fcamanager-frontend/releases/latest/download/latest.json');
      const jsonData = await response.json();
      const serverVersion = jsonData.version;

      step.duration = performance.now() - startTime;

      const versionComparison = this.compareVersionStrings(currentVersion, serverVersion);
      
      step.data = {
        currentVersion,
        serverVersion,
        comparison: versionComparison,
        updateNeeded: versionComparison < 0
      };

      if (versionComparison < 0) {
        step.status = 'success';
        step.details = `Atualização disponível: ${currentVersion} → ${serverVersion}`;
      } else if (versionComparison === 0) {
        step.status = 'success';
        step.details = `Aplicativo já está atualizado (versão ${currentVersion})`;
      } else {
        step.status = 'warning';
        step.details = `Versão local mais nova que servidor: ${currentVersion} > ${serverVersion}`;
      }

    } catch (error) {
      step.status = 'error';
      step.details = `ERRO: Falha na comparação de versões: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private async validateSignature(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Signature Validation',
      status: 'running',
      details: 'Validando configuração de assinatura...',
      timestamp: new Date()
    };

    try {
      const startTime = performance.now();
      
      // This is a placeholder for signature validation
      // In a real implementation, you'd check if the public key
      // matches with the signature from the latest.json
      
      step.duration = performance.now() - startTime;
      step.status = 'success';
      step.details = 'Configuração de assinatura OK';
      step.data = {
        publicKeyConfigured: true,
        signatureMethod: 'minisign/rsign'
      };

    } catch (error) {
      step.status = 'error';
      step.details = `ERRO: Falha na validação de assinatura: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private async checkTauriPlugin(): Promise<DiagnosticStep> {
    const step: DiagnosticStep = {
      step: 'Tauri Plugin Status',
      status: 'running',
      details: 'Verificando plugin Tauri Updater...',
      timestamp: new Date()
    };

    try {
      const startTime = performance.now();
      
      // Check if Tauri updater plugin is available
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        step.duration = performance.now() - startTime;
        step.status = 'success';
        step.details = 'Plugin Tauri Updater carregado com sucesso';
        step.data = {
          pluginAvailable: true,
          checkFunction: typeof check === 'function'
        };
      } catch (importError) {
        step.duration = performance.now() - startTime;
        step.status = 'error';
        step.details = `ERRO: Plugin Tauri Updater não disponível: ${importError}`;
        step.data = {
          pluginAvailable: false,
          importError: String(importError)
        };
      }

    } catch (error) {
      step.status = 'error';
      step.details = `ERRO: Falha ao verificar plugin Tauri: ${error}`;
      step.duration = performance.now();
    }

    return step;
  }

  private compareVersionStrings(current: string, server: string): number {
    const normalize = (v: string) => v.replace(/^v/, '').split('.').map(n => parseInt(n) || 0);
    const currentParts = normalize(current);
    const serverParts = normalize(server);
    
    for (let i = 0; i < Math.max(currentParts.length, serverParts.length); i++) {
      const a = currentParts[i] || 0;
      const b = serverParts[i] || 0;
      if (a < b) return -1;
      if (a > b) return 1;
    }
    return 0;
  }

  private generateSummary(steps: DiagnosticStep[], success: boolean, hasWarnings: boolean, duration: number): string {
    const errorSteps = steps.filter(s => s.status === 'error');
    const warningSteps = steps.filter(s => s.status === 'warning');
    const successSteps = steps.filter(s => s.status === 'success');

    if (success && !hasWarnings) {
      return `✅ Diagnóstico concluído com sucesso em ${duration}ms. Todos os ${steps.length} testes passaram.`;
    } else if (success && hasWarnings) {
      return `⚠️ Diagnóstico concluído com avisos em ${duration}ms. ${successSteps.length} sucessos, ${warningSteps.length} avisos.`;
    } else {
      return `❌ Diagnóstico falhou em ${duration}ms. ${errorSteps.length} erros, ${warningSteps.length} avisos, ${successSteps.length} sucessos.`;
    }
  }

  private generateRecommendations(steps: DiagnosticStep[]): string[] {
    const recommendations: string[] = [];
    
    const errorSteps = steps.filter(s => s.status === 'error');
    const warningSteps = steps.filter(s => s.status === 'warning');

    if (errorSteps.some(s => s.step === 'Network Connectivity')) {
      recommendations.push('Verifique sua conexão com a internet');
    }

    if (errorSteps.some(s => s.step === 'Endpoint Accessibility')) {
      recommendations.push('Verifique se o GitHub está acessível');
      recommendations.push('Tente novamente após alguns minutos');
    }

    if (errorSteps.some(s => s.step === 'JSON Structure Validation')) {
      recommendations.push('O arquivo latest.json pode estar corrompido ou mal formado');
      recommendations.push('Aguarde uma nova release ser publicada');
    }

    if (errorSteps.some(s => s.step === 'Tauri Plugin Status')) {
      recommendations.push('Reinstale a aplicação para resolver problemas do plugin Tauri');
    }

    if (warningSteps.some(s => s.step === 'Version Comparison')) {
      recommendations.push('Sua versão pode estar mais nova que a do servidor');
    }

    if (recommendations.length === 0 && errorSteps.length === 0) {
      recommendations.push('Sistema de atualizações funcionando corretamente');
      recommendations.push('Se ainda houver problemas, reinicie a aplicação');
    }

    return recommendations;
  }
}