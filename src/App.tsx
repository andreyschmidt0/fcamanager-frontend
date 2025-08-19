import React, { useState } from 'react';
import LoginPage from './login/page';
import MainPage from './main/page';
import './index.css';
import LoadingSpinner from './components/loading/loading';
import ConfirmModal from './components/modal/confirm/confirmmodal';
import { ActivityLogProvider } from './contexts/ActivityLogContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleLoginSuccess = (user: any) => {
    setShowLoading(true);
    setTimeout(() => {
      setIsAuthenticated(true);
      setShowLoading(false);
      // Força a atualização do estado do usuário no localStorage
      window.dispatchEvent(new Event('user-updated'));
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
  
      {!isAuthenticated && !showLoading ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : null}
      {isAuthenticated && !showLoading ? (
        <MainPage />
      ) : null}
    </ActivityLogProvider>
  );
}

export default App;