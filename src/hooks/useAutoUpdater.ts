import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';
import { UpdaterDebug } from '../components/debug/DebugModal';
import { UpdateDiagnostics, DiagnosticResult } from '../utils/update-diagnostics';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export interface UseAutoUpdaterReturn {
  updateStatus: UpdateStatus;
  updateAvailable: Update | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string;
  diagnosticResult: DiagnosticResult | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: (update?: Update) => Promise<void>;
  restartApp: () => Promise<void>;
  runDiagnostics: () => Promise<void>;
}

export const useAutoUpdater = (): UseAutoUpdaterReturn => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  
  // Instâncias dos sistemas de debug e diagnóstico
  const updaterDebug = UpdaterDebug.getInstance();
  const updateDiagnostics = UpdateDiagnostics.getInstance();

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;

    const checkStartTime = Date.now();
    setIsChecking(true);
    setUpdateStatus('checking');
    setError('');
    setDiagnosticResult(null);

    // Log início da verificação com timestamp preciso
    updaterDebug.addLog({
      event: 'Update Check Started',
      details: `Iniciando verificação de atualizações... (${new Date().toISOString()})`,
      type: 'info'
    });

    try {
      console.log('[AutoUpdater] === UPDATE CHECK STARTED ===');
      console.log('[AutoUpdater] Timestamp:', new Date().toISOString());
      console.log('[AutoUpdater] Updater endpoint:', 'https://github.com/andreyschmidt0/fcamanager-frontend/releases/latest/download/latest.json');
      
      // Obter versão atual de forma mais robusta
      let currentVersion = '1.0.15'; // Fallback
      try {
        const { getVersion } = await import('@tauri-apps/api/app');
        currentVersion = await getVersion();
        console.log('[AutoUpdater] Current app version from Tauri:', currentVersion);
      } catch (versionError) {
        console.warn('[AutoUpdater] Could not get version from Tauri, using fallback:', currentVersion);
        updaterDebug.addLog({
          event: 'Version Detection Warning',
          details: `Não foi possível obter versão via Tauri API: ${versionError}. Usando fallback: ${currentVersion}`,
          type: 'warning'
        });
      }

      // Log informações detalhadas do ambiente
      const environmentInfo = {
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        language: navigator.language,
        currentVersion,
        endpoint: 'https://github.com/andreyschmidt0/fcamanager-frontend/releases/latest/download/latest.json',
        timestamp: new Date().toISOString(),
        memory: (performance as any).memory ? {
          used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024) + 'MB'
        } : 'N/A'
      };

      console.log('[AutoUpdater] Environment details:', environmentInfo);
      
      updaterDebug.addLog({
        event: 'Environment Check',
        details: `Plataforma: ${environmentInfo.platform}
Versão Atual: ${environmentInfo.currentVersion}
Online: ${environmentInfo.online}
Idioma: ${environmentInfo.language}
Memória: ${typeof environmentInfo.memory === 'object' ? environmentInfo.memory.used : environmentInfo.memory}
Endpoint: ${environmentInfo.endpoint}
Timestamp: ${environmentInfo.timestamp}`,
        type: 'info'
      });

      // Pré-validação: verificar se estamos online
      if (!navigator.onLine) {
        throw new Error('OFFLINE_MODE: Aplicativo está em modo offline. Conecte-se à internet para verificar atualizações.');
      }

      // Fazer uma verificação manual do endpoint antes do Tauri check
      updaterDebug.addLog({
        event: 'Pre-check: Testing Endpoint',
        details: 'Testando acessibilidade do endpoint antes da verificação Tauri...',
        type: 'info'
      });

      console.log('[AutoUpdater] Pre-checking endpoint accessibility...');
      const preCheckStartTime = Date.now();
      
      try {
        const preCheckResponse = await fetch(environmentInfo.endpoint, { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        const preCheckDuration = Date.now() - preCheckStartTime;
        console.log('[AutoUpdater] Pre-check response:', {
          status: preCheckResponse.status,
          ok: preCheckResponse.ok,
          url: preCheckResponse.url,
          duration: preCheckDuration + 'ms'
        });

        if (!preCheckResponse.ok) {
          throw new Error(`PRE_CHECK_FAILED: Endpoint inacessível (HTTP ${preCheckResponse.status}). Servidor pode estar indisponível.`);
        }

        updaterDebug.addLog({
          event: 'Pre-check: Endpoint OK',
          details: `Endpoint acessível (HTTP ${preCheckResponse.status}) em ${preCheckDuration}ms`,
          type: 'success'
        });

      } catch (preCheckError) {
        console.error('[AutoUpdater] Pre-check failed:', preCheckError);
        updaterDebug.addLog({
          event: 'Pre-check: Failed',
          details: `Falha no pré-teste do endpoint: ${preCheckError}`,
          type: 'error'
        });
        // Continue anyway, let Tauri try
      }

      // Agora fazer a verificação Tauri com timeout
      console.log('[AutoUpdater] Starting Tauri update check...');
      updaterDebug.addLog({
        event: 'Tauri Check Starting',
        details: 'Iniciando verificação via Tauri plugin...',
        type: 'info'
      });

      const tauriCheckStartTime = Date.now();
      
      // Implementar timeout manual para o check do Tauri
      const checkPromise = check();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TAURI_TIMEOUT: Verificação Tauri excedeu 30 segundos')), 30000);
      });

      const update = await Promise.race([checkPromise, timeoutPromise]) as Update;
      const tauriCheckDuration = Date.now() - tauriCheckStartTime;
      
      console.log('[AutoUpdater] Tauri check completed in:', tauriCheckDuration + 'ms');
      console.log('[AutoUpdater] Tauri check result:', update);

      updaterDebug.addLog({
        event: 'Tauri Check Completed',
        details: `Verificação Tauri concluída em ${tauriCheckDuration}ms`,
        type: 'info'
      });
      
      // Analisar resultado detalhadamente
      if (update?.available) {
        console.log('[AutoUpdater] ✅ UPDATE AVAILABLE!');
        console.log('[AutoUpdater] Current version:', currentVersion);
        console.log('[AutoUpdater] Available version:', update.version);
        console.log('[AutoUpdater] Update details:', update);

        const totalCheckDuration = Date.now() - checkStartTime;

        updaterDebug.addLog({
          event: 'Update Available',
          details: `🎉 ATUALIZAÇÃO DISPONÍVEL!

Versão Atual: ${currentVersion}
Nova Versão: ${update.version}
Tempo Total de Verificação: ${totalCheckDuration}ms
Data da Release: ${update.date || 'N/A'}

A nova versão está pronta para download!`,
          type: 'success',
          version: update.version
        });

        setUpdateAvailable(update);
        setUpdateStatus('available');
        return;
        
      } else {
        console.log('[AutoUpdater] ℹ️  NO UPDATES AVAILABLE');
        console.log('[AutoUpdater] Current version is up to date:', currentVersion);
        
        const totalCheckDuration = Date.now() - checkStartTime;

        // Esta é a parte crucial - diferenciar entre "sem updates" e "erro"
        updaterDebug.addLog({
          event: 'No Updates Available',
          details: `✅ APLICATIVO JÁ ESTÁ ATUALIZADO

Versão Atual: ${currentVersion}
Status: Nenhuma atualização necessária
Tempo de Verificação: ${totalCheckDuration}ms
Última Verificação: ${new Date().toLocaleString()}

Seu aplicativo está na versão mais recente disponível.`,
          type: 'success'
        });

        setUpdateStatus('idle');
        setError(''); // Limpar qualquer erro anterior
      }
    } catch (err) {
      const totalCheckDuration = Date.now() - checkStartTime;
      
      console.error('[AutoUpdater] === ERROR IN UPDATE CHECK ===');
      console.error('[AutoUpdater] Check duration before error:', totalCheckDuration + 'ms');
      console.error('[AutoUpdater] Error object:', err);
      console.error('[AutoUpdater] Error type:', typeof err);
      console.error('[AutoUpdater] Error string:', String(err));
      console.error('[AutoUpdater] Error stack:', err instanceof Error ? err.stack : 'No stack');

      // Capturar TODOS os detalhes possíveis do erro
      let specificError = 'Erro desconhecido na verificação de atualizações';
      let errorCategory = 'UNKNOWN';
      let errorMessage = 'N/A';
      let errorName = 'N/A';
      let errorStack = 'N/A';
      let errorString = String(err);
      let troubleshootingSteps: string[] = [];
      let errorSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

      if (err instanceof Error) {
        errorMessage = err.message;
        errorName = err.name;
        errorStack = err.stack || 'N/A';
        
        const msg = errorMessage.toLowerCase();
        
        // Categorizar tipos de erro com base na mensagem
        if (msg.includes('offline_mode') || msg.includes('network') || msg.includes('connection')) {
          errorCategory = 'NETWORK';
          specificError = 'Problema de conectividade de rede';
          troubleshootingSteps = [
            'Verifique sua conexão com a internet',
            'Tente conectar-se a uma rede diferente',
            'Desative temporariamente firewall/antivírus'
          ];
          errorSeverity = 'medium';
          
        } else if (msg.includes('pre_check_failed') || msg.includes('endpoint')) {
          errorCategory = 'ENDPOINT';
          specificError = 'Servidor de atualizações inacessível';
          troubleshootingSteps = [
            'Aguarde alguns minutos e tente novamente',
            'Verifique se github.com está acessível',
            'Tente reiniciar a aplicação'
          ];
          errorSeverity = 'high';
          
        } else if (msg.includes('tauri_timeout') || msg.includes('timeout')) {
          errorCategory = 'TIMEOUT';
          specificError = 'Tempo limite excedido na verificação';
          troubleshootingSteps = [
            'Conexão lenta detectada - aguarde e tente novamente',
            'Verifique a qualidade da sua conexão',
            'Reinicie a aplicação se o problema persistir'
          ];
          errorSeverity = 'medium';
          
        } else if (msg.includes('signature') || msg.includes('verification') || msg.includes('invalid')) {
          errorCategory = 'SIGNATURE';
          specificError = 'Erro de verificação de segurança';
          troubleshootingSteps = [
            'Este erro pode indicar arquivo corrompido no servidor',
            'Aguarde uma nova versão ser publicada',
            'Execute diagnóstico completo para mais detalhes'
          ];
          errorSeverity = 'critical';
          
        } else if (msg.includes('permission') || msg.includes('access denied')) {
          errorCategory = 'PERMISSION';
          specificError = 'Erro de permissão do sistema';
          troubleshootingSteps = [
            'Execute a aplicação como administrador',
            'Verifique permissões de acesso à internet',
            'Temporariamente desative o antivírus'
          ];
          errorSeverity = 'high';
          
        } else if (msg.includes('json') || msg.includes('parse') || msg.includes('malformed')) {
          errorCategory = 'DATA_FORMAT';
          specificError = 'Arquivo de configuração de update corrompido';
          troubleshootingSteps = [
            'Arquivo latest.json pode estar corrompido no servidor',
            'Aguarde alguns minutos para correção automática',
            'Entre em contato com suporte se persistir'
          ];
          errorSeverity = 'medium';
          
        } else if (msg.includes('plugin') || msg.includes('tauri')) {
          errorCategory = 'PLUGIN';
          specificError = 'Problema com plugin Tauri Updater';
          troubleshootingSteps = [
            'Reinstale a aplicação',
            'Verifique se você tem a versão mais recente',
            'Execute diagnóstico completo'
          ];
          errorSeverity = 'critical';
          
        } else {
          // Erro genérico mas com mensagem disponível
          errorCategory = 'GENERIC';
          specificError = `Erro na verificação: ${errorMessage}`;
          troubleshootingSteps = [
            'Tente novamente em alguns minutos',
            'Reinicie a aplicação',
            'Execute diagnóstico completo para mais detalhes'
          ];
        }
      } else {
        // Não é uma Error instance
        errorMessage = errorString;
        specificError = `Erro não identificado: ${errorString}`;
        errorCategory = 'UNKNOWN';
        troubleshootingSteps = [
          'Erro de tipo desconhecido detectado',
          'Reinicie a aplicação',
          'Entre em contato com suporte técnico'
        ];
        errorSeverity = 'critical';
      }
      
      console.error('[AutoUpdater] Categorized error:', {
        category: errorCategory,
        severity: errorSeverity,
        specificError,
        troubleshootingSteps
      });

      // Registrar erro detalhado no debug
      updaterDebug.addLog({
        event: 'Update Check Failed',
        details: `❌ FALHA NA VERIFICAÇÃO DE ATUALIZAÇÕES

CATEGORIA: ${errorCategory}
SEVERIDADE: ${errorSeverity.toUpperCase()}
ERRO: ${specificError}

DETALHES TÉCNICOS:
- Nome: ${errorName}
- Mensagem: ${errorMessage}
- Duração antes do erro: ${totalCheckDuration}ms
- Timestamp: ${new Date().toISOString()}

PASSOS PARA RESOLVER:
${troubleshootingSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}

INFORMAÇÕES PARA SUPORTE:
- Stack Trace: ${errorStack}
- Error String: ${errorString}
- Error Object: ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}`,
        type: 'error'
      });
      
      // Executar diagnóstico automático em caso de erro
      try {
        console.log('[AutoUpdater] Running automatic diagnostics due to error...');
        const diagnosticResult = await updateDiagnostics.runCompleteDiagnostic();
        setDiagnosticResult(diagnosticResult);
        
        updaterDebug.addLog({
          event: 'Auto Diagnostics Completed',
          details: `Diagnóstico automático executado: ${diagnosticResult.success ? 'SUCESSO' : 'FALHOU'}
          
Resumo: ${diagnosticResult.summary}
Recomendações: ${diagnosticResult.recommendations.join(', ')}`,
          type: diagnosticResult.success ? 'info' : 'warning'
        });
        
      } catch (diagnosticError) {
        console.error('[AutoUpdater] Failed to run auto diagnostics:', diagnosticError);
        updaterDebug.addLog({
          event: 'Auto Diagnostics Failed',
          details: `Falha ao executar diagnóstico automático: ${diagnosticError}`,
          type: 'error'
        });
      }
      
      // Definir erro final para o usuário (mais amigável)
      const userFriendlyError = `${specificError}\n\n💡 Dica: Use Ctrl+D → Aba 'Updater' para ver detalhes completos`;
      setError(userFriendlyError);
      setUpdateStatus('error');
    } finally {
      setIsChecking(false);
      console.log('[AutoUpdater] === UPDATE CHECK FINISHED ===');
      console.log('[AutoUpdater] Total duration:', Date.now() - checkStartTime + 'ms');
    }
  }, [isChecking, updaterDebug, updateDiagnostics]);

  // Nova função para executar diagnóstico manual
  const runDiagnostics = useCallback(async () => {
    try {
      console.log('[AutoUpdater] Running manual diagnostics...');
      
      updaterDebug.addLog({
        event: 'Manual Diagnostics Started',
        details: 'Iniciando diagnóstico manual do sistema de atualizações...',
        type: 'info'
      });

      const result = await updateDiagnostics.runCompleteDiagnostic();
      setDiagnosticResult(result);

      updaterDebug.addLog({
        event: 'Manual Diagnostics Completed',
        details: `Diagnóstico manual concluído: ${result.success ? 'SUCESSO' : 'FALHOU'}
        
${result.summary}

Recomendações principais:
${result.recommendations.slice(0, 3).join('\n')}`,
        type: result.success ? 'success' : 'warning'
      });

    } catch (error) {
      console.error('[AutoUpdater] Manual diagnostics failed:', error);
      
      updaterDebug.addLog({
        event: 'Manual Diagnostics Failed',
        details: `Falha no diagnóstico manual: ${error}`,
        type: 'error'
      });
    }
  }, [updateDiagnostics, updaterDebug]);

  const downloadAndInstall = useCallback(async (update?: Update) => {
    const targetUpdate = update || updateAvailable;
    if (!targetUpdate) {
      const errorMsg = 'Nenhuma atualização disponível';
      setError(errorMsg);
      updaterDebug.addLog({
        event: 'Download Failed',
        details: errorMsg,
        type: 'error'
      });
      return;
    }

    setIsDownloading(true);
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setError('');

    // Log início do download
    updaterDebug.addLog({
      event: 'Download Started',
      details: `Iniciando download da versão ${targetUpdate.version}...`,
      type: 'info',
      version: targetUpdate.version,
      progress: 0
    });

    try {
      console.log('[AutoUpdater] Starting download and install...');
      
      await targetUpdate.downloadAndInstall((event) => {
        console.log('[AutoUpdater] Download event:', event.event);
        
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            updaterDebug.addLog({
              event: 'Download Progress',
              details: 'Download iniciado',
              type: 'info',
              version: targetUpdate.version,
              progress: 0
            });
            break;
          case 'Progress':
            // O Tauri v2 ainda não tem progresso real, simulamos
            const newProgress = Math.min(downloadProgress + 10, 90);
            setDownloadProgress(newProgress);
            updaterDebug.addLog({
              event: 'Download Progress',
              details: `Progresso do download: ${newProgress}%`,
              type: 'info',
              version: targetUpdate.version,
              progress: newProgress
            });
            break;
          case 'Finished':
            setDownloadProgress(100);
            setUpdateStatus('ready');
            updaterDebug.addLog({
              event: 'Download Completed',
              details: 'Download concluído com sucesso',
              type: 'success',
              version: targetUpdate.version,
              progress: 100
            });
            break;
        }
      });

      console.log('[AutoUpdater] Download completed successfully');

      // Log conclusão da instalação
      updaterDebug.addLog({
        event: 'Installation Completed',
        details: 'Atualização instalada com sucesso. Aguardando confirmação para reiniciar.',
        type: 'success',
        version: targetUpdate.version
      });

      // Perguntar se quer reiniciar
      const shouldRestart = await ask(
        'Atualização instalada com sucesso!\n\nDeseja reiniciar o aplicativo agora para aplicar as mudanças?',
        {
          title: 'Atualização Concluída',
          kind: 'info'
        }
      );

      if (shouldRestart) {
        updaterDebug.addLog({
          event: 'Restart Requested',
          details: 'Usuário confirmou reinicialização do aplicativo',
          type: 'info',
          version: targetUpdate.version
        });
        await restartApp();
      } else {
        updaterDebug.addLog({
          event: 'Restart Declined',
          details: 'Usuário optou por não reiniciar agora. Atualização será aplicada no próximo início.',
          type: 'warning',
          version: targetUpdate.version
        });
      }

    } catch (err) {
      let specificError = 'Erro desconhecido';
      let errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao baixar/instalar atualização';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        // Categorizar tipos de erro específicos para download/instalação
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection') || msg.includes('timeout')) {
          specificError = 'Erro de conexão durante o download - verifique sua internet';
        } else if (msg.includes('disk') || msg.includes('space') || msg.includes('storage')) {
          specificError = 'Espaço insuficiente em disco para baixar a atualização';
        } else if (msg.includes('permission') || msg.includes('access denied') || msg.includes('unauthorized')) {
          specificError = 'Permissões insuficientes - execute como administrador';
        } else if (msg.includes('signature') || msg.includes('invalid signature') || msg.includes('verification')) {
          specificError = 'Falha na verificação de segurança do arquivo baixado';
        } else if (msg.includes('corrupted') || msg.includes('checksum') || msg.includes('hash')) {
          specificError = 'Arquivo baixado está corrompido - tente novamente';
        } else if (msg.includes('antivirus') || msg.includes('blocked') || msg.includes('quarantine')) {
          specificError = 'Download bloqueado pelo antivírus - adicione exceção';
        } else if (msg.includes('404') || msg.includes('not found')) {
          specificError = 'Arquivo de instalação não encontrado no servidor';
        } else if (msg.includes('installer') || msg.includes('install')) {
          specificError = 'Falha durante a instalação - feche outros programas';
        } else if (msg.includes('admin') || msg.includes('administrator')) {
          specificError = 'Instalação requer privilégios de administrador';
        } else {
          specificError = errorMessage;
        }
      }
      
      console.error('[AutoUpdater] Download/install failed:', err);
      console.error('[AutoUpdater] Download error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        specificError,
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
      
      // Registrar erro no debug
      updaterDebug.addLog({
        event: 'Download/Install Failed',
        details: `${specificError}\n\nDetalhes técnicos:\n${errorMessage}\n\nStack: ${err instanceof Error ? err.stack || 'N/A' : 'N/A'}`,
        type: 'error',
        version: targetUpdate.version
      });
      
      setError(`Erro ao baixar/instalar: ${specificError}`);
      setUpdateStatus('error');
    } finally {
      setIsDownloading(false);
    }
  }, [updateAvailable, updaterDebug, downloadProgress]);

  const restartApp = useCallback(async () => {
    try {
      console.log('[AutoUpdater] Restarting application...');
      updaterDebug.addLog({
        event: 'Restart Initiated',
        details: 'Iniciando processo de reinicialização do aplicativo...',
        type: 'info'
      });
      await relaunch();
    } catch (err) {
      let specificError = 'Erro desconhecido';
      let errorMessage = err instanceof Error ? err.message : 'Erro ao reiniciar aplicação';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        // Categorizar erros de reinicialização
        if (msg.includes('permission') || msg.includes('access denied')) {
          specificError = 'Permissões insuficientes para reiniciar - execute como administrador';
        } else if (msg.includes('process') || msg.includes('pid')) {
          specificError = 'Erro no processo de reinicialização - feche manualmente';
        } else if (msg.includes('busy') || msg.includes('locked')) {
          specificError = 'Aplicação em uso - feche todas as janelas e tente novamente';
        } else {
          specificError = errorMessage;
        }
      }
      
      console.error('[AutoUpdater] Restart failed:', err);
      console.error('[AutoUpdater] Restart error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        specificError,
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
      
      // Registrar erro no debug
      updaterDebug.addLog({
        event: 'Restart Failed',
        details: `${specificError}\n\nDetalhes técnicos:\n${errorMessage}\n\nStack: ${err instanceof Error ? err.stack || 'N/A' : 'N/A'}`,
        type: 'error'
      });
      
      setError(`Erro ao reiniciar: ${specificError}`);
    }
  }, [updaterDebug]);

  return {
    updateStatus,
    updateAvailable,
    isChecking,
    isDownloading,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall,
    restartApp,
    runDiagnostics,
    diagnosticResult,
  };
};