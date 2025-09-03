import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface TransferDiscordProps {
  isOpen: boolean;
  onClose: () => void;
}

const TransferDiscord: React.FC<TransferDiscordProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    newDiscordID: '',
  });
  
  // Novos estados para validação
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [playerValidated, setPlayerValidated] = useState(false);
  const [validatedOidUser, setValidatedOidUser] = useState<number | null>(null);

  // Função para validação cross-check de Discord ID + Login
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
      const result = await apiService.validatePlayerCrossCheck(discordId, login);
      
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
      
      // Se temos selectedPlayer, validar automaticamente
      if (selectedPlayer.discordId && selectedPlayer.nexonId) {
        validatePlayerCrossCheck(selectedPlayer.discordId, selectedPlayer.nexonId);
      }
    } else if (isOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      setFormData({ discordId: '', loginAccount: '', newDiscordID: '' });
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setValidatedOidUser(null);
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
      setValidatedOidUser(null);
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

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado antes de mostrar confirmação
    if (!playerValidated || !fetchedPlayerName || !validatedOidUser) {
      setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (isValidatingPlayer) {
      setErrorMessage('Aguarde a validação ser concluída antes de enviar.');
      return;
    }
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  if (isLoading) return; // Prevent multiple calls
  
  setIsLoading(true);
  try {
    // Validação dupla: Re-validar jogador antes de executar ação
    if (!playerValidated || !fetchedPlayerName || !validatedOidUser) {
      try {
        const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
        if (!validationResult.isValid || !validationResult.player?.oidUser) {
          setErrorMessage('Jogador não pôde ser validado. Verifique os dados informados.');
          setShowConfirmation(false);
          return;
        }
        setValidatedOidUser(validationResult.player.oidUser);
      } catch (error) {
        console.error('Erro na validação dupla:', error);
        setErrorMessage('Erro ao validar jogador. Tente novamente.');
        setShowConfirmation(false);
        return;
      }
    }
    
    const gmOidUser = user?.id || 2;

    const changeDiscordData = {
      gmOidUser: gmOidUser, // oidUser do GM executando a ação
      targetOidUser: validatedOidUser!, // oidUser do usuário que terá o Discord alterado
      newDiscordID: formData.newDiscordID, // Discord ID novo
      adminDiscordId: user?.profile?.discordId || 'system'
    };

    const result = await apiService.changeUserDiscordId(changeDiscordData);
    
    if (result.success) {
      // Exibir mensagem de sucesso para o usuário
      console.log('Sucesso:', result.message);
      setShowConfirmation(false);
      onClose();
    } else {
      // Exibir mensagem de erro
      setErrorMessage(result.error || result.message || 'Erro desconhecido');
      setShowConfirmation(false);
    }
    
  } catch (error) {
    console.error('Erro ao alterar Discord ID:', error);
    setErrorMessage('Erro de conexão ao tentar alterar o Discord ID');
    setShowConfirmation(false);
  } finally {
    setIsLoading(false);
  }
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
            ALTERAR DISCORD ID
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

          {/* Mostrar oidUser do alvo validado */}
          {fetchedPlayerName && playerValidated && validatedOidUser && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                OID User do jogador alvo (validado automaticamente)
              </label>
              <input
                type="text"
                value={validatedOidUser}
                disabled
                className="w-full px-3 py-2 bg-[#2a2b32] text-gray-400 rounded-lg cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Novo Discord ID
            </label>
            <input
              type="text"
              name="newDiscordID"
              placeholder='Digite o novo Discord ID (ex: 134123421342131)'
              value={formData.newDiscordID}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
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
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Alterar Discord ID
            </button>
          </div>
        </form>
      </div>
    <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Ação"
          description={`Você tem certeza que deseja alterar o Discord ID do jogador ${fetchedPlayerName} (Discord atual: ${formData.discordId}, Login: ${formData.loginAccount}) para o novo Discord ID: ${formData.newDiscordID}?`}
          confirmActionText="Sim, alterar Discord ID"
          cancelActionText="Cancelar"
          isLoading={isLoading}
        />
    </div>
  );
};

export default TransferDiscord;