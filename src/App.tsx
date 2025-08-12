import React, { useState } from 'react';
import LoginPage from './login/page';
import MainPage from './main/page';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função para lidar com o login bem-sucedido
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <MainPage />
      )}
    </>
  );
}

export default App;