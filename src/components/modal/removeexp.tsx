import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface RemoveExpProps {
  isOpen: boolean;
  onClose: () => void;
}

const RemoveExp: React.FC<RemoveExpProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [currentExp, setCurrentExp] = useState<number>(0);
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [playerValidated, setPlayerValidated] = useState(false);
  const [targetGradeLevel, settargetGradeLevel] = useState(false);
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    targetGradeLevel: '',
    reason: ''
  });

  // Função de validação cruzada (como nos outros modais funcionais)
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
      setFormData({ discordId: '', loginAccount: '', targetGradeLevel: '', reason: '' });
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
    
    // Validar se temos um jogador validado antes de mostrar confirmação
    if (!playerValidated || !fetchedPlayerName || fetchedPlayerName.trim() === '') {
      setErrorMessage('Por favor, preencha Discord ID e Login da conta e aguarde a validação.');
      return;
    }
    
    // Validar se a razão foi preenchida
    if (!formData.reason || formData.reason.trim() === '') {
      setErrorMessage('Por favor, informe a razão do downgrade.');
      return;
    }
    
    // Validar se o targetGradeLevel foi preenchido
    if (!formData.targetGradeLevel || formData.targetGradeLevel.trim() === '') {
      setErrorMessage('Por favor, informe o nível de patente.');
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmAction = async () => {
    if (isLoading) return; // Prevent multiple calls
    
    setIsLoading(true);
    try {
      // Garantir que temos uma validação dupla antes de prosseguir (como nos outros modais)
      if (!playerValidated) {
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

      // Chamar API para aplicar downgrade de rank
      const result = await apiService.setUserRank({
        discordId: formData.discordId,
        loginAccount: formData.loginAccount,
        targetGradeLevel: parseInt(formData.targetGradeLevel),
        reason: formData.reason,
        adminDiscordId: user?.profile?.discordId || 'system'
      });

      if (result.success) {
        setErrorMessage('');
        setShowConfirmation(false);
        onClose();
      } else {
        setErrorMessage(result.error || 'Erro ao aplicar downgrade');
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Erro ao aplicar downgrade:', error);
      setErrorMessage('Erro de conexão ao aplicar downgrade');
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
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            REMOVER EXP
          </h2>
          <button
            onClick={onClose}
            className="ml-[465px] text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Discord ID
            </label>
            <input
              type="text"
              name="discordId"
              value={formData.discordId}
              onChange={handleInputChange}
              placeholder="Digite o Discord ID do jogador"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Login da Conta (strNexonID)
            </label>
            <input
              type="text"
              name="loginAccount"
              value={formData.loginAccount}
              onChange={handleInputChange}
              placeholder="Digite o strNexonID da conta"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            {isValidatingPlayer && (
              <p className="mt-2 text-sm text-blue-400">
                Validando jogador...
              </p>
            )}
            {playerValidated && fetchedPlayerName && (
              <p className="mt-2 text-sm text-green-400">
                ✓ Jogador validado: {fetchedPlayerName}
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-400">
                {errorMessage}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nível de Patente (Grade Level)
            </label>
            <input
              type="number"
              name="targetGradeLevel"
              value={formData.targetGradeLevel}
              onChange={handleInputChange}
              placeholder="Ex: 30 (para patente correspondente)"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Razão do Downgrade
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={3}
              placeholder="Ex: Correção de rank após punição."
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
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
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Aplicar Downgrade
            </button>
          </div>
        </form>
      </div>
      
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirmation}
        title="Confirmar Downgrade de Rank"
        description="Tem certeza que deseja remover exp?"
        confirmActionText="Sim, Aplicar Downgrade"
        cancelActionText="Cancelar"
        isLoading={isLoading}
      />
    </div>
  );
};

export default RemoveExp;