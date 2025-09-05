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

  return (
    <div className="flex items-center gap-2">
      {/* Botão de verificação manual */}
      <button
        onClick={checkForUpdates}
        disabled={isChecking || isDownloading}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
          updateStatus === 'available' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
        }`}
        title={error || getStatusText()}
      >
        {getStatusIcon()}
        <span className={`hidden sm:inline ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </button>

      {/* Botão de download se update disponível */}
      {updateAvailable && updateStatus === 'available' && (
        <button
          onClick={() => downloadAndInstall(updateAvailable)}
          disabled={isDownloading}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Baixar</span>
        </button>
      )}

      {/* Progress bar durante download */}
      {updateStatus === 'downloading' && (
        <div className="w-32 bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${downloadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default AutoUpdater;