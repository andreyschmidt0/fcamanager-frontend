import React, { useState, useEffect, useRef } from 'react';
import { Database, AlertTriangle, CheckCircle } from 'lucide-react';
import apiService from '../../services/api-tauri.service';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onEnvironmentChange?: (env: 'production' | 'test') => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onEnvironmentChange, buttonRef }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Inicializar com o ambiente salvo no localStorage
  const [currentEnv, setCurrentEnv] = useState<'production' | 'test'>(() => {
    const saved = localStorage.getItem('currentEnvironment');
    return (saved as 'production' | 'test') || 'production';
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apenas sincronizar com o servidor uma vez quando o dropdown abrir pela primeira vez
  useEffect(() => {
    if (isOpen) {
      const lastFetch = localStorage.getItem('lastEnvironmentFetch');
      const now = Date.now();
      
      // Buscar do servidor apenas se passou mais de 5 segundos desde a última consulta
      if (!lastFetch || now - parseInt(lastFetch) > 5000) {
        fetchCurrentEnvironment();
        localStorage.setItem('lastEnvironmentFetch', now.toString());
      }
    }
  }, [isOpen]);

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
        
        // Mostrar notificação de sucesso
        const envName = env === 'production' ? 'Produção' : 'Testes';
        
        // Fechar o dropdown
        onClose();
        
        // Aguardar um breve momento para garantir que a mudança foi processada
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recarregar a página para atualizar os dados do novo ambiente
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erro ao alternar ambiente:', error);
      
      // Mensagens de erro específicas
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

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute left-0 top-full mt-2 w-80 bg-[#1d1e24] rounded-lg shadow-2xl border border-gray-700 z-50 overflow-hidden"
    >
      {/* Header Section */}
      <div className="bg-[#111216] px-4 py-3 border-b border-[#000000]">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Ambiente do Banco de Dados</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Current Environment Badge */}
        <div className="flex items-center justify-between p-3 bg-[#111216] rounded-lg border border-gray-700">
          <span className="text-md text-gray-400 font-medium">Ambiente Atual:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold ${
            currentEnv === 'production' 
              ? 'bg-green-600/20 text-green-400 border border-green-500/30' 
              : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {currentEnv === 'production' ? (
              <>
                <CheckCircle size={14} />
                <span>PRODUÇÃO</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} />
                <span>TESTES</span>
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-2.5 bg-red-900/20 border border-red-600/30 rounded-lg">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Switch Buttons */}
        <div className="space-y-2">
          {/* Botão Produção */}
          <button
            onClick={() => handleSwitchEnvironment('production')}
            disabled={isLoading || currentEnv === 'production'}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              currentEnv === 'production'
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-green-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentEnv === 'production' ? (
              <>
                <CheckCircle size={16} />
                <span>✓ Produção (Ativo)</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>Alternar para Produção</span>
              </>
            )}
          </button>

          {/* Botão Testes */}
          <button
            onClick={() => handleSwitchEnvironment('test')}
            disabled={isLoading || currentEnv === 'test'}
            className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
              currentEnv === 'test'
                ? 'bg-yellow-600 text-white cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-yellow-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {currentEnv === 'test' ? (
              <>
                <CheckCircle size={16} />
                <span>✓ Testes (Ativo)</span>
              </>
            ) : (
              <>
                <Database size={16} />
                <span>Alternar para Testes</span>
              </>
            )}
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-blue-400 pt-2">
            <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-blue-400 border-t-transparent"></div>
            <span className="text-xs">Alterando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
