import React, { useState, useEffect } from 'react';
import '../index.css';
import { X, Search, Copy, User as UserIcon, Hash } from 'lucide-react';
import listUsers, { User, listUsersByDiscordId } from '../api/listusers';
import listClans, { Clans as ApiClan, Clans } from '../api/listclans';
import { usePlayer } from '../contexts/PlayerContext';
import { useClan } from '../contexts/ClanContext';

export interface Player {
  id: string;
  name: string;
  clan: string;
  discordId: string;
  nexonId: string;
  banStatus: string;
  banEndDate: string | null;
}

export interface Clan {
  name: string;
  leader: string;
  leaderDiscordId: string;
  memberCount: number;
  oidGuild: number;
  oidUser_Lider: number;
}


interface PlayersListProps {
  activeTab: 'execucoes' | 'pendentes';
}


const PlayersList: React.FC<PlayersListProps> = ({ activeTab }) => {
  const { selectedPlayer, setSelectedPlayer } = usePlayer();
  const { selectedClan, setSelectedClan } = useClan();
  const [viewMode, setViewMode] = useState<'players' | 'clans'>('players');
  const [searchMode, setSearchMode] = useState<'nickname' | 'discordid'>('nickname');
  const [search, setSearch] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>('');

  const copyToClipboard = (discordId: string) => {
    navigator.clipboard.writeText(discordId).then(() => {
      setCopiedId(discordId);
      setTimeout(() => setCopiedId(''), 2000); // Remove feedback after 2 seconds
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Função para buscar players
  const searchPlayers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setPlayers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      let users: User[] = [];
      
      if (searchMode === 'nickname') {
        users = await listUsers(searchTerm);
      } else {
        users = await listUsersByDiscordId(searchTerm);
      }
      
      const mappedPlayers: Player[] = users.map((user: User) => ({
        id: `${user.strDiscordID}-${user.strNexonID}`, // Unique ID combining Discord + Nexon
        name: user.NickName,
        clan: user.clanName || 'Sem Clan',
        discordId: user.strDiscordID,
        nexonId: user.strNexonID,
        banStatus: user.BanVigente,
        banEndDate: user.DataFimBan
      }));
      setPlayers(mappedPlayers);
      setHasSearched(true);
    } catch (error) {
      console.error('Erro ao buscar players:', error);
      setPlayers([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar clans
  const searchClans = async (clanname: string) => {
    if (!clanname.trim()) {
      setClans([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const apiClans: Clans[] = await listClans(clanname);
      const mappedClans: Clan[] = apiClans.map((clan: Clans) => ({
        name: clan.nm_clan,
        leader: clan.Lider,
        leaderDiscordId: clan.DiscordID_Lider,
        memberCount: clan.qt_membros,
        oidGuild: clan.oidGuild,
        oidUser_Lider: clan.oidUser_Lider
      }));
      setClans(mappedClans);
      setHasSearched(true);
    } catch (error) {
      console.error('Erro ao buscar clans:', error);
      setClans([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  // Debounce para busca
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (viewMode === 'players') {
        searchPlayers(search);
      } else {
        searchClans(search);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [search, viewMode, searchMode]);

  // Limpar resultados ao trocar de modo
  useEffect(() => {
    setPlayers([]);
    setClans([]);
    setHasSearched(false);
    setSelectedPlayer(null);
    setSelectedClan(null);
    
    // Se já tem algo digitado, buscar automaticamente
    if (search.trim()) {
      if (viewMode === 'players') {
        searchPlayers(search);
      } else {
        searchClans(search);
      }
    }
  }, [viewMode, searchMode]);

  return (
    <>
      <div className="bg-[#111216] rounded-lg border border-black h-full flex flex-col">
        {/* Header */}
        <div className="p-4">
          <h2 className="text-lg font-neofara font-medium">
            LISTAR PLAYERS/ CLANS
          </h2>
        </div>    

        {/* Search Mode Toggle - Only for Players */}
        {viewMode === 'players' && (
          <div className="px-4 pb-2">
            <div className="flex gap-2">
              <button 
                onClick={() => setSearchMode('nickname')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'nickname' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
                }`}
              >
                <UserIcon size={16} />
                Nickname
              </button>
              <button 
                onClick={() => setSearchMode('discordid')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'discordid' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
                }`}
              >
                <Hash size={16} />
                Discord ID
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input 
              onChange={(e) => setSearch(e.target.value)} 
              value={search} 
              type="search" 
              placeholder={
                viewMode === 'players' 
                  ? (searchMode === 'nickname' ? "Digite o nickname do player..." : "Digite o Discord ID...")
                  : "Digite o nickname do clan..."
              } 
              className="w-full bg-[#1d1e24] rounded-lg p-3 pl-10 text-white placeholder-gray-400 border border-gray-600 focus:border-green-500 focus:outline-none transition-colors" 
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="p-4 flex gap-2">
          <button 
            onClick={() => setViewMode('players')}
            className={`flex-1 py-2 px-4 rounded-lg text-lg font-medium transition-colors font-neofara ${
              viewMode === 'players' 
                ? 'bg-green-600 text-white' 
                : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
            }`}
          >
            PLAYERS
          </button>
          <button 
            onClick={() => setViewMode('clans')}
            className={`flex-1 py-2 px-4 rounded-lg text-lg font-medium transition-colors font-neofara ${
              viewMode === 'clans' 
                ? 'bg-green-600 text-white' 
                : 'bg-[#1d1e24] text-gray-300 hover:bg-[#525252]'
            }`}
          >
            CLANS
          </button>
        </div>

        {/* Players List */}
        {viewMode === 'players' && (
          <div className="p-4 flex-1 overflow-hidden">
            <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
              {!hasSearched && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Search size={48} className="mb-4" />
                  <p className="text-lg">Digite um nickname para buscar</p>
                  <p className="text-sm">Os resultados aparecerão aqui</p>
                </div>
              )}
              
              {hasSearched && !loading && players.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <X size={48} className="mb-4" />
                  <p className="text-lg">Nenhum player encontrado</p>
                  <p className="text-sm">Tente buscar por outro nickname</p>
                </div>
              )}
              
              {players.map((player) => (
                <div 
                  key={player.id} 
                  className={`rounded-lg p-3 transition-colors cursor-pointer ${
                    selectedPlayer?.id === player.id 
                      ? 'bg-green-600/20 border border-green-500/50' 
                      : 'bg-[#1d1e24] hover:bg-[#525252]'
                  }`}
                  onClick={() => {
                    setSelectedPlayer(player);
                    setSelectedClan(null);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-[#111216] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {player.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{player.name}</p>
                        <p className="text-xs text-gray-400 font-medium">{player.clan}</p>
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
          <div className="p-4 flex-1 overflow-hidden">
            <div className="space-y-2 h-full overflow-y-auto custom-scrollbar">
              {!hasSearched && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Search size={48} className="mb-4" />
                  <p className="text-lg">Digite um nickname para buscar</p>
                  <p className="text-sm">Os clans aparecerão aqui</p>
                </div>
              )}
              
              {hasSearched && !loading && clans.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <X size={48} className="mb-4" />
                  <p className="text-lg">Nenhum clan encontrado</p>
                  <p className="text-sm">Tente buscar por outro nickname</p>
                </div>
              )}
              
              {clans.map((clan) => (
                <div 
                  key={clan.oidGuild} 
                  className={`rounded-lg p-3 transition-colors cursor-pointer ${
                    selectedClan?.oidGuild === clan.oidGuild 
                      ? 'bg-green-600/20 border border-green-500/50' 
                      : 'bg-[#1d1e24] hover:bg-[#525252]'
                  }`}
                  onClick={() => {
                    setSelectedClan(clan);
                    setSelectedPlayer(null);
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Clan Avatar */}
                    <div className="w-10 h-10 bg-[#111216] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {clan.name.substring(1, 3).toUpperCase()}
                      </span>
                    </div>

                    {/* Clan Info */}
                    <div className="flex-1 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{clan.name}</p>
                        <p className="text-xs text-gray-400 font-medium">
                          {clan.memberCount} membro(s)
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          Líder: {clan.leader}
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
          <div className="bg-[#111216] border border-black rounded-lg shadow-lg p-4 min-w-[280px] max-w-[320px]">
            {/* Close button */}
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white text-xl leading-none"
            >
              <X size={20} />
            </button>
            
            {/* Player details */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                <p className="text-sm font-bold text-white">
                  {selectedPlayer.name.substring(0, 2).toUpperCase()}
                </p>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{selectedPlayer.name}</h3>
                <p className="text-gray-300 text-xs">{selectedPlayer.clan}</p>
                <div className="flex items-center gap-2">
                  <p className="text-gray-300 text-xs">Discord: {selectedPlayer.discordId}</p>
                  <button
                    onClick={() => copyToClipboard(selectedPlayer.discordId)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Copy Discord ID"
                  >
                    <Copy size={12} />
                  </button>
                  {copiedId === selectedPlayer.discordId && (
                    <span className="text-green-400 text-xs">Copied!</span>
                  )}
                </div>
                <p className="text-gray-300 text-xs">Nexon: {selectedPlayer.nexonId}</p>
                {selectedPlayer.banStatus === 'Sim' && (
                  <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded">
                    <p className="text-red-400 text-xs font-semibold">🚫 PLAYER BANIDO</p>
                    {selectedPlayer.banEndDate && (
                      <p className="text-red-300 text-xs">Até: {new Date(selectedPlayer.banEndDate).toLocaleDateString()}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-2">
              <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold text-sm h-8 px-3 rounded transition-colors flex items-center justify-center">
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
              <X size={20} /> 
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
                  {selectedClan.memberCount} membros
                </p>
                <p className="text-gray-400 text-xs">
                  Líder: {selectedClan.leader}
                </p>
                <p className="text-gray-500 text-xs">
                  Discord: {selectedClan.leaderDiscordId}
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