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
  const { user } = useAuth();
  const [currentExp, setCurrentExp] = useState<number>(0);
  const [isLoadingExp, setIsLoadingExp] = useState(false);
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [playerValidated, setPlayerValidated] = useState(false);
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    exp:''
  });

  // Função de validação cruzada (como nos outros modais funcionais)
  const validatePlayerCrossCheck = async (discordId: string, login: string) => {
    if (!discordId || discordId.trim() === '' || !login || login.trim() === '') {
      setFetchedPlayerName('');
      setCurrentExp(0);
      setPlayerValidated(false);
      setErrorMessage('');
      return;
    }

    setIsValidatingPlayer(true);
    try {
      const result = await apiService.validatePlayerCrossCheck(discordId, login);
      
      if (result.isValid && result.player) {
        setFetchedPlayerName(result.player.NickName || '');
        setCurrentExp(parseInt(result.player.EXP) || 0);
        setPlayerValidated(true);
        setErrorMessage('');
      } else {
        setFetchedPlayerName('');
        setCurrentExp(0);
        setPlayerValidated(false);
        setErrorMessage(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar jogador:', error);
      setFetchedPlayerName('');
      setCurrentExp(0);
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
      setFormData({ discordId: '', loginAccount: '', exp: '' });
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setCurrentExp(0);
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
      setCurrentExp(0);
      setPlayerValidated(false);
      setErrorMessage('');
    }
  }, [formData.discordId, formData.loginAccount]);

  // Calcular EXP resultante em tempo real
  const calculateResultingExp = () => {
    const expToRemove = parseInt(formData.exp) || 0;
    return Math.max(0, currentExp - expToRemove);
  };

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
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  
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
  
  const adminName = user?.profile?.nickname || user?.username || 'Admin';
  const expAmount = parseInt(formData.exp);
  const newExp = calculateResultingExp();

  try {
    // Registra a atividade no banco de dados via API
    const dbLogData = {
      adminDiscordId: user?.profile?.discordId || 'system',
      adminNickname: adminName,
      targetDiscordId: formData.discordId || '',
      targetNickname: fetchedPlayerName || 'Jogador desconhecido',
      action: 'remove_exp',
      old_value: currentExp.toString(),
      new_value: newExp.toString(),
      details: `Removeu ${expAmount} EXP (${currentExp} → ${newExp})`,
      notes: `Remoção de EXP via strNexonID: ${formData.loginAccount}`
    };

    // Log agora é gerado automaticamente pelo sistema do jogo
  } catch (error) {
    console.error("Erro:", error);
  }

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
              Quantidade de EXP
            </label>
            <input
              type="text"
              name="exp"
              value={formData.exp}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Informações de EXP */}
          <div className="bg-[#1a1b1f] rounded-lg p-4 border border-gray-600">
            <h3 className="text-sm font-medium text-white mb-3">Informações de EXP</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">EXP Atual</label>
                <div className="text-lg font-semibold text-blue-400">
                  {isLoadingExp ? 'Carregando...' : currentExp.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">EXP Calculado</label>
                <div className="text-lg font-semibold text-green-400">
                  {calculateResultingExp().toLocaleString()}
                </div>
              </div>
            </div>
            {formData.exp && parseInt(formData.exp) > currentExp && (
              <div className="mt-2 text-xs text-red-400">
                ⚠️ A quantidade a ser removida é maior que o EXP atual
              </div>
            )}
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Remover Exp
            </button>
          </div>
        </form>
      </div>
          <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Ação"
          description={`Tem certeza que deseja remover ${formData.exp} de EXP do jogador: ${fetchedPlayerName || formData.loginAccount}?`}
          confirmActionText="Sim, Remover"
          cancelActionText="Cancelar"
        />
    </div>
  );
};

export default RemoveExp;