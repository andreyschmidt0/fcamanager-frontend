import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api.service';

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
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    exp:''
  });

  const fetchCurrentExp = async (playerNickname: string) => {
    setIsLoadingExp(true);
    try {
      const playerProfile = await apiService.getPlayerProfile(playerNickname);
      if (playerProfile?.EXP) {
        const exp = parseInt(playerProfile.EXP) || 0;
        setCurrentExp(exp);
      } else {
        setCurrentExp(0);
      }
    } catch (error) {
      console.warn('Erro ao buscar EXP do jogador:', error);
      setCurrentExp(0);
    } finally {
      setIsLoadingExp(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      }));
      
      // Buscar EXP atual quando o modal abrir
      const playerNickname = selectedPlayer.name || selectedPlayer.nexonId;
      if (playerNickname) {
        fetchCurrentExp(playerNickname);
      }
    }
  }, [selectedPlayer, isOpen]);

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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true); // Mostra confirmação em vez de executar
  };

const handleConfirmAction = async () => {
  console.log('Data:', formData);
  
  const adminName = user?.profile?.nickname || user?.username || 'Admin';
  const expAmount = parseInt(formData.exp);
  const newExp = calculateResultingExp(); // Usar o cálculo já disponível

  try {
    // Registra a atividade no banco de dados via API
    const dbLogData = {
      adminDiscordId: user?.profile?.discordId || 'system',
      adminNickname: adminName,
      targetDiscordId: formData.discordId,
      targetNickname: selectedPlayer?.name || formData.loginAccount || 'Jogador',
      action: 'remove_exp',
      old_value: currentExp.toString(),
      new_value: newExp.toString(),
      details: `Removeu ${expAmount} EXP (${currentExp} → ${newExp})`,
      notes: `Remoção de EXP via login: ${formData.loginAccount}`
    };

    console.log('Enviando dados do log:', dbLogData);
    await apiService.createLog(dbLogData);
  } catch (error) {
    console.error('Falha ao salvar log de remoção de EXP no banco de dados:', error);
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
              Login da Conta
            </label>
            <input
              type="text"
              name="loginAccount"
              value={formData.loginAccount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
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
          description={`Tem certeza que deseja enviar: ${formData.exp} de EXP para o jogador: ${formData.loginAccount}?`}
          confirmActionText="Sim, Enviar"
          cancelActionText="Cancelar"
        />
    </div>
  );
};

export default RemoveExp;