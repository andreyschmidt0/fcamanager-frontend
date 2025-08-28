import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useActivityLog, ActivityLog } from '../contexts/ActivityLogContext';
import { useAuth } from '../hooks/useAuth';
import { useGMRole } from '../hooks/useGMRole';
import apiService from '../services/api-tauri.service';


interface GMUser {
  NickName: string;
  strDiscordID: string;
  strLNexonID: string;
}

const RecentActivities: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Esta semana');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedGM, setSelectedGM] = useState<string>('');
  const [showGMDropdown, setShowGMDropdown] = useState(false);
  const [gmUsers, setGMUsers] = useState<GMUser[]>([]);
  const [databaseLogs, setDatabaseLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getActivitiesByPeriod } = useActivityLog();
  const { user } = useAuth();
  const { isMaster, loading } = useGMRole();

  const periods = ['Hoje', 'Esta semana', 'Este mês', 'Este ano'];
  
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

  // Buscar GMs quando usuário é Master
  useEffect(() => {
    if (isMaster && !loading) {
      fetchGMUsers();
    }
  }, [isMaster, loading]);

  // Buscar logs quando período, GM mudar, ou quando isMaster/loading mudarem
  useEffect(() => {
    fetchLogs();
  }, [selectedPeriod, selectedGM, isMaster, loading]);

  const fetchLogs = async () => {
    if (!isMaster || loading) {
      return;
    }

    setIsLoading(true);
    try {
      // Primeiro buscar o Discord ID do usuário logado
      const profileData = await apiService.getPlayerProfile(user?.profile?.nickname || '');
      if (!profileData) {
        throw new Error('Erro ao obter perfil do administrador');
      }
      
      const currentUserDiscordId = profileData.strDiscordID;

      const logs = await apiService.getLogs(selectedPeriod, selectedGM || undefined, 1000, currentUserDiscordId);

      setDatabaseLogs(logs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setDatabaseLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGMUsers = async () => {
    try {
      // Primeiro buscar o Discord ID do usuário logado
      const profileData = await apiService.getPlayerProfile(user?.profile?.nickname || '');
      if (!profileData) {
        return;
      }
      
      const discordId = profileData.strDiscordID;
      
      // Agora tentar buscar GMs usando o Discord ID
      const data = await apiService.getGMList(discordId);
      if (data && data.isAuthorized) {
        setGMUsers(data.gms || data.gmUsers || []);
      }
    } catch (error) {
      console.error('Erro ao buscar GMs:', error);
    }
  };

  // Converter logs do banco para o formato do componente
  const convertLogToActivity = (log: any): ActivityLog => {
    const getActionDetails = (action: string, log: any) => {
      switch (action) {
        case 'change_nickname':
          return `alterou nickname de "${log.old_value}" para "${log.new_value}"`;
        case 'change_email':
          return `alterou email de "${log.old_value}" para "${log.new_value}"`;
        case 'remove_clan':
          // old_value está no formato "ID|Nome"
          const clanInfo = log.old_value ? log.old_value.split('|') : ['', ''];
          const clanId = clanInfo[0] || '';
          const clanName = clanInfo[1] || log.target_nickname || 'Clã desconhecido';
          return `Removeu clã ${clanId} ${clanName}`;
        case 'remove_exp':
          const oldExp = parseInt(log.old_value) || 0;
          const newExp = parseInt(log.new_value) || 0;
          const removedExp = oldExp - newExp;
          return `Removeu ${removedExp} de EXP de`;
        case 'send_cash':
          const oldCash = parseInt(log.old_value) || 0;
          const newCash = parseInt(log.new_value) || 0;
          const sentCash = newCash - oldCash;
          return `Enviou ${sentCash} de Cash para`;
        case 'send_item':
          const itemInfo = log.new_value; // Ex: "5x 1001"
          return `Enviou ${itemInfo} para`;
        case 'ban_user':
          return `Baniu`;
        case 'unban_user':
          return `Desbaniu`;
        case 'transfer_clan':
          return `Transferiu clã para ${log.target_nickname || 'Jogador'}`;
        default:
          return `Ação em`;
      }
    };

    const getAmount = (action: string, log: any) => {
      switch (action) {
        case 'send_cash':
          const oldCash = parseInt(log.old_value) || 0;
          const newCash = parseInt(log.new_value) || 0;
          return newCash - oldCash;
        case 'remove_exp':
          const oldExp = parseInt(log.old_value) || 0;
          const newExp = parseInt(log.new_value) || 0;
          return oldExp - newExp;
        case 'send_item':
          // Extrair quantidade do formato "5x 1001"
          const itemMatch = log.new_value?.match(/^(\d+)x/);
          return itemMatch ? parseInt(itemMatch[1]) : undefined;
        case 'ban_user':
          // Extrair duração do banimento do new_value
          const banDuration = log.new_value;
          if (banDuration === '999') {
            return 'permanente';
          } else if (banDuration && !isNaN(banDuration)) {
            return `${banDuration} dias`;
          }
          return undefined;
        case 'change_nickname':
        case 'change_email':
        case 'transfer_clan':
          return undefined; // Não precisam de amount pois já está na details
        default:
          return undefined;
      }
    };

    const getAmountType = (action: string) => {
      switch (action) {
        case 'send_cash': return 'cash';
        case 'remove_exp': return 'exp';
        case 'send_item': return 'item';
        case 'ban_user': return 'ban';
        case 'change_nickname':
        case 'change_email':
        case 'transfer_clan':
          return undefined; // Não precisam de amountType
        default: return undefined;
      }
    };

    const result = {
      id: log.id.toString(),
      timestamp: new Date(log.timestamp),
      adminName: log.admin_nickname || 'Admin',
      action: 'Alterar' as const,
      target: log.target_nickname || 'Jogador',
      details: getActionDetails(log.action, log),
      justification: log.notes || undefined,
      amount: getAmount(log.action, log),
      amountType: getAmountType(log.action) as 'cash' | 'exp' | 'item' | 'ban' | undefined
    };
    
    return result;
  };

  // Usar logs do banco de dados
  const activities = databaseLogs.map(convertLogToActivity);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

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
              onClick={fetchLogs}
              disabled={isLoading}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Atualizar atividades"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-center gap-3">

            {/* GM Selector - Only for Masters */}
            {isMaster && !loading && (
              <div className="relative rounded-lg">
                <button
                  onClick={handleToggleGMDropdown}
                  className="flex items-center gap-2 bg-[#1d1e24] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className="hidden sm:inline">
                    {selectedGM || 'Selecionar um GM'}
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
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors text-gray-400"
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
                className="flex items-center gap-2 bg-[#1d1e24] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
              >
                <span className="hidden sm:inline">{selectedPeriod}</span>
                <span className="sm:hidden">
                  {selectedPeriod === 'Esta semana'
                    ? 'Semana'
                    : selectedPeriod === 'Este mês'
                    ? 'Mês'
                    : selectedPeriod === 'Este ano'
                    ? 'Ano'
                    : 'Hoje'}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-32 sm:w-40 bg-[#1d1e24] rounded-lg shadow-lg z-10">
                  {periods.map((period) => (
                    <button
                      key={period}
                      onClick={() => {
                        setSelectedPeriod(period);
                        setShowDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {period}
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
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;