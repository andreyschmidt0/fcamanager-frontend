import React, { createContext, useContext, useState } from 'react';

export interface Player {
  id: string;
  name: string;
  clan: string;
  discordId: string;
  nexonId: string;
  banStatus: string;
  banEndDate: string | null;
  email: string;
  lastMacAddress: string;
  lastLoginIP: string;
  createDate: string;
  userType: number;
}

interface PlayerContextType {
  selectedPlayer: Player | null;
  setSelectedPlayer: (player: Player | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <PlayerContext.Provider value={{ selectedPlayer, setSelectedPlayer }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};