import React, { createContext, useContext, useState } from 'react';

export interface Clan {
    clanid: string;
    oidguild: string;
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