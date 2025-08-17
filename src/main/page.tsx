import React, { useState } from 'react';
import SidebarMenu from '../components/execucoes';
import PlayersList from '../components/listaplayers';
import RecentActivities from '../components/atividadesrecentes';
import { PlayerProvider } from '../contexts/PlayerContext';
import { ClanProvider } from '../contexts/ClanContext';
import '../index.css';
import '../fonts.css';
import Header from '../components/layout/header';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState<'execucoes' | 'pendentes'>('execucoes');
  
  return (
    <PlayerProvider>
      <ClanProvider>
        <div className="h-screen bg-[#1d1e24] text-white flex flex-col">
          <Header />
          {/* Main Content Grid */}
          <main className="flex-1 p-6">
            <div className="grid grid-cols-12 gap-6 h-full">
              {/* Sidebar - Execuções e Atividades Pendentes */}
              <div className="col-span-5">
                <SidebarMenu activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              {/* Lista de Players/Clans */}
              <div className="col-span-3">
                <PlayersList activeTab={activeTab} />
              </div>

              {/* Últimas Atividades */}
              <div className="col-span-4">
                <RecentActivities />
              </div>
            </div>
          </main>
        </div>
      </ClanProvider>
    </PlayerProvider>
  );
};

export default MainPage;