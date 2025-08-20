import React, { useState, useEffect } from 'react';
import LoginPage from './login/page';
import MainPage from './main/page';
import './index.css';
import LoadingSpinner from './components/loading/loading';
import ConfirmModal from './components/modal/confirm/confirmmodal';
import { ActivityLogProvider } from './contexts/ActivityLogContext';
import { useAuth } from './hooks/useAuth';
import TokenManager from './utils/tokenManager';

function App() {
  const [showLoading, setShowLoading] = useState(false);
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

  const handleLoginSuccess = (user: any) => {
    setShowLoading(true);
    setTimeout(() => {
      setShowLoading(false);
      // Força a atualização do estado do usuário no localStorage
      window.dispatchEvent(new Event('user-updated'));
      // Iniciar gerenciamento de tokens após login
      tokenManager.startTokenRefresh();
    }, 1500); // 1.5 segundos de loading, ajuste conforme necessário
  };

  return (
    <ActivityLogProvider>
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
    </ActivityLogProvider>
  );
}

export default App;