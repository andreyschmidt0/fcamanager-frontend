import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';
import { UpdaterDebug } from '../components/debug/DebugModal';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export interface UseAutoUpdaterReturn {
  updateStatus: UpdateStatus;
  updateAvailable: Update | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  error: string;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: (update?: Update) => Promise<void>;
  restartApp: () => Promise<void>;
}

export const useAutoUpdater = (): UseAutoUpdaterReturn => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState('');
  
  // Instância do debugger de updater
  const updaterDebug = UpdaterDebug.getInstance();

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setUpdateStatus('checking');
    setError('');

    // Log início da verificação
    updaterDebug.addLog({
      event: 'Update Check Started',
      details: 'Iniciando verificação de atualizações...',
      type: 'info'
    });

    try {
      console.log('[AutoUpdater] Checking for updates...');
      const update = await check();
      
      if (update?.available) {
        console.log('[AutoUpdater] Update available:', update.version);
        updaterDebug.addLog({
          event: 'Update Available',
          details: `Nova versão encontrada: ${update.version}`,
          type: 'success',
          version: update.version
        });
        setUpdateAvailable(update);
        setUpdateStatus('available');
        return;
      } else {
        console.log('[AutoUpdater] No updates available');
        updaterDebug.addLog({
          event: 'No Updates Available',
          details: 'Aplicativo já está na versão mais recente',
          type: 'info'
        });
        setUpdateStatus('idle');
      }
    } catch (err) {
      let specificError = 'Erro desconhecido';
      let errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao verificar atualizações';
      
      if (err instanceof Error) {
        const msg = err.message.toLowerCase();
        
        // Categorizar tipos de erro para melhor diagnóstico
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection') || msg.includes('timeout')) {
          specificError = 'Erro de conexão - verifique sua internet';
        } else if (msg.includes('signature') || msg.includes('invalid signature') || msg.includes('verification')) {
          specificError = 'Erro de verificação de segurança - assinatura inválida';
        } else if (msg.includes('permission') || msg.includes('access denied') || msg.includes('unauthorized')) {
          specificError = 'Erro de permissão - execute como administrador';
        } else if (msg.includes('404') || msg.includes('not found')) {
          specificError = 'Arquivo de atualização não encontrado no servidor';
        } else if (msg.includes('json') || msg.includes('parse') || msg.includes('malformed')) {
          specificError = 'Arquivo de configuração de update corrompido';
        } else if (msg.includes('dns') || msg.includes('host')) {
          specificError = 'Erro de DNS - não foi possível conectar ao servidor';
        } else if (msg.includes('ssl') || msg.includes('tls') || msg.includes('certificate')) {
          specificError = 'Erro de certificado SSL/TLS';
        } else if (msg.includes('platform') || msg.includes('architecture')) {
          specificError = 'Plataforma não suportada para atualizações';
        } else {
          specificError = errorMessage;
        }
      }
      
      console.error('[AutoUpdater] Check failed:', err);
      console.error('[AutoUpdater] Error details:', {
        name: err instanceof Error ? err.name : 'Unknown',
        message: errorMessage,
        specificError,
        stack: err instanceof Error ? err.stack : 'No stack trace',
      });
      
      // Registrar erro no debug
      updaterDebug.addLog({
        event: 'Update Check Failed',
        details: `${specificError}\n\nDetalhes técnicos:\n${errorMessage}\n\nStack: ${err instanceof Error ? err.stack || 'N/A' : 'N/A'}`,
        type: 'error'
      });
      
      setError(`Erro ao verificar atualizações: ${specificError}`);
      setUpdateStatus('error');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, updaterDebug]);

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
    restartApp
  };
};