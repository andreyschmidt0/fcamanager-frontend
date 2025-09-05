import React, { useState, useEffect } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoUpdaterProps {
  checkOnStart?: boolean;
}

const AutoUpdater: React.FC<AutoUpdaterProps> = ({ checkOnStart = false }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  // Verificar updates na inicialização se solicitado
  useEffect(() => {
    if (checkOnStart) {
      setTimeout(() => {
        checkForUpdates();
      }, 3000); // Delay de 3s para não interferir no startup
    }
  }, [checkOnStart]);

  const checkForUpdates = async () => {
    if (isChecking) return;

    setIsChecking(true);
    setUpdateStatus('checking');
    setError('');

    try {
      const update = await check();
      
      if (update?.available) {
        setUpdateAvailable(update);
        setUpdateStatus('available');
        
        // Mostrar notificação automática se solicitado
        if (checkOnStart) {
          showUpdateDialog(update);
        }
      } else {
        setUpdateStatus('idle');
        if (!checkOnStart) {
          // Mostrar feedback apenas se foi check manual
          setUpdateStatus('idle');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao verificar atualizações');
      setUpdateStatus('error');
    } finally {
      setIsChecking(false);
    }
  };

  const showUpdateDialog = async (update: Update) => {
    const shouldUpdate = await ask(
      `Nova versão ${update.version} disponível!\n\n${update.body}\n\nDeseja atualizar agora?`,
      {
        title: 'Atualização Disponível',
        kind: 'info'
      }
    );

    if (shouldUpdate) {
      downloadAndInstall(update);
    }
  };

  const downloadAndInstall = async (update: Update) => {
    setIsDownloading(true);
    setUpdateStatus('downloading');
    setDownloadProgress(0);

    try {
      // Download com callback de progresso
      let downloaded = 0;
      let total = 100; // Placeholder - o Tauri não fornece progresso real ainda

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            setDownloadProgress(0);
            break;
          case 'Progress':
            // Simular progresso - o Tauri v2 pode não ter progresso real
            downloaded += 10;
            setDownloadProgress(Math.min(downloaded, 90));
            break;
          case 'Finished':
            setDownloadProgress(100);
            setUpdateStatus('ready');
            break;
        }
      });

      // Perguntar se quer reiniciar agora
      const shouldRestart = await ask(
        'Atualização baixada com sucesso! Deseja reiniciar o aplicativo agora?',
        {
          title: 'Atualização Pronta',
          kind: 'info'
        }
      );

      if (shouldRestart) {
        await relaunch();
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar atualização');
      setUpdateStatus('error');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus) {
      case 'checking':
        return <RefreshCw className="animate-spin" size={16} />;
      case 'available':
        return <Download size={16} />;
      case 'downloading':
        return <RefreshCw className="animate-spin" size={16} />;
      case 'ready':
        return <CheckCircle size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <RefreshCw size={16} />;
    }
  };

  const getStatusText = () => {
    switch (updateStatus) {
      case 'checking':
        return 'Verificando...';
      case 'available':
        return `v${updateAvailable?.version} disponível`;
      case 'downloading':
        return `Baixando... ${downloadProgress}%`;
      case 'ready':
        return 'Pronto para instalar';
      case 'error':
        return 'Erro na verificação';
      default:
        return 'Verificar atualizações';
    }
  };

  const getStatusColor = () => {
    switch (updateStatus) {
      case 'available':
        return 'text-blue-400';
      case 'downloading':
        return 'text-yellow-400';
      case 'ready':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  // Componente invisível - só executa verificação automática
  return (
    <div>
      {/* Progress bar durante download - só aparece quando está baixando */}
      {updateStatus === 'downloading' && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-3 text-white">
            <RefreshCw className="animate-spin" size={20} />
            <div>
              <div className="text-sm font-medium">Baixando atualização...</div>
              <div className="w-48 bg-gray-700 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">{downloadProgress}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoUpdater;