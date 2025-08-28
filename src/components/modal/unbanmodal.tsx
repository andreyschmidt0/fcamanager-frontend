import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface UnbanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnbanModal: React.FC<UnbanModalProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();

  // Função para validação cross-check de Discord ID + Login
  const validatePlayerCrossCheck = async (discordId: string, login: string) => {
    if (!discordId || discordId.trim() === '' || !login || login.trim() === '') {
      setFetchedPlayerName('');
      setPlayerValidated(false);
      setErrorMessage('');
      return;
    }

    setIsValidatingPlayer(true);
    try {
      const result = await apiService.validatePlayerCrossCheck(discordId, login);
      
      if (result.isValid && result.player) {
        setFetchedPlayerName(result.player.NickName || '');
        setPlayerValidated(true);
        setErrorMessage('');
      } else {
        setFetchedPlayerName('');
        setPlayerValidated(false);
        setErrorMessage(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar jogador:', error);
      setFetchedPlayerName('');
      setPlayerValidated(false);
      setErrorMessage('Erro de conexão');
    } finally {
      setIsValidatingPlayer(false);
    }
  };
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    unbanReason: '',
    unbanScope: 'P',
    clearMacBlock: 'N'
  });
  
  // Estados para validação
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [playerValidated, setPlayerValidated] = useState(false);
  
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      }));
      
      // Limpar estados de validação quando modal abrir com selectedPlayer
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      
      // Se temos selectedPlayer, validar automaticamente
      if (selectedPlayer.discordId && selectedPlayer.nexonId) {
        validatePlayerCrossCheck(selectedPlayer.discordId, selectedPlayer.nexonId);
      }
    } else if (isOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      setFormData({ 
        discordId: '', 
        loginAccount: '', 
        unbanReason: '', 
        unbanScope: 'P', 
        clearMacBlock: 'N' 
      });
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
    }
  }, [selectedPlayer, isOpen]);

  // useEffect com debounce para validação automática quando campos são digitados
  useEffect(() => {
    if (formData.discordId && formData.discordId.trim() !== '' && 
        formData.loginAccount && formData.loginAccount.trim() !== '') {
      
      const timeoutId = setTimeout(() => {
        validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      // Se um dos campos estiver vazio, limpar validação
      setFetchedPlayerName('');
      setPlayerValidated(false);
      setErrorMessage('');
    }
  }, [formData.discordId, formData.loginAccount]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado antes de mostrar confirmação
    if (!playerValidated || !fetchedPlayerName) {
      setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (isValidatingPlayer) {
      setErrorMessage('Aguarde a validação ser concluída antes de desbanir.');
      return;
    }
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  
  // Validação dupla: Re-validar jogador antes de executar ação
  if (!playerValidated || !fetchedPlayerName) {
    try {
      const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
      if (!validationResult.isValid) {
        setErrorMessage('Jogador não pôde ser validado. Verifique os dados informados.');
        setShowConfirmation(false);
        return;
      }
    } catch (error) {
      console.error('Erro na validação dupla:', error);
      setErrorMessage('Erro ao validar jogador. Tente novamente.');
      setShowConfirmation(false);
      return;
    }
  }

  const adminName = user?.profile?.nickname || 'Admin';

  // Log agora é gerado automaticamente pelo sistema do jogo

  setShowConfirmation(false);
  onClose();
};

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            DESBANIR JOGADOR
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
              value={formData.discordId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Login da Conta */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Login da conta
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
                ✓ Jogador validado: {fetchedPlayerName}
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-400">
                ✗ {errorMessage}
              </p>
            )}
          </div>

          {/* Motivo do Desbanimento */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Motivo do desbanimento
            </label>
            <textarea
              name="unbanReason"
              value={formData.unbanReason}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Escopo */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Escopo
            </label>
            <select
              name="unbanScope"
              value={formData.unbanScope}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="P">P - Só principal</option>
              <option value="A">A - Todas do MAC</option>
            </select>
          </div>

          {/* Limpar Bloqueio do MAC */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Limpar Bloqueio do MAC
            </label>
            <select
              name="clearMacBlock"
              value={formData.clearMacBlock}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="N">N - Não</option>
              <option value="S">S - Sim</option>
            </select>
          </div>

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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Desbanir Jogador
            </button>
          </div>
        </form>
      </div>
        <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Ação"
          description={`Tem certeza que deseja desbanir o jogador: ${fetchedPlayerName || formData.loginAccount} (Discord: ${formData.discordId})?`}
          confirmActionText="Sim, Desbanir"
          cancelActionText="Cancelar"
        />
    </div>
  );
};

export default UnbanModal;