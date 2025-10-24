import { Bell, Menu, ChevronDown, LogOut, Database } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Sidebar from './Sidebar';
import apiService from '../../services/api-tauri.service';

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Inicializar com o ambiente salvo no localStorage
  const [currentEnvironment, setCurrentEnvironment] = useState<'production' | 'test'>(() => {
    const saved = localStorage.getItem('currentEnvironment');
    return (saved as 'production' | 'test') || 'production';
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleMenuToggle = () => {
    setShowSidebar(!showSidebar);
  };

  // Buscar ambiente atual do servidor apenas uma vez ao montar
  useEffect(() => {
    const fetchEnvironment = async () => {
      try {
        const env = await apiService.getCurrentEnvironment();
        
        // Atualizar apenas se for diferente
        if (env !== currentEnvironment) {
          setCurrentEnvironment(env);
          localStorage.setItem('currentEnvironment', env);
        }
      } catch (error) {
        console.error('Erro ao buscar ambiente:', error);
      }
    };

    // Buscar apenas uma vez ao carregar a página
    fetchEnvironment();
  }, []);

  // Atualizar o ambiente quando o Sidebar notificar mudança
  const handleEnvironmentChange = (env: 'production' | 'test') => {
    setCurrentEnvironment(env);
    localStorage.setItem('currentEnvironment', env);
  };

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
    return (
      <>
      <header className="bg-black border-b border-gray-800 p-2">
      <div className="relative flex items-center justify-between px-6 py-4">
        <div ref={menuContainerRef} className="flex items-center gap-4 relative">
          <button 
            ref={menuButtonRef}
            onClick={handleMenuToggle}
            className="text-white hover:text-gray-300 transition-colors p-2 hover:bg-gray-800 rounded-lg"
            aria-label="Abrir menu"
          >
            <Menu size={24} />
          </button>
          
          {/* Dropdown Menu - Posicionado abaixo do botão */}
          {showSidebar && (
            <Sidebar 
              isOpen={showSidebar} 
              onClose={() => setShowSidebar(false)}
              onEnvironmentChange={(env) => setCurrentEnvironment(env)}
              buttonRef={menuButtonRef}
            />
          )}
          
          {/* Indicador de Ambiente */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${
            currentEnvironment === 'production'
              ? 'bg-green-600/20 text-green-400 border-green-500/30'
              : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30'
          }`}>
            <Database size={14} />
            <span>{currentEnvironment === 'production' ? 'OFICIAL' : 'TESTES'}</span>
          </div>
        </div>
        
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-2xl font-neofara font-semibold tracking-wider">GERENCIADOR</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="relative text-white hover:text-gray-300 transition-colors">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user?.profile.nickname ? user.profile.nickname.substring(0, 2).toUpperCase() : 'GM'}
                </span>
              </div>
              <span className="text-sm">
              {user?.profile.nickname || 'Admin'}
              </span>
              <ChevronDown 
                size={16} 
                className={`transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`}
              />
            </button>
            
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-[#1d1e24] rounded-lg shadow-lg border border-gray-600 z-50">
                <button
                  onClick={() => {
                    handleLogout();
                    setShowProfileDropdown(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    </>
  );
};

export default Header;