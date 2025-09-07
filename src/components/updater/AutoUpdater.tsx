import React, { useEffect, useRef } from 'react';
import { ask } from '@tauri-apps/plugin-dialog';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAutoUpdater } from '../../hooks/useAutoUpdater';

interface AutoUpdaterProps {
  checkOnStart?: boolean;
}

const AutoUpdater: React.FC<AutoUpdaterProps> = ({ checkOnStart = false }) => {
  const {
    updateStatus,
    updateAvailable,
    isChecking,
    downloadProgress,
    error,
    checkForUpdates,
    downloadAndInstall
  } = useAutoUpdater();

  const hasCheckedOnStart = useRef(false);

  // Verificar updates na inicialização se solicitado (apenas uma vez)
  useEffect(() => {
    if (checkOnStart && !hasCheckedOnStart.current) {
      hasCheckedOnStart.current = true;
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 3000); // Delay de 3s para não interferir no startup
      
      return () => clearTimeout(timer);
    }
  }, [checkOnStart, checkForUpdates]);

  const showUpdateDialog = async () => {
    if (!updateAvailable) return;

    const shouldUpdate = await ask(
      `Nova versão ${updateAvailable.version} disponível!\n\n${updateAvailable.body || 'Melhorias e correções de bugs.'}\n\nDeseja atualizar agora?`,
      {
        title: 'Atualização Disponível',
        kind: 'info'
      }
    );

    if (shouldUpdate) {
      downloadAndInstall(updateAvailable);
    }
  };

  // Auto-show dialog when update is available and checkOnStart is true
  useEffect(() => {
    if (checkOnStart && updateAvailable && updateStatus === 'available') {
      showUpdateDialog();
    }
  }, [updateAvailable, updateStatus, checkOnStart]);

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

      {/* Error notification with diagnostic button - só aparece quando há erro */}
      {updateStatus === 'error' && error && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-900/90 border border-red-600 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-start gap-3 text-white">
            <AlertCircle className="text-red-400 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="text-sm font-medium text-red-200">Erro na Verificação de Updates</div>
              <div className="text-xs text-red-300 mt-1 whitespace-pre-wrap">{error}</div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={checkForUpdates}
                  disabled={isChecking}
                  className="text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 px-3 py-1 rounded text-white"
                >
                  {isChecking ? 'Tentando...' : 'Tentar Novamente'}
                </button>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-red-400 hover:text-red-300"
              title="Fechar"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoUpdater;