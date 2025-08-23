import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useActivityLog, createUnbanLog } from '../../contexts/ActivityLogContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api.service';

interface UnbanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UnbanModal: React.FC<UnbanModalProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    unbanReason: '',
    unbanScope: 'P',
    clearMacBlock: 'N'
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
    // Lógica original (API call para desbanir)
    console.log('Data:', formData);

    const adminName = user?.profile?.nickname || user?.username || 'Admin';

    // Registra a atividade no banco de dados via API
    try {
      const dbLogData = {
        adminDiscordId: user?.profile.discordId || 'system',
        adminNickname: adminName,
        targetDiscordId: formData.discordId,
        targetNickname: selectedPlayer?.name || formData.loginAccount,
        action: 'unban',
        details: 'Desbaniu o jogador',
        notes: formData.unbanReason,
      };
      await apiService.createLog(dbLogData);
    } catch (error) {
      console.error('Falha ao salvar log no banco de dados:', error);
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
              value={formData.loginAccount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
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
        description={`Tem certeza que deseja desbanir o jogador: ${formData.loginAccount} com o ID Discord: ${formData.discordId}`}
        confirmActionText="Sim, Desbanir"
        cancelActionText="Cancelar"
      />
    </div>
  );
};

export default UnbanModal;