import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useActivityLog, ActivityLog } from '../contexts/ActivityLogContext';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api-tauri.service';


interface GMUser {
  NickName: string;
  strDiscordID: string;
  strLNexonID: string;
}

const RecentActivities: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('HOJE');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGM, setSelectedGM] = useState<string>('');
  const [showGMDropdown, setShowGMDropdown] = useState(false);
  const [gmUsers, setGMUsers] = useState<GMUser[]>([]);
  const [databaseLogs, setDatabaseLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });
  const { getActivitiesByPeriod } = useActivityLog();
  const { user } = useAuth();

  const periods = [
    { value: 'HOJE', label: 'Hoje' },
    { value: 'ONTEM', label: 'Ontem' },
    { value: 'ULTIMOS_7_DIAS', label: 'Últimos 7 dias' },
    { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 dias' },
    { value: 'ESTA_SEMANA', label: 'Esta semana' },
    { value: 'ESTE_MES', label: 'Este mês' },
    { value: 'ESTE_ANO', label: 'Este ano' }
  ];
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowGMDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Garante que só um dropdown fique aberto por vez
  const handleTogglePeriodDropdown = () => {
    setShowDropdown((prev) => {
      if (!prev) setShowGMDropdown(false);
      return !prev;
    });
  };
  const handleToggleGMDropdown = () => {
    setShowGMDropdown((prev) => {
      if (!prev) setShowDropdown(false);
      return !prev;
    });
  };


  const fetchGMUsers = async () => {
    try {
      const data = await apiService.getGMList('');
      if (data && data.isAuthorized) {
        setGMUsers(data.users || data.gms || data.gmUsers || []);
      }
    } catch (error) {
      console.error('Usuário não tem permissão para visualizar lista de GMs (normal para usuários tipo 2 e 3)');
      // Se não conseguir buscar GMs, não é problema crítico
      // Usuários tipo 2 e 3 não precisam ver outros GMs
      setGMUsers([]);
    }
  };

  // Auto-carregamento inicial após login
  useEffect(() => {
    if (user) {
      fetchGMUsers();
      fetchLogs(); // Carrega logs automaticamente após login
    }
  }, [user]);

  // Buscar logs quando período ou GM mudarem (com debounce)
  useEffect(() => {
    if (!user) return;

    const timeout = setTimeout(() => {
      fetchLogs(1); // Resetar para página 1 quando mudar filtro
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeout);
  }, [selectedPeriod, selectedGM]);

  // Função para mudar de página
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !isLoading) {
      fetchLogs(newPage);
    }
  };

  // Cache para o Discord ID para evitar múltiplas chamadas
  const [cachedDiscordId, setCachedDiscordId] = useState<string | null>(null);

  const getDiscordId = async (): Promise<string | null> => {
    if (cachedDiscordId) {
      return cachedDiscordId;
    }

    try {
      const profileData = await apiService.getPlayerProfile(user?.profile?.nickname || '');
      if (profileData?.strDiscordID) {
        setCachedDiscordId(profileData.strDiscordID);
        return profileData.strDiscordID;
      }
    } catch (error) {
      console.error('Erro ao buscar Discord ID:', error);
    }
    
    return null;
  };

  const fetchLogs = async (page = 1) => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      // Usar JWT direto com paginação
      const response = await apiService.getLogs(selectedPeriod, selectedGM || undefined, page, 20);
      setDatabaseLogs(response.logs || []);
      setPagination(response.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setDatabaseLogs([]);
      setPagination({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  };


  // Converter logs do banco para o formato do componente
  const convertLogToActivity = (log: any): ActivityLog => {
    const getActionDetails = (log: any) => {
      // Mapear baseado no ActionType e SourceProcedure do BST_AdminActionLog
      const actionType = log.action;
      const sourceProcedure = log.source_procedure;
      
      // Mapear tipos de ação baseado no SourceProcedure ou ActionType
      if (actionType && actionType.includes('Banimento')) {
        return `Baniu`;
      } else if (actionType && actionType.includes('Desbloqueio')) {
        return `Desbaniu`;
      } else if (sourceProcedure && sourceProcedure.includes('DeleteClan')) {
        return `Removeu clã`;
      } else if (sourceProcedure && sourceProcedure.includes('Cash')) {
        return `Alterou Cash`;
      } else if (sourceProcedure && sourceProcedure.includes('Exp')) {
        return `Alterou EXP`;
      } else if (sourceProcedure && sourceProcedure.includes('Nick')) {
        return `Alterou nickname`;
      } else if (sourceProcedure && sourceProcedure.includes('Email')) {
        return `Alterou email`;
      } else if (sourceProcedure && sourceProcedure.includes('Password')) {
        return `Alterou senha`;
      } else if (sourceProcedure && sourceProcedure.includes('SetInventoryItemStatus')) {
        return `Alterou status do item`;
      } else if (sourceProcedure && sourceProcedure.includes('SetUserStoreItemStatus')) {
        return `Alterou status do item`;
      } else if (sourceProcedure && sourceProcedure.includes('Item')) {
        return `Enviou item`;
      } else if (sourceProcedure && sourceProcedure.includes('Transfer')) {
        return `Transferiu`;
      } else {
        return actionType || `Realizou ação`;
      }
    };

    const getAmount = (log: any) => {
      const sourceProcedure = log.source_procedure;
      const actionType = log.action;
      
      // Extrair valores baseado no tipo de ação
      if (sourceProcedure && sourceProcedure.includes('Cash')) {
        const oldCash = parseInt(log.old_value?.replace(/\D/g, '')) || 0;
        const newCash = parseInt(log.new_value?.replace(/\D/g, '')) || 0;
        return Math.abs(newCash - oldCash);
      } else if (sourceProcedure && sourceProcedure.includes('Exp')) {
        const oldExp = parseInt(log.old_value?.replace(/\D/g, '')) || 0;
        const newExp = parseInt(log.new_value?.replace(/\D/g, '')) || 0;
        return Math.abs(oldExp - newExp);
      } else if (actionType && actionType.includes('Banimento') && log.notes) {
        // Extrair duração do banimento das notas
        const durationMatch = log.notes.match(/Duração:\s*(\d+)\s*dias/i);
        if (durationMatch) {
          return durationMatch[1] === '999' ? 'permanente' : `${durationMatch[1]} dias`;
        }
      }
      return undefined;
    };

    const getAmountType = (log: any) => {
      const sourceProcedure = log.source_procedure;
      const actionType = log.action;
      
      if (sourceProcedure && sourceProcedure.includes('Cash')) return 'cash';
      if (sourceProcedure && sourceProcedure.includes('Exp')) return 'exp';
      if (sourceProcedure && sourceProcedure.includes('Item')) return 'item';
      if (actionType && actionType.includes('Banimento')) return 'ban';
      return undefined;
    };

    const result = {
      id: log.id.toString(),
      timestamp: new Date(log.timestamp),
      adminName: log.admin_nickname || 'Admin',
      action: 'Alterar' as const,
      target: log.target_nickname || 'Jogador',
      details: getActionDetails(log),
      justification: log.notes || undefined,
      amount: getAmount(log),
      amountType: getAmountType(log) as 'cash' | 'exp' | 'item' | 'ban' | undefined
    };
    
    return result;
  };

  // Usar logs do banco de dados
  const activities = databaseLogs.map(convertLogToActivity);

  const formatTimestamp = (timestamp: Date) => {
    // Validar se o timestamp é válido
    if (!timestamp || isNaN(timestamp.getTime())) {
      return 'Data inválida';
    }

    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    // Se a data for futura ou muito antiga (mais de 365 dias), mostrar data completa
    if (diff < 0 || days > 365) {
      return timestamp.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Para datas recentes (mais de 7 dias), mostrar data completa
    if (days > 7) {
      return timestamp.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    // Para datas muito recentes, mostrar tempo relativo
    if (days > 0) return `${days}d atrás`;
    if (hours > 0) return `${hours}h atrás`;
    if (minutes > 0) return `${minutes}m atrás`;
    return 'Agora';
  };

  return (
    <div
      className="bg-[#111216] rounded-lg border border-black h-full flex flex-col"
      style={{ maxHeight: '100%', overflow: 'hidden' }}
      ref={dropdownRef}
    >
      {/* Header */}
      <div className="p-4 border-b border-black" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-neofara font-medium">
              ÚLTIMAS ATIVIDADES
            </h2>
            <button
              onClick={() => fetchLogs(pagination.page)}
              disabled={isLoading}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Atualizar atividades"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-3">

            {/* GM Selector - Show only for Masters (users with access to GM list) */}
            {user && gmUsers.length > 0 && (
              <div className="relative rounded-lg">
                <button
                  onClick={handleToggleGMDropdown}
                  className="flex items-center border border-black gap-2 bg-[#1d1e24] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className="hidden sm:inline">
                    {selectedGM || 'Todos os GMs'}
                  </span>
                  <span className="sm:hidden">
                    {selectedGM ? selectedGM.substring(0, 8) + '...' : 'GM'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showGMDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showGMDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1d1e24] rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedGM('');
                        setShowGMDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors text-red-400"
                    >
                      Todos os GMs
                    </button>
                    {gmUsers.map((gm) => (
                      <button
                        key={gm.strLNexonID}
                        onClick={() => {
                          setSelectedGM(gm.NickName);
                          setShowGMDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                      >
                        {gm.NickName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={handleTogglePeriodDropdown}
                className="flex items-center border border-black gap-2 bg-[#1d1e24] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
              >
                <span className="hidden sm:inline">
                  {periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod}
                </span>
                <span className="sm:hidden">
                  {selectedPeriod === 'ESTA_SEMANA'
                    ? 'Semana'
                    : selectedPeriod === 'ESTE_MES'
                    ? 'Mês'
                    : selectedPeriod === 'ESTE_ANO'
                    ? 'Ano'
                    : selectedPeriod === 'HOJE'
                    ? 'Hoje'
                    : '7 dias'}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-[#1d1e24] rounded-lg shadow-lg z-10">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => {
                        setSelectedPeriod(period.value);
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Todas as Ações</p>
      </div>

      {/* Activities List with proper scrolling */}
      <div style={{ flex: '1 1 0', minHeight: 0, padding: '16px', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <p className="text-sm">Carregando atividades...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm">Nenhuma atividade registrada</p>
                <p className="text-xs">para o período selecionado</p>
              </div>
            ) : (
              activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center gap-3 p-3 bg-[#1d1e24] rounded-lg hover:bg-[#525252] transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-[#111216] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium">
                      {activity.adminName.includes('-') 
                        ? activity.adminName.split('-')[1]?.substring(0, 2).toUpperCase()
                        : activity.adminName.substring(0, 2).toUpperCase()
                      }
                    </span>
                  </div>

                  {/* Activity Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-1 sm:gap-2">
                      <p className="text-xs sm:text-sm font-medium">{activity.adminName}</p>
                      <p className="text-xs text-gray-400">{activity.details}</p>
                      <p className="text-xs sm:text-sm text-white">{activity.target}</p>
                      {activity.amount && (
                        <p className={`text-xs ${
                          activity.amountType === 'ban' ? 'text-red-400' : 
                          activity.amountType === 'cash' ? 'text-green-400' :
                          activity.amountType === 'exp' ? 'text-blue-400' :
                          'text-yellow-400'
                        }`}>
                          ({activity.amount}{activity.amountType === 'ban' ? '' : ` ${activity.amountType}`})
                        </p>
                      )}
                      {activity.period && (
                        <p className="text-xs text-red-400">({activity.period})</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500 truncate">
                        {activity.justification || 'Sem justificativa'}
                      </p>
                      <p className="text-xs text-gray-400 ml-2 flex-shrink-0">
                        {formatTimestamp(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginação */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="border-t border-black pt-4 pb-2 px-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                {/* Page Info */}
                <span>
                  Página {pagination.page} de {pagination.totalPages}
                  {' '}({((pagination.page - 1) * pagination.pageSize + 1).toLocaleString()} - {Math.min(pagination.page * pagination.pageSize, pagination.total).toLocaleString()} de {pagination.total.toLocaleString()})
                </span>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  {/* Botão Anterior */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || isLoading}
                    className="px-2 py-1 rounded bg-[#1d1e24] hover:bg-[#2a2b30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ←
                  </button>

                  {/* Números de página */}
                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Mostrar apenas algumas páginas (primeira, última, atual e adjacentes)
                      const showPage =
                        pageNumber === 1 ||
                        pageNumber === pagination.totalPages ||
                        (pageNumber >= pagination.page - 1 && pageNumber <= pagination.page + 1);

                      if (!showPage && (pageNumber === 2 || pageNumber === pagination.totalPages - 1)) {
                        return <span key={pageNumber} className="px-1">...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          disabled={isLoading}
                          className={`px-2 py-1 rounded transition-colors ${
                            pageNumber === pagination.page
                              ? 'bg-blue-600 text-white'
                              : 'bg-[#1d1e24] hover:bg-[#2a2b30]'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  {/* Botão Próxima */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || isLoading}
                    className="px-2 py-1 rounded bg-[#1d1e24] hover:bg-[#2a2b30] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;