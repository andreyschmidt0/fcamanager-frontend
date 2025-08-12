import React, { useState } from 'react';

interface SidebarMenuProps {
  activeTab: 'execucoes' | 'pendentes';
  setActiveTab: (tab: 'execucoes' | 'pendentes') => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="bg-[#111216] rounded-lg border border-black p-6 h-fit">
      <div className="space-y-8">
        {/* Execuções Section */}
        <div>
          <button 
            onClick={() => setActiveTab('execucoes')}
            className={`flex items-center gap-2 text-sm font-medium mb-6 ${
              activeTab === 'execucoes' ? 'text-white' : 'text-gray-400'
            } hover:text-white transition-colors`}
          >
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span className="text-lg text-white font-neofara font-medium">EXECUÇÕES</span>
          </button>
          
          {/* Placeholder boxes for execuções */}
          <div className="grid grid-cols-3 gap-4 font-neofara">
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    CONSULTAR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span> 
            </div>
            
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    ENVIAR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    BANIR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    EXCLUIR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
            
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    TRANSFERIR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
            <div className="bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors">
                    <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    ALTERAR
                    <svg 
                        className={`w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-all duration-300`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </div>
          </div>
        </div>

        {/* Atividades Pendentes Section */}
        <div>
          <button 
            onClick={() => setActiveTab('pendentes')}
            className={`flex items-center gap-2 text-sm font-medium mb-6 ${
              activeTab === 'pendentes' ? 'text-white' : 'text-gray-400'
            } hover:text-white transition-colors`}
          >
            <span className="w-2 h-2 bg-white rounded-full"></span>
            <span className="text-lg text-white font-neofara font-medium">ATIVIDADES PENDENTES</span>
          </button>
          
          {/* Placeholder area for pending activities */}
          <div className="bg-[#1d1e24] rounded-lg h-32"></div>
        </div>
      </div>
    </div>
  );
};

export default SidebarMenu;