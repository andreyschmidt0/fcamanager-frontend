import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import apiTauriService from '../../services/api-tauri.service';
import toast from 'react-hot-toast';
import ConsultInventoryResult from './consultinventoryresult/consultinventoryresult';

interface ConsultInventory {
  isOpen: boolean;
  onClose: () => void;
}

interface InventoryItem {
  oidUser: number;
  Nickname: string;
  InventorySeqNo: number;
  ItemNo: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  Period: number;
  RemainCount: number;
  UseType: number;
  ie_Ativo: string;
}

const ConsultInventory: React.FC<ConsultInventory> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });
  
  // Estados para validação (igual ao transfer clan)
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [playerValidated, setPlayerValidated] = useState(false);
  const [validatedOidUser, setValidatedOidUser] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para os resultados
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

  // Função para validação cross-check de Discord ID + Login (igual ao transfer clan)
  const validatePlayerCrossCheck = async (discordId: string, login: string) => {
    if (!discordId || discordId.trim() === '' || !login || login.trim() === '') {
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('');
      return;
    }

    setIsValidatingPlayer(true);
    try {
      const result = await apiTauriService.validatePlayerCrossCheck(discordId, login);
      
      if (result.isValid && result.player) {
        setFetchedPlayerName(result.player.NickName || '');
        setValidatedOidUser(result.player.oidUser || null);
        setPlayerValidated(true);
        setErrorMessage('');
      } else {
        setFetchedPlayerName('');
        setValidatedOidUser(null);
        setPlayerValidated(false);
        setErrorMessage(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar jogador:', error);
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('Erro de conexão');
    } finally {
      setIsValidatingPlayer(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || '',
      }));
      
      // Limpar estados de validação quando modal abrir com selectedPlayer
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setValidatedOidUser(null);
      setShowResultModal(false);
      setInventoryData([]);
      
      // Se temos selectedPlayer, validar automaticamente
      if (selectedPlayer.discordId && selectedPlayer.nexonId) {
        validatePlayerCrossCheck(selectedPlayer.discordId, selectedPlayer.nexonId);
      }
    } else if (isOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      setFormData({ discordId: '', loginAccount: '' });
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setValidatedOidUser(null);
      setShowResultModal(false);
      setInventoryData([]);
    }
  }, [selectedPlayer, isOpen]);

  // useEffect com debounce para validação automática quando campos são digitados
  useEffect(() => {
    // Não executar debounce se temos selectedPlayer (para evitar validação dupla)
    if (selectedPlayer && selectedPlayer.discordId && selectedPlayer.nexonId) {
      return;
    }

    if (formData.discordId && formData.discordId.trim() !== '' && 
        formData.loginAccount && formData.loginAccount.trim() !== '') {
      
      const timeoutId = setTimeout(() => {
        validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      // Se um dos campos estiver vazio, limpar validação
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('');
    }
  }, [formData.discordId, formData.loginAccount, selectedPlayer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar mensagem de erro quando usuário digitar
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado antes de buscar inventário
    if (!playerValidated || !fetchedPlayerName || !validatedOidUser) {
      setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (isValidatingPlayer) {
      setErrorMessage('Aguarde a validação ser concluída antes de enviar.');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await apiTauriService.searchInventory(
        validatedOidUser.toString()
      );
      
      setInventoryData(result);
      setShowResultModal(true);
      
      if (result.length === 0) {
        toast.success('Busca realizada! Nenhum item encontrado.');
      } else {
        toast.success(`Encontrados ${result.length} itens no inventário`);
      }
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
      toast.error('Erro ao buscar inventário do jogador');
      setInventoryData([]);
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setInventoryData([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            CONSULTAR INVENTÁRIO
          </h2>
          <button
            onClick={onClose}
            className="ml-[465px] text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Discord ID */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Discord ID do usuário alvo
            </label>
            <input
              type="text"
              name="discordId"
              placeholder='Ex 123456789012345678'
              value={formData.discordId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Login da Conta */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Login da conta (strNexonID)
            </label>
            <input
              type="text"
              name="loginAccount"
              placeholder="Digite o strNexonID da conta"
              value={formData.loginAccount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            
            {/* Feedback visual de validação */}
            {isValidatingPlayer && (
              <p className="mt-2 text-sm text-yellow-400">
                Validando jogador...
              </p>
            )}
            {fetchedPlayerName && playerValidated && (
              <p className="mt-2 text-sm text-green-400">
                ✓ Jogador validado: {fetchedPlayerName} | oidUser: {validatedOidUser}
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-400">
                ✗ {errorMessage}
              </p>
            )}
          </div>

          {/* Mostrar oidUser validado automaticamente */}
          {fetchedPlayerName && playerValidated && validatedOidUser && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                OIDUSER (preenchido automaticamente)
              </label>
              <input
                type="text"
                value={validatedOidUser}
                disabled
                className="w-full px-3 py-2 bg-[#2a2b32] text-gray-400 rounded-lg cursor-not-allowed"
              />
            </div>
          )}


          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !playerValidated}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Search size={20} />
              )}
              {isLoading ? 'Consultando...' : 'Consultar Inventário'}
            </button>
          </div>
        </form>

      </div>

      {/* Modal de Resultado */}
      <ConsultInventoryResult
        isOpen={showResultModal}
        onClose={handleCloseResultModal}
        inventoryData={inventoryData}
        playerName={fetchedPlayerName}
      />
    </div>
  );
};

export default ConsultInventory;