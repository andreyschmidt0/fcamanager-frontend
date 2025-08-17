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
  const [mobileView, setMobileView] = useState<'execucoes' | 'players' | 'activities'>('execucoes');
  
  return (
    <PlayerProvider>
      <ClanProvider>
        <div className="h-screen bg-[#1d1e24] text-white flex flex-col overflow-hidden">
          <Header />
          
          {/* Mobile Tab Navigation - Visible only on small screens */}
          <div className="lg:hidden flex justify-around bg-[#111216] border-b border-black p-2">
            <button
              onClick={() => setMobileView('execucoes')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded transition-colors ${
                mobileView === 'execucoes' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              EXECUÇÕES
            </button>
            <button
              onClick={() => setMobileView('players')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded mx-2 transition-colors ${
                mobileView === 'players' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              PLAYERS
            </button>
            <button
              onClick={() => setMobileView('activities')}
              className={`flex-1 py-2 px-2 text-xs font-medium rounded transition-colors ${
                mobileView === 'activities' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ATIVIDADES
            </button>
          </div>

          {/* Main Content - Desktop */}
          <main className="flex-1 overflow-hidden">
            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden lg:grid lg:grid-cols-12 gap-6 h-full p-6">
              {/* Sidebar - Execuções e Atividades Pendentes */}
              <div className="col-span-5 h-full overflow-hidden">
                <SidebarMenu activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              {/* Lista de Players/Clans */}
              <div className="col-span-3 h-full overflow-hidden">
                <PlayersList activeTab={activeTab} />
              </div>

              {/* Últimas Atividades */}
              <div className="col-span-4 h-full overflow-hidden">
                <RecentActivities />
              </div>
            </div>

            {/* Mobile Layout - Visible only on small screens */}
            <div className="lg:hidden h-full overflow-hidden p-4">
              {mobileView === 'execucoes' && (
                <div className="h-full overflow-hidden">
                  <SidebarMenu activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
              )}
              
              {mobileView === 'players' && (
                <div className="h-full overflow-hidden">
                  <PlayersList activeTab={activeTab} />
                </div>
              )}
              
              {mobileView === 'activities' && (
                <div className="h-full overflow-hidden">
                  <RecentActivities />
                </div>
              )}
            </div>
          </main>
        </div>
      </ClanProvider>
    </PlayerProvider>
  );
};

export default MainPage;