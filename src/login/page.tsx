import React, { useState } from 'react';
import '../index.css';
import '../fonts.css';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de autenticação aqui
    console.log('Login:', login, 'Password:', password);
    
    // Simulando autenticação bem-sucedida
    if (login && password) {
      onLoginSuccess?.();
    }
  };

  const handleCancel = () => {
    setLogin('');
    setPassword('');
  };

  return (
    <main 
      className="relative min-h-screen w-full flex items-center justify-center p-4"
      style={{
        backgroundImage: `url('/imagens_gerais/6d36bb33359b60c7f517a8e9a9cfa76b4a1df9ac.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Overlay principal do login */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#111216] backdrop-blur-sm rounded-2xl border border-black shadow-2xl p-8">
          {/* Header com título e ícone */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/imagens_gerais/b7cbeb681c61b011da16e599b1dd383119a4dc58.png" alt="Logo" className="w-auto" />
            </div>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="space-y-6 font-neofara">
            {/* Campo de Login */}
            <div>
              <input
                type="text"
                placeholder="LOGIN"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black placeholder-gray-500 rounded-lg border-2 border-transparent focus:border-green-500 focus:outline-none transition-all duration-300 font-medium tracking-wide"
                required
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white text-black placeholder-gray-500 rounded-lg border-2 border-transparent focus:border-green-500 focus:outline-none transition-all duration-300 font-medium tracking-wide"
                required
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 bg-white text-lg text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-300 tracking-wide"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="flex-1 bg-white text-lg text-black font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-all duration-300 tracking-wide"
              >
                ENTRAR
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;