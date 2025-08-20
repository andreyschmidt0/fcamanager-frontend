import React, { createContext, useContext, useState } from 'react';

export interface Clan {
  strName: string;
  oidGuild: number;
  dn_strCharacterName_master: string;
  oidUser_master: number;
  dateCreated: string;
  dn_n4TotalRegularMember: number;
  master_strDiscordID: string;
}

interface ClanContextType {
  selectedClan: Clan | null;
  setSelectedClan: (Clan: Clan | null) => void;
}

const ClanContext = createContext<ClanContextType | undefined>(undefined);

export const ClanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null);

  return (
    <ClanContext.Provider value={{ selectedClan, setSelectedClan }}>
      {children}
    </ClanContext.Provider>
  );
};

export const useClan = () => {
  const context = useContext(ClanContext);
  if (context === undefined) {
    throw new Error('useClan must be used within a ClanProvider');
  }
  return context;
};