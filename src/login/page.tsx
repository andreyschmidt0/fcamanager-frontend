import React, { useState } from 'react';
import '../index.css';
import '../fonts.css';
import AuthService from '../services/auth';

interface LoginPageProps {
  onLoginSuccess?: (user: any) => void;
}

// Helper function to detect if running in Tauri
const isRunningInTauri = () => typeof window !== 'undefined' && (window as any).__TAURI__ !== undefined;

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Usa o serviço de autenticação
      const authService = AuthService.getInstance();
      const result = await authService.login({
        username: login,
        password: password
      });



      if (result.success && result.user) {
        onLoginSuccess?.(result.user);
      } else {
        setError(result.error || 'Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro durante login:', error);
      setError('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setLogin('');
    setPassword('');
    setError('');
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
            {/* Platform indicator */}
            <div className="text-xs text-gray-500 mb-2">
              🖥️ Desktop App
            </div>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="space-y-6 font-neofara">
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            {/* Campo de Login */}
            <div>
              <input
                type="text"
                placeholder="LOGIN"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full px-4 py-3 bg-[#1d1e24] text-white text-xl placeholder-gray-500 rounded-lg border-2 border-transparent focus:border-green-500 focus:outline-none transition-all duration-300 font-normal tracking-wider"
                required
                disabled={isLoading}
                maxLength={20}
                pattern="[a-zA-Z0-9_]{3,20}"
                title="Use apenas letras, números e underscore (3-20 caracteres)"
              />
            </div>

            {/* Campo de Senha */}
            <div>
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1d1e24] text-white text-xl placeholder-gray-500 rounded-lg border-2 border-transparent focus:border-green-500 focus:outline-none transition-all duration-300 font-normal tracking-wider password-toggle-white"
                required
                disabled={isLoading}
                minLength={6}
                maxLength={50}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 bg-green-500 text-xl hover:scale-105 text-[#111216] font-semibold py-3 px-4 rounded-lg transition-all duration-300 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-green-500 text-xl hover:scale-105 text-[#111216] font-semibold py-3 px-4 rounded-lg transition-all duration-300 tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;