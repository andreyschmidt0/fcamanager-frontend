import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useActivityLog, ActivityLog } from '../contexts/ActivityLogContext';


const RecentActivities: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Esta semana');
  const [showDropdown, setShowDropdown] = useState(false);
  const { getActivitiesByPeriod } = useActivityLog();

  const periods = ['Hoje', 'Esta semana', 'Este mês', 'Este ano'];
  const activities = getActivitiesByPeriod(selectedPeriod);

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
    <div className="bg-[#111216] rounded-lg border border-black h-full flex flex-col" style={{ maxHeight: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="p-4 border-b border-black" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-neofara font-medium">
            ÚLTIMAS ATIVIDADES
          </h2>
          
          {/* Period Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-[#1d1e24] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
            >
              <span className="hidden sm:inline">{selectedPeriod}</span>
              <span className="sm:hidden">
                {selectedPeriod === 'Esta semana' ? 'Semana' : 
                 selectedPeriod === 'Este mês' ? 'Mês' : 
                 selectedPeriod === 'Este ano' ? 'Ano' : 'Hoje'}
              </span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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