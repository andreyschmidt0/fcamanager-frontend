import React, { useState } from 'react';

export interface Player {
  id: string;
  name: string;
  clan: string;
}

export interface Clan {
  id: string;
  name: string;
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

  const clans: Clan[] = [
    { id: '1', name: '[ELITE] Elite Squad' },
    { id: '2', name: '[BR] Brasil Force' },
    { id: '3', name: '[PRO] Professional Gaming' },
    { id: '4', name: '[NJA] Ninja Clan' },
    { id: '5', name: '[STORM] Storm Troopers' },
  ];

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);
  const [viewMode, setViewMode] = useState<'players' | 'clans'>('players');
  const [search, setSearch] = useState<string>('');
  return (
    <>
      <div className="bg-[#111216] rounded-lg border border-black">
        {/* Header */}
        <div className="p-4">
          <h2 className="text-lg font-neofara font-medium">
            LISTAR PLAYERS/ CLANS
          </h2>
        </div>    

        <input onChange={(e) => setSearch(e.target.value)} value={search} type="search" placeholder="Pesquisar" className="w-[80%] bg-[#1d1e24] rounded-lg p-2 flex justify-center items-center" />

        {/* Toggle Buttons */}
        <div className="p-4 flex gap-2">
          <button 
            onClick={() => setViewMode('players')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'players' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
            }`}
          >
            PLAYERS
          </button>
          <button 
            onClick={() => setViewMode('clans')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'clans' 
                ? 'bg-blue-600 text-white' 
                : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
            }`}
          >
            CLANS
          </button>
        </div>

        {/* Players List */}
        {viewMode === 'players' && (
          <div className="p-4">
            <div className="space-y-2">
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className="bg-[#1d1e24] rounded-lg p-3 hover:bg-[#525252] transition-colors cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {player.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{player.name}</p>
                        <p className="text-sm text-green-500 font-medium">{player.clan}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clans List */}
        {viewMode === 'clans' && (
          <div className="p-4">
            <div className="space-y-2">
              {clans.map((clan) => (
                <div 
                  key={clan.id} 
                  className="bg-[#1d1e24] rounded-lg p-3 hover:bg-[#525252] transition-colors cursor-pointer"
                  onClick={() => setSelectedClan(clan)}
                >
                  <div className="flex items-center gap-4">
                    {/* Clan Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {clan.name.substring(1, 3).toUpperCase()}
                      </span>
                    </div>

                    {/* Clan Info */}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{clan.name}</p>
                        <p className="text-sm text-blue-400 font-medium">
                          {players.filter(p => p.clan === clan.name).length} membros
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Player Popup - Fixed position at bottom left */}
      {selectedPlayer && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-[#111216] border border-gray-600 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
            {/* Close button */}
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
            >
              ×
            </button>
            
            {/* Player details */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {selectedPlayer.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{selectedPlayer.name}</h3>
                <p className="text-green-500 text-xs">{selectedPlayer.clan}</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors">
                Ver Informações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clan Popup - Fixed position at bottom left */}
      {selectedClan && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-[#111216] border border-gray-600 rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
            {/* Close button */}
            <button 
              onClick={() => setSelectedClan(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
            >
              ×
            </button>
            
            {/* Clan details */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {selectedClan.name.substring(1, 3).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{selectedClan.name}</h3>
                <p className="text-blue-400 text-xs">
                  {players.filter(p => p.clan === selectedClan.name).length} membros
                </p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-2">
              <button className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-2 px-3 rounded transition-colors">
                Ver Membros
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors">
                Solicitar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlayersList;