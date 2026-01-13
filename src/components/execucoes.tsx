import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ImageOff, Import } from 'lucide-react';
import BanModal from './modal/banmodal';
import UnbanModal from './modal/unbanmodal';
import { usePlayer } from '../contexts/PlayerContext';
import ConsultBanHistory from './modal/consultbanhistory';
import ConsultDonationHistory from './modal/consultdonationhistory';
import SendItem from './modal/senditem';
import ConsultInventory from './modal/consultinventory';
import ConsultInbox from './modal/consultinbox';
import ConsultItem from './modal/consultitem';
import ConsultBoxes from './modal/consultboxes';
import ConsultCampItems from './modal/consultcampitems';
import ConsultFireteamBlacklist from './modal/consultfireteamblacklist';
import ChangeNickname from './modal/changenickname';
import ChangeEmail from './modal/changeemail';
import ChangeLogin from './modal/changelogin';
import RemoveExp from './modal/removeexp';
import RemoveClan from './modal/removeclan';
import RemoveClanEmblem from './modal/removeclanemblem';
import SendCash from './modal/sendcash';
import RemoveCash from './modal/removecash';
import TransferClan from './modal/transferclan';
import TransferDiscord from './modal/transferdiscord';
import ChangePassword from './modal/changepassword';
import RemoveAccount from './modal/removeaccount';
import AtualizarValorFireteamModal from './modal/atualizarvalorfireteam';
import MarcaDeBatalha from './modal/marcadebatalha';
import AdjustKDA from './modal/adjustkda';
import InsertFireteamBlacklist from './modal/insertfireteamblacklist';
import InsertWeaponModal from './modal/insertweaponmodal';
import ChangeGoaRewardModal from './modal/ChangeGoaRewardModal';
import CreateGachaponBox from './modal/creategachaponbox';
import AtividadesPendentes from './atividadespendentes';
import ChangeItemGradeModal from './modal/changeitemgrademodal';
import ChangeClanName from './modal/changeclanname';

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

  // Carregar ambiente atual do localStorage
  const [currentEnvironment, setCurrentEnvironment] = useState<'production' | 'test'>(() => {
    const saved = localStorage.getItem('currentEnvironment');
    return (saved as 'production' | 'test') || 'production';
  });

  // Monitorar mudanças no ambiente
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('currentEnvironment');
      const env = (saved as 'production' | 'test') || 'production';
      if (env !== currentEnvironment) {
        setCurrentEnvironment(env);
      }
    };

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);

    // Polling a cada segundo para detectar mudanças (caso seja na mesma aba)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentEnvironment]);

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

  // Opções de "ENVIAR / INSERIR" baseadas no ambiente
  const getEnviarInserirOptions = () => {
    const baseOptions = ['Enviar Cash', 'Enviar Item', 'Inserir BlackList EA', 'Inserir Arma'];

    // Adicionar "Criar/Editar Caixa" SOMENTE se estiver em ambiente de TESTES
    if (currentEnvironment === 'test') {
      return [...baseOptions, 'Criar/Editar Caixa'];
    }

    return baseOptions;
  };

  const actionButtons = [
    { name: 'CONSULTAR', options: ['Consultar Item', 'Consultar Histórico de Ban', 'Consultar Histórico de Doação', 'Consultar Inventário', 'Consultar Inbox', 'Consultar Caixas', 'Consultar Modo CAMP', 'Consultar Blacklist Fireteam'] },
    { name: 'ENVIAR / INSERIR', options: getEnviarInserirOptions() },
    { name: 'BANIR', options: getBanOptions() },
    { name: 'EXCLUIR', options: ['Remover Clã', 'Remover Emblema Clan', 'Remover Exp', 'Remover Cash', 'Remover Conta', ] },
    { name: 'TRANSFERIR', options: ['Transferir Clã', 'Transferir Discord'] },
    { name: 'ALTERAR', options: ['Alterar Nickname', 'Alterar Email', 'Alterar Senha', 'Alterar Fireteam', 'Marca de Batalha', 'Ajustar KDA', 'Alterar Login', 'Alterar Valor de Item', 'Alterar recompensa GOA', 'Alterar nome do Clan'] }
  ];
  
return (
    <div ref={containerRef} className="bg-[#111216] rounded-lg border border-black h-full flex flex-col" style={{ maxHeight: '100%', overflow: 'hidden' }}>
      <div className="flex flex-col h-full p-6" style={{ minHeight: 0 }}>
        
        {/* === BLOCO SUPERIOR: EXECUÇÕES (FIXO) === */}
        {/* flex-none impede que este bloco encolha ou cresça, ele ocupa apenas o espaço necessário */}
        <div className="flex-none mb-8">
            <div className="flex items-center gap-2 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span className="text-base sm:text-lg text-white font-neofara font-medium">EXECUÇÕES</span>
            </div>

            {/* Action buttons grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-neofara">
              {actionButtons.map((button) => (
                <div key={button.name} className="relative">
                  <button
                    onClick={() => toggleDropdown(button.name)}
                    data-button={button.name}
                    className="w-full bg-[#1d1e24] border border-black rounded-lg h-[60px] sm:h-[70px] md:h-[80px] hover:bg-[#525252] transition-colors"
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
                      className="absolute top-full left-0 mt-2 w-full bg-[#1d1e24] border border-black rounded-lg shadow-lg z-10 min-w-[150px] sm:min-w-[180px] md:min-w-[200px]"
                    >
                      {button.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleOptionClick(button.name, option)}
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

        {/* === BLOCO INFERIOR: ATIVIDADES PENDENTES (EXPANSÍVEL E COM SCROLL) === */}
        {/* VISÍVEL SOMENTE EM AMBIENTE DE TESTES */}
        {/* flex-1 faz ocupar todo o espaço restante. min-h-0 é CRUCIAL para scroll aninhado funcionar no flexbox */}
        {currentEnvironment === 'test' && (
          <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-none flex items-center gap-2 text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                <span className="text-base sm:text-lg text-white font-neofara font-medium">ATIVIDADES PENDENTES</span>
              </div>

              {/* Container específico para a rolagem */}
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <AtividadesPendentes />
              </div>
          </div>
        )}

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
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Histórico de Doação' && (
        <ConsultDonationHistory 
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
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Caixas' && (
        <ConsultBoxes
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Criar/Editar Caixa' && (
        <CreateGachaponBox
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Modo CAMP' && (
        <ConsultCampItems
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Consultar Blacklist Fireteam' && (
        <ConsultFireteamBlacklist
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Inserir BlackList EA' && (
        <InsertFireteamBlacklist
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Inserir Arma' && (
        <InsertWeaponModal
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
      {isModalOpen && selectedAction && selectedAction.option === 'Remover Emblema Clan' && (
        <RemoveClanEmblem
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
      {isModalOpen && selectedAction && selectedAction.option === 'Remover Cash' && (
        <RemoveCash
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
      {isModalOpen && selectedAction && selectedAction.option === 'Remover Conta' && (
        <RemoveAccount
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />  
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar Fireteam' && (
        <AtualizarValorFireteamModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />  
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Marca de Batalha' && (
        <MarcaDeBatalha
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Ajustar KDA' && (
        <AdjustKDA
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar Login' && (
        <ChangeLogin
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar Valor de Item' && (
        <ChangeItemGradeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar recompensa GOA' && (
        <ChangeGoaRewardModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {isModalOpen && selectedAction && selectedAction.option === 'Alterar nome do Clan' && (
        <ChangeClanName
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SidebarMenu;
