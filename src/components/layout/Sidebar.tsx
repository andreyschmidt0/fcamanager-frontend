import React, { useState, useEffect, useRef } from 'react';
import { Database, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Trophy, Menu } from 'lucide-react';
import apiService from '../../services/api-tauri.service';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEnvironmentChange?: (env: 'production' | 'test') => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  appContext: 'normal' | 'tournament';
  setAppContext: (context: 'normal' | 'tournament') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  onEnvironmentChange, 
  buttonRef,
  appContext,
  setAppContext
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'main' | 'database'>('main');
  
  // Inicializar com o ambiente salvo no localStorage
  const [currentEnv, setCurrentEnv] = useState<'production' | 'test'>(() => {
    const saved = localStorage.getItem('currentEnvironment');
    return (saved as 'production' | 'test') || 'production';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resetar view quando abrir
  useEffect(() => {
    if (isOpen) {
      setView('main');
    }
  }, [isOpen]);

  // Apenas sincronizar com o servidor uma vez quando o dropdown abrir pela primeira vez
  useEffect(() => {
    if (isOpen && view === 'database') {
      const lastFetch = localStorage.getItem('lastEnvironmentFetch');
      const now = Date.now();
      
      // Buscar do servidor apenas se passou mais de 5 segundos desde a última consulta
      if (!lastFetch || now - parseInt(lastFetch) > 5000) {
        fetchCurrentEnvironment();
        localStorage.setItem('lastEnvironmentFetch', now.toString());
      }
    }
  }, [isOpen, view]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef?.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, buttonRef]);

  const fetchCurrentEnvironment = async () => {
    setError(null);
    try {
      const env = await apiService.getCurrentEnvironment();
      
      // Atualizar apenas se for diferente do estado local
      if (env !== currentEnv) {
        setCurrentEnv(env);
        localStorage.setItem('currentEnvironment', env);
        
        if (onEnvironmentChange) {
          onEnvironmentChange(env);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar ambiente:', error);
      setError('Erro ao carregar ambiente atual');
    }
  };

  const handleSwitchEnvironment = async (env: 'production' | 'test') => {
    if (env === currentEnv) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiService.switchEnvironment(env);
      
      if (result.success) {
        setCurrentEnv(env);
        
        // Salvar no localStorage para persistir entre recargas
        localStorage.setItem('currentEnvironment', env);
        
        // Notificar o Header sobre a mudança
        if (onEnvironmentChange) {
          onEnvironmentChange(env);
        }
        
        // Fechar o dropdown
        onClose();
        
        // Recarregar a página para atualizar os dados do novo ambiente
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erro ao alternar ambiente:', error);
      
      if (error.message.includes('403')) {
        setError('❌ Acesso negado. Apenas Masters podem alternar ambientes.');
      } else if (error.message.includes('401')) {
        setError('❌ Sessão expirada. Faça login novamente.');
      } else {
        setError('❌ Erro ao alternar ambiente. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTournamentContext = () => {
    setAppContext(appContext === 'normal' ? 'tournament' : 'normal');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute left-0 top-full mt-2 w-72 bg-[#1d1e24] rounded-lg shadow-2xl border border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in duration-200"
    >
      {view === 'main' ? (
        <>
          {/* Header Menu Principal */}
          <div className="bg-[#111216] px-4 py-3 border-b border-[#000000] flex items-center gap-2">
            <Menu size={18} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-white">Menu de Ferramentas</h3>
          </div>

          <div className="flex flex-col p-2 gap-1">
            <p className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Ações</p>
            
            {/* Opção BANCO */}
            <button
              onClick={() => setView('database')}
              className="flex items-center justify-between w-full p-3 hover:bg-[#2a2b34] rounded-lg transition-colors group border border-transparent hover:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/10 text-blue-400 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Database size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-white">BANCO DE DADOS</span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    Configurar: {currentEnv === 'production' ? 'Oficial' : 'Testes'}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-transform group-hover:translate-x-1" />
            </button>

            {/* Opção TORNEIO */}
            <button
              onClick={toggleTournamentContext}
              className={`flex items-center justify-between w-full p-3 hover:bg-[#2a2b34] rounded-lg transition-colors group border ${
                appContext === 'tournament' 
                  ? 'bg-blue-600/10 border-blue-500/30' 
                  : 'border-transparent hover:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md transition-colors ${
                  appContext === 'tournament' 
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                    : 'bg-gray-700/50 text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-400'
                }`}>
                  <Trophy size={20} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-white">MODO TORNEIO</span>
                  <span className="text-[10px] text-gray-400 uppercase">
                    Status: {appContext === 'normal' ? 'Desativado' : 'Ativado'}
                  </span>
                </div>
              </div>
              {appContext === 'tournament' ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-blue-400">ATIVO</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              ) : (
                <ChevronRight size={18} className="text-gray-600 group-hover:text-white transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Header Sub-menu */}
          <div className="bg-[#111216] px-4 py-3 border-b border-[#000000] flex items-center gap-2">
            <button 
              onClick={() => setView('main')}
              className="p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <Database size={18} className="text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Ambiente do Banco</h3>
          </div>

          {/* Content Sub-menu */}
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#111216] rounded-lg border border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Conectado a:</span>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                currentEnv === 'production' 
                  ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
                  : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {currentEnv === 'production' ? 'OFICIAL' : 'TESTES'}
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-900/20 border border-red-600/30 rounded-lg">
                <p className="text-xs text-red-300 leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => handleSwitchEnvironment('production')}
                disabled={isLoading || currentEnv === 'production'}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  currentEnv === 'production'
                    ? 'bg-green-600 text-white cursor-not-allowed shadow-[0_4px_10px_rgba(22,163,74,0.3)]'
                    : 'bg-gray-700 text-white hover:bg-green-600'
                }`}
              >
                {currentEnv === 'production' ? '✓ Oficial Ativo' : 'Mudar para Oficial'}
              </button>

              <button
                onClick={() => handleSwitchEnvironment('test')}
                disabled={isLoading || currentEnv === 'test'}
                className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  currentEnv === 'test'
                    ? 'bg-yellow-600 text-white cursor-not-allowed shadow-[0_4px_10px_rgba(202,138,4,0.3)]'
                    : 'bg-gray-700 text-white hover:bg-yellow-600'
                }`}
              >
                {currentEnv === 'test' ? '✓ Testes Ativo' : 'Mudar para Testes'}
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center gap-3 text-blue-400 py-1">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                <span className="text-xs font-medium">Processando mudança...</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
