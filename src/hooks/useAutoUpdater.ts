import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';

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

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return;

    setIsChecking(true);
    setUpdateStatus('checking');
    setError('');

    try {
      console.log('[AutoUpdater] Checking for updates...');
      const update = await check();
      
      if (update?.available) {
        console.log('[AutoUpdater] Update available:', update.version);
        setUpdateAvailable(update);
        setUpdateStatus('available');
        return;
      } else {
        console.log('[AutoUpdater] No updates available');
        setUpdateStatus('idle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar atualizações';
      console.error('[AutoUpdater] Check failed:', errorMessage);
      setError(errorMessage);
      setUpdateStatus('error');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  const downloadAndInstall = useCallback(async (update?: Update) => {
    const targetUpdate = update || updateAvailable;
    if (!targetUpdate) {
      setError('Nenhuma atualização disponível');
      return;
    }

    setIsDownloading(true);
    setUpdateStatus('downloading');
    setDownloadProgress(0);
    setError('');

    try {
      console.log('[AutoUpdater] Starting download and install...');
      
      await targetUpdate.downloadAndInstall((event) => {
        console.log('[AutoUpdater] Download event:', event.event);
        
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            break;
          case 'Progress':
            // O Tauri v2 ainda não tem progresso real, simulamos
            setDownloadProgress(prev => Math.min(prev + 10, 90));
            break;
          case 'Finished':
            setDownloadProgress(100);
            setUpdateStatus('ready');
            break;
        }
      });

      console.log('[AutoUpdater] Download completed successfully');

      // Perguntar se quer reiniciar
      const shouldRestart = await ask(
        'Atualização instalada com sucesso!\n\nDeseja reiniciar o aplicativo agora para aplicar as mudanças?',
        {
          title: 'Atualização Concluída',
          kind: 'info'
        }
      );

      if (shouldRestart) {
        await restartApp();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao baixar/instalar atualização';
      console.error('[AutoUpdater] Download/install failed:', errorMessage);
      setError(errorMessage);
      setUpdateStatus('error');
    } finally {
      setIsDownloading(false);
    }
  }, [updateAvailable]);

  const restartApp = useCallback(async () => {
    try {
      console.log('[AutoUpdater] Restarting application...');
      await relaunch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reiniciar aplicação';
      console.error('[AutoUpdater] Restart failed:', errorMessage);
      setError(errorMessage);
    }
  }, []);

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