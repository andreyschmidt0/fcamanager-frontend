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

function App() {
  const [showLoading, setShowLoading] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  const tokenManager = TokenManager.getInstance();

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
      // Só mostrar modal se não estivermos na página de login
      if (window.location.pathname !== '/login') {
        setShowSessionExpiredModal(true);
      }
    };

    window.addEventListener('tokenExpired', handleTokenExpired);
    return () => {
      window.removeEventListener('tokenExpired', handleTokenExpired);
    };
  }, []);

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

        {/* Auto-updater component - shows in header when authenticated */}
        {isAuthenticated && (
          <div className="fixed top-4 right-4 z-50">
            <AutoUpdater checkOnStart={true} />
          </div>
        )}

        <DebugModal 
          isOpen={showDebugModal} 
          onClose={() => setShowDebugModal(false)} 
        />

        <SessionExpiredModal 
          isOpen={showSessionExpiredModal}
          onRelogin={handleRelogin}
        />
      </SuccessModalProvider>
    </ActivityLogProvider>
  );
}

export default App;