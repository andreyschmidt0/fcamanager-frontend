import React, { useState } from 'react';
import SidebarMenu from '../components/sidebar';
import PlayersList from '../components/playerlist';
import RecentActivities from '../components/RecentActivities';
import '../index.css';
import '../fonts.css';
import Header from '../components/layout/header';
import Footer from '../components/layout/footer';

const MainPage = () => {
  const [activeTab, setActiveTab] = useState<'execucoes' | 'pendentes'>('execucoes');
  
  return (
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
      <Footer />
    </div>
  );
};

export default MainPage;