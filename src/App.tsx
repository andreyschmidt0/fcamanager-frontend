import React, { useState, useEffect } from 'react';
import LoginPage from './login/page';
import MainPage from './main/page';
import './index.css';
import LoadingSpinner from './components/loading/loading';
import ConfirmModal from './components/modal/confirm/confirmmodal';
import DebugModal from './components/debug/DebugModal';
import SessionExpiredModal from './components/modal/SessionExpiredModal';
import AutoUpdater from './components/updater/AutoUpdater';
import { ActivityLogProvider } from './contexts/ActivityLogContext';
import { SuccessModalProvider } from './contexts/SuccessModalContext';
import { useAuth } from './hooks/useAuth';
import TokenManager from './utils/tokenManager';
import AuthStateManager from './utils/authState';

function App() {
  const [showLoading, setShowLoading] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('');
  const { user, isLoading, isAuthenticated } = useAuth();
  const tokenManager = TokenManager.getInstance();
  const authStateManager = AuthStateManager.getInstance();
  
  // Debounce para evitar múltiplos modais de sessão expirada
  const [sessionExpiredDebounce, setSessionExpiredDebounce] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Iniciar gerenciamento automático de tokens quando o app carrega
    if (isAuthenticated) {
      tokenManager.startTokenRefresh();
    }

    // Cleanup quando o app é desmontado
    return () => {
      tokenManager.stopTokenRefresh();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    // Escutar evento de token expirado
    const handleTokenExpired = () => {
      // Limpar debounce anterior se existir
      if (sessionExpiredDebounce) {
        clearTimeout(sessionExpiredDebounce);
      }
      
      // Criar novo debounce para evitar múltiplos modais
      const newDebounce = setTimeout(() => {
        // Verificações adicionais antes de mostrar modal
        if (authStateManager.shouldShowSessionExpiredModal() && 
            !showSessionExpiredModal && 
            isAuthenticated) {
          setShowSessionExpiredModal(true);
        }
      }, 500); // Debounce de 500ms
      
      setSessionExpiredDebounce(newDebounce);
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
      if (sessionExpiredDebounce) {
        clearTimeout(sessionExpiredDebounce);
      }
    };
  }, [sessionExpiredDebounce, showSessionExpiredModal, isAuthenticated, authStateManager]);

  useEffect(() => {
    // Buscar versão do app quando autenticado
    if (isAuthenticated) {
      // Marcar app como pronto quando usuário está autenticado
      authStateManager.setAppReady(true);
      
      import('@tauri-apps/api/app').then(({ getVersion }) => {
        getVersion().then(setAppVersion).catch(() => setAppVersion(''));
      }).catch(() => setAppVersion(''));
    } else {
      // Marcar app como não pronto quando não autenticado
      authStateManager.setAppReady(false);
    }
  }, [isAuthenticated, authStateManager]);

  useEffect(() => {
    // Keyboard shortcut for debug modal (Ctrl + D)
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        setShowDebugModal(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
      // Força a atualização do estado do usuário no localStorage
      window.dispatchEvent(new Event('user-updated'));
      // Token refresh será iniciado automaticamente pelo useEffect quando isAuthenticated mudar
    }, 1500); // 1.5 segundos de loading, ajuste conforme necessário
  };

  const handleRelogin = () => {
    setShowSessionExpiredModal(false);
    
    // Limpar todos os dados de autenticação
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tokenExpiryTime');
    
    // Forçar atualização do contexto de auth
    window.dispatchEvent(new Event('user-updated'));
    
    // A página já vai redirecionar automaticamente para login pois isAuthenticated será false
  };

  return (
    <ActivityLogProvider>
      <SuccessModalProvider>
        {showLoading && (
          <LoadingSpinner 
            size="lg" 
            text="Autenticando..." 
            fullScreen={true}
          />
        )}
    
        {!isAuthenticated && !showLoading && !isLoading ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        ) : null}
        {isAuthenticated && !showLoading && !isLoading ? (
          <MainPage />
        ) : null}
        {isLoading && !showLoading ? (
          <LoadingSpinner 
            size="lg" 
            text="Verificando autenticação..." 
            fullScreen={true}
          />
        ) : null}

        {/* Auto-updater component - verifica updates automaticamente */}
        {isAuthenticated && (
          <AutoUpdater checkOnStart={true} />
        )}

        <DebugModal 
          isOpen={showDebugModal} 
          onClose={() => setShowDebugModal(false)} 
        />

        <SessionExpiredModal 
          isOpen={showSessionExpiredModal}
          onRelogin={handleRelogin}
        />

        {/* Versão discreta no canto inferior direito */}
        {isAuthenticated && appVersion && (
          <div className="fixed bottom-4 right-4 z-10 pointer-events-none">
            <div className="bg-black/20 backdrop-blur-sm text-gray-400 text-xs px-2 py-1 rounded border border-gray-700/30">
              v{appVersion}
            </div>
          </div>
        )}
      </SuccessModalProvider>
    </ActivityLogProvider>
  );
}

export default App;