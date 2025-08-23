import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api.service';

interface ChangeNicknameProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeNickname: React.FC<ChangeNicknameProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    new_value:''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      }));
    }
  }, [selectedPlayer, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  console.log('Data:', formData);
  
  const adminName = user?.profile?.nickname || user?.username || 'Admin';
  let oldNickName = 'Não encontrado';

  try {
    // Busque o perfil do jogador pelo nickname para obter o nickname antigo
    const playerNickname = selectedPlayer?.name || formData.loginAccount;
    if (playerNickname) {
      const playerProfile = await apiService.getPlayerProfile(playerNickname);
      if (playerProfile?.NickName) {
        oldNickName = playerProfile.NickName;
      }
    }
  } catch (error) {
    console.warn('Não foi possível buscar o perfil do jogador, usando nickname padrão');
  }

  try {
    // Registra a atividade no banco de dados via API
    const dbLogData = {
      adminDiscordId: user?.profile?.discordId || 'system',
      adminNickname: adminName,
      targetDiscordId: formData.discordId,
      targetNickname: selectedPlayer?.name || formData.loginAccount || 'Jogador',
      action: 'change_NickName',
      old_value: oldNickName,
      new_value: formData.new_value || 'Valor não definido',
      details: `Alterou o nickname de ${oldNickName} para ${formData.new_value}`,
      notes: `Alterado via Discord ID: ${formData.discordId}`
    };

    console.log('Enviando dados do log:', dbLogData);
    await apiService.createLog(dbLogData);
  } catch (error) {
    console.error('Falha ao salvar log de alteração de nickname no banco de dados:', error);
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
            ALTERAR NICKNAME
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
              placeholder='Ex 123456789012345678'
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

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
              Novo Nickname
            </label>
            <input
              type="text"
              name="new_value"
              value={formData.new_value}
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Alterar Nickname
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirmation}
        title="Confirmar Alteração"
        description={`Tem certeza que deseja alterar o nickname para: ${formData.new_value}?`}
        confirmActionText="Sim, Alterar"
        cancelActionText="Cancelar"
      />
    </div>
  );
};

export default ChangeNickname;