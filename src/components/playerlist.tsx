import React, { useState } from 'react';

interface Player {
  id: string;
  name: string;
  clan: string;
}

interface PlayersListProps {
  activeTab: 'execucoes' | 'pendentes';
}



const PlayersList: React.FC<PlayersListProps> = ({ activeTab }) => {
  // Dados mockados - Players e seus respectivos clans
  const players: Player[] = [
    { id: '1', name: 'xXSniperEliteXx', clan: '[ELITE] Elite Squad' },
    { id: '2', name: 'DarkShadow92', clan: '[BR] Brasil Force' },
    { id: '3', name: 'ProGamer2024', clan: '[PRO] Professional Gaming' },
    { id: '4', name: 'NinjaWarrior', clan: '[NJA] Ninja Clan' },
    { id: '5', name: 'ThunderBolt', clan: '[STORM] Storm Troopers' },
    { id: '6', name: 'IceQueen', clan: '[ICE] Frozen Legion' },
    { id: '7', name: 'FireDragon', clan: '[FIRE] Fire Nation' },
    { id: '8', name: 'GhostRider', clan: '[GHOST] Phantom Force' },
    { id: '9', name: 'CyberPunk2077', clan: '[CYBER] Cyber Warriors' },
    { id: '10', name: 'AlphaWolf', clan: '[WOLF] Wolf Pack' },
    { id: '11', name: 'ShadowHunter', clan: '[HUNT] Hunters Guild' },
    { id: '12', name: 'BladeRunner', clan: '[BLADE] Blade Masters' },
  ];

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
console.log(selectedPlayer?.name);
  
const [playerList, setPlayerList] = useState<Player[]>(players);
const [clanList, setClanList] = useState<Player[]>(players);
const [playerSearch, setPlayerSearch] = useState<string>('');
const [clanSearch, setClanSearch] = useState<string>('');

  return (
    <div className="bg-[#111216] rounded-lg border border-black">
      {/* Header */}
      <div className="p-4">
        <h2 className="text-lg font-neofara font-medium">
          LISTAR PLAYERS/ CLANS
        </h2>
      </div>    

      {/* Players List */}
      <div className="p-4">
        <div className="space-y-2">
          {players.map((player) => (
            <div 
              key={player.id} 
              className="bg-[#1d1e24] rounded-lg p-3 hover:bg-[#525252] transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {player.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Player Info */}
                <div onClick={() => setSelectedPlayer(player)} className="flex-1 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white cursor-pointer">{player.name}</p>
                    <p className="text-sm text-green-500 font-medium">{player.clan}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayersList;