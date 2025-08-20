import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActivityLog, ActivityLog } from '../contexts/ActivityLogContext';
import { useAuth } from '../hooks/useAuth';


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
  const { getActivitiesByPeriod } = useActivityLog();
  const { user } = useAuth();

  const periods = ['Hoje', 'Esta semana', 'Este mês', 'Este ano'];
  
  const [isXMagnata, setIsXMagnata] = useState(false);
  
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

  // Buscar GMs quando usuário é Magnata
  useEffect(() => {
    if (user?.profile?.nickname === 'Magnata') {
      fetchGMUsers();
    }
  }, [user?.profile?.nickname]);

  const fetchGMUsers = async () => {
    try {
      // Primeiro buscar o Discord ID do usuário logado
      const profileResponse = await fetch(`http://localhost:3000/api/users/profile/${encodeURIComponent(user?.profile?.nickname || '')}`);
      if (!profileResponse.ok) {
        setIsXMagnata(false);
        return;
      }
      
      const profileData = await profileResponse.json();
      const discordId = profileData.strDiscordID;
      
      // Agora tentar buscar GMs usando o Discord ID
      const response = await fetch(`http://localhost:3000/api/users/gms?discordId=${encodeURIComponent(discordId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthorized) {
          setIsXMagnata(true);
          setGMUsers(data.gmUsers);
        }
      } else {
        setIsXMagnata(false);
      }
    } catch (error) {
      console.error('Erro ao buscar GMs:', error);
      setIsXMagnata(false);
    }
  };

  // Filtrar atividades por GM selecionado
  const allActivities = getActivitiesByPeriod(selectedPeriod);
  const activities = selectedGM 
    ? allActivities.filter(activity => activity.adminName === selectedGM)
    : allActivities;

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
          <h2 className="text-lg font-neofara font-medium">
            ÚLTIMAS ATIVIDADES
          </h2>
          <div className="flex items-center gap-3">

            {/* GM Selector - Only for xMagnata */}
            {isXMagnata && (
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
            {activities.length === 0 ? (
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
                        <p className="text-xs text-green-400">({activity.amount} {activity.amountType})</p>
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