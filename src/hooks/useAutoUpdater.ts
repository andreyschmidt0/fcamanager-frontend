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
      if (!navigator.onLine) {
        throw new Error('Aplicativo está offline. Conecte-se à internet.');
      }

      const update = await check();
      
      if (update?.available) {
        setUpdateAvailable(update);
        setUpdateStatus('available');
      } else {
        setUpdateStatus('idle');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar atualizações';
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
      await targetUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            break;
          case 'Progress':
            const newProgress = Math.min(downloadProgress + 10, 90);
            setDownloadProgress(newProgress);
            break;
          case 'Finished':
            setDownloadProgress(100);
            setUpdateStatus('ready');
            break;
        }
      });

      const shouldRestart = await ask(
        'Atualização instalada com sucesso!\n\nDeseja reiniciar o aplicativo agora?',
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
      setError(errorMessage);
      setUpdateStatus('error');
    } finally {
      setIsDownloading(false);
    }
  }, [updateAvailable, downloadProgress]);

  const restartApp = useCallback(async () => {
    try {
      await relaunch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reiniciar aplicação';
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
    restartApp,
  };
};