import React, { useState } from 'react';
import SidebarMenu from '../components/execucoes';
import PlayersList from '../components/listaplayers';
import RecentActivities from '../components/atividadesrecentes';
import { PlayerProvider } from '../contexts/PlayerContext';
import '../index.css';
import '../fonts.css';
import Header from '../components/layout/header';
import Footer from '../components/layout/footer';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState<'execucoes' | 'pendentes'>('execucoes');
  
  return (
    <PlayerProvider>
      <div className="min-h-screen bg-[#1d1e24] text-white">
        <Header />
        {/* Main Content Grid */}
        <main className="p-6">
          <div className="grid grid-cols-12 gap-6">
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
        <Footer/>
      </div>
    </PlayerProvider>
  );
};

export default MainPage;