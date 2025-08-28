import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ImageOff, Import } from 'lucide-react';
import BanModal from './modal/banmodal';
import UnbanModal from './modal/unbanmodal';
import { usePlayer } from '../contexts/PlayerContext';
import ConsultBanHistory from './modal/consultbanhistory';
import SendItem from './modal/senditem';
import ConsultInventory from './modal/consultinventory';
import ConsultInbox from './modal/consultinbox';
import ConsultItem from './modal/consultitem';
import ChangeNickname from './modal/changenickname';
import ChangeEmail from './modal/changeemail';
import RemoveExp from './modal/removeexp';
import RemoveClan from './modal/removeclan';
import SendCash from './modal/sendcash';
import TransferClan from './modal/transferclan';
import TransferDiscord from './modal/transferdiscord';
import ChangePassword from './modal/changepassword';

interface SidebarMenuProps {
  activeTab: 'execucoes' | 'pendentes';
  setActiveTab: (tab: 'execucoes' | 'pendentes') => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeTab, setActiveTab }) => {
  const { selectedPlayer } = usePlayer();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedAction, setSelectedAction] = useState<{ category: string; option: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpenDropdown(null);
        return;
      }
      
      if (openDropdown) {
        const activeDropdown = document.querySelector(`[data-dropdown="${openDropdown}"]`);
        
        if (activeDropdown && !activeDropdown.contains(target)) {
          const activeButton = document.querySelector(`[data-button="${openDropdown}"]`);
          if (!activeButton || !activeButton.contains(target)) {
            setOpenDropdown(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const toggleDropdown = (buttonName: string) => {
    setOpenDropdown(openDropdown === buttonName ? null : buttonName);
  };

  const handleOptionClick = (category: string, option: string) => {
    setSelectedAction({ category, option });
    setIsModalOpen(true);
    setOpenDropdown(null);
  };
  
  const getBanOptions = () => {
    if (!selectedPlayer) {
      return ['Banir Player', 'Desbanir Player'];
    }
    
    if (selectedPlayer.banStatus === 'Sim') {
      return ['Desbanir Player'];
    } else {
      return ['Banir Player'];
    }
  };

  const actionButtons = [
    { name: 'CONSULTAR', options: ['Consultar Item', 'Consultar Histórico de Ban', 'Consultar Inventário', 'Consultar Inbox'] },
    { name: 'ENVIAR', options: ['Enviar Cash', 'Enviar Item'] },
    { name: 'BANIR', options: getBanOptions() },
    { name: 'EXCLUIR', options: ['Remover Clã', 'Remover Exp'] },
    { name: 'TRANSFERIR', options: ['Transferir Clã', 'Transferir Discord'] },
    { name: 'ALTERAR', options: ['Alterar Nickname', 'Alterar Email', 'Alterar Senha'] }
  ];
  
  return (
    <div ref={containerRef} className="bg-[#111216] rounded-lg border border-black h-full flex flex-col" style={{ maxHeight: '100%', overflow: 'hidden' }}>
      <div style={{ flex: '1 1 0', minHeight: 0, padding: '24px', overflow: 'hidden' }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
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
                <span className="text-base sm:text-lg text-white font-neofara font-medium">EXECUÇÕES</span>
              </button>
              
              {/* Action buttons grid - Responsive */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-neofara">
                {actionButtons.map((button) => (
                  <div key={button.name} className="relative">
                    <button 
                      onClick={() => toggleDropdown(button.name)}
                      data-button={button.name}
                      className="w-full bg-[#1d1e24] rounded-lg h-[60px] sm:h-[70px] md:h-[80px] hover:bg-[#525252] transition-colors"
                    >
                      <span className="text-sm sm:text-base md:text-xl text-white font-medium flex justify-center items-center h-full gap-1 sm:gap-2 px-2">
                        <span className="truncate">{button.name}</span>
                        <ChevronDown 
                          size={14} 
                          className={`transition-transform flex-shrink-0 ${openDropdown === button.name ? 'rotate-180' : ''}`} 
                        />
                      </span>
                    </button>
                    
                    {openDropdown === button.name && (
                      <div 
                        data-dropdown={button.name}
                        className="absolute top-full left-0 mt-2 w-full bg-[#1d1e24] rounded-lg shadow-lg z-10 min-w-[150px] sm:min-w-[180px] md:min-w-[200px]"
                      >
                        {button.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              handleOptionClick(button.name, option)
                            }}
                            className="block w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-md sm:text-sm md:text-[16px] tracking-wide text-white hover:bg-[#525252] transition-colors first:rounded-t-lg last:rounded-b-lg"
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
                <span className="text-base sm:text-lg text-white font-neofara font-medium">ATIVIDADES PENDENTES</span>
              </button>
              
              {/* Placeholder area for pending activities */}
              <div className="bg-[#1d1e24] rounded-lg h-24 sm:h-28 md:h-32"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && selectedAction && selectedAction.option === 'Banir Player' && (
        <BanModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Desbanir Player' && (
        <UnbanModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Histórico de Ban' && (
        <ConsultBanHistory 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Enviar Item' && (
        <SendItem 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Inventário' && (
        <ConsultInventory 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Inbox' && (
        <ConsultInbox 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Item' && (
        <ConsultItem 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar Nickname' && (
        <ChangeNickname 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar Email' && (
        <ChangeEmail 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Remover Exp' && (
        <RemoveExp 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Remover Clã' && (
        <RemoveClan 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Enviar Cash' && (
        <SendCash 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Transferir Clã' && (
        <TransferClan
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />  
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Transferir Discord' && (
        <TransferDiscord
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />  
      )}
            {isModalOpen && selectedAction && selectedAction.option === 'Alterar Senha' && (
        <ChangePassword
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />  
      )}

    </div>
  );
};

export default SidebarMenu;