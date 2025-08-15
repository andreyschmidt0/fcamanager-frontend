import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  action: string;
  target: string;
  justification: string;
}

const RecentActivities: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Esta semana');
  const [showDropdown, setShowDropdown] = useState(false);

  const periods = ['Hoje', 'Esta semana', 'Este mês', 'Este ano'];

  const activities: Activity[] = [
    { id: '1', name: 'GM-Nicki', action: 'Baniu o jogador', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '2', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '3', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '4', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '5', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '6', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
    { id: '7', name: 'GM-Holdana', action: 'Enviou cash para', target: 'Schmidt', justification: 'Justificativa do banimento do player "fal".' },
  ];

  return (
    <div className="bg-[#111216] rounded-lg border border-black">
      {/* Header */}
      <div className="p-4 border-b border-black">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-neofara font-medium">
            ÚLTIMAS ATIVIDADES
          </h2>
          
          {/* Period Selector */}
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-[#1d1e24] px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              {selectedPeriod}
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-[#1d1e24] rounded-lg shadow-lg z-10">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setSelectedPeriod(period);
                      setShowDropdown(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
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

      {/* Activities List */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        <div className="space-y-3">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center gap-3 p-3 bg-[#1d1e24] rounded-lg hover:bg-[#525252] transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-[#111216] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">
                  {activity.name.split('-')[1]?.substring(0, 2).toUpperCase()}
                </span>
              </div>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium">{activity.name}</p>
                  <p className="text-xs text-gray-400">{activity.action}</p>
                  <p className="text-sm text-white">{activity.target}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{activity.justification}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;