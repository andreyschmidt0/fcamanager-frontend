import React, { useState } from 'react';
import LoginPage from './login/page';
import MainPage from './main/page';
import './index.css';
import LoadingSpinner from './components/loading/loading';
import ConfirmModal from './components/modal/confirmmodal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Função para lidar com o login bem-sucedido
  const handleLoginSuccess = () => {
    setShowLoading(true);
    // Simula um carregamento após o login bem-sucedido
    setTimeout(() => {
      setIsAuthenticated(true);
      setShowLoading(false);
    }, 1500); // 1.5 segundos de loading, ajuste conforme necessário
  };

  return (
    <>
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
    </>
  );
}

export default App;