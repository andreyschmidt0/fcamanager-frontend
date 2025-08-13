import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import BanPlayerModal from './modal/banplayermodal';

interface SidebarMenuProps {
  activeTab: 'execucoes' | 'pendentes';
  setActiveTab: (tab: 'execucoes' | 'pendentes') => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeTab, setActiveTab }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAction, setSelectedAction] = useState<{ category: string; option: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (buttonName: string) => {
    setOpenDropdown(openDropdown === buttonName ? null : buttonName);
  };

  const handleOptionClick = (category: string, option: string) => {
    setSelectedAction({ category, option });
    setIsModalOpen(true);
    setOpenDropdown(null);
  };
  
  const actionButtons = [
    { name: 'CONSULTAR', options: ['Consultar Jogador', 'Consultar Item', 'Consultar Histórico'] },
    { name: 'ENVIAR', options: ['Enviar Cash', 'Enviar Item', 'Enviar Mensagem'] },
    { name: 'BANIR', options: ['Banir Temporário', 'Banir Permanente', 'Banir IP'] },
    { name: 'EXCLUIR', options: ['Excluir Conta', 'Excluir Item', 'Excluir Personagem'] },
    { name: 'TRANSFERIR', options: ['Transferir Cash', 'Transferir Item', 'Transferir Personagem'] },
    { name: 'ALTERAR', options: ['Alterar Nome', 'Alterar Level', 'Alterar Rank'] }
  ];
  
  return (
    <div ref={containerRef} className="bg-[#111216] rounded-lg border border-black p-6 h-fit">
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
          
          {/* Action buttons grid */}
          <div className="grid grid-cols-3 gap-4 font-neofara">
            {actionButtons.map((button) => (
              <div key={button.name} className="relative">
                <button 
                  onClick={() => toggleDropdown(button.name)}
                  className="w-full bg-[#1d1e24] rounded-lg h-[80px] hover:bg-[#525252] transition-colors"
                >
                  <span className="text-xl text-white font-medium flex justify-center items-center h-full gap-2">
                    {button.name}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${openDropdown === button.name ? 'rotate-180' : ''}`} 
                    />
                  </span>
                </button>
                
                {openDropdown === button.name && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#1d1e24] rounded-lg shadow-lg z-10 min-w-[200px]">
                    {button.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          handleOptionClick(button.name, option)
                        }}
                        className="block w-full text-left px-4 py-3 text-md tracking-wide text-white hover:bg-[#525252] transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {option} 
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
            {isModalOpen && selectedAction && (
              <BanPlayerModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`${selectedAction.category} - ${selectedAction.option}`}
                category={selectedAction.category}
                option={selectedAction.option}
                />
            )}
      </div>
  );
};

export default SidebarMenu;