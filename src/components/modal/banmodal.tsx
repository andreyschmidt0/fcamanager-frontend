import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BanModal: React.FC<BanModalProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    banDuration: '',
    banReason: '',
    banScope: 'S',
    blockMac: 'N',
    deleteClans: 'N'
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
    setShowConfirmation(true); // Mostra confirmação em vez de executar
  };

  const handleConfirmAction = () => {
    // Lógica original aqui
    console.log('Data:', formData);
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
            BANIR JOGADOR
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

          {/* Duração do Ban */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Duração do ban (999 = permanente)
            </label>
            <input
              type="text"
              name="banDuration"
              value={formData.banDuration}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Motivo do Banimento */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Motivo do banimento
            </label>
            <textarea
              name="banReason"
              value={formData.banReason}
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
              name="banScope"
              value={formData.banScope}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="S">S - Banir apenas o usuário específico</option>
              <option value="M">M - Banir todas as contas no mesmo MAC</option>
            </select>
          </div>

          {/* Opções em linha */}
          <div className="grid grid-cols-2 gap-4">
            {/* Bloquear MAC */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bloquear MAC
              </label>
              <select
                name="blockMac"
                value={formData.blockMac}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="N">N - Não bloquear MAC</option>
                <option value="S">S - Sim, bloquear MAC</option>
              </select>
            </div>

            {/* Excluir Clãs */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Excluir Clãs
              </label>
              <select
                name="deleteClans"
                value={formData.deleteClans}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              >
                <option value="N">N - Não excluir clãs</option>
                <option value="S">S - Sim, excluir clãs</option>
              </select>
            </div>
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
              Banir Jogador
            </button>
          </div>
        </form>
      </div>
        <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Ação"
          description={`Tem certeza que deseja banir o jogador ${formData.loginAccount} com o ID Discord ${formData.discordId}? Esta ação não pode ser desfeita.`}
          confirmActionText="Sim, Banir"
          cancelActionText="Cancelar"
        />
    </div>
  );
};

export default BanModal;