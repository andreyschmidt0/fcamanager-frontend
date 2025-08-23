import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useActivityLog, createSendCashLog } from '../../contexts/ActivityLogContext';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api.service';

interface SendCashProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendCash: React.FC<SendCashProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { addActivity } = useActivityLog();
  const { user } = useAuth();
  const [currentMoney, setCurrentMoney] = useState<number>(0);
  const [isLoadingMoney, setIsLoadingMoney] = useState(false);
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    cash:'',
  });

  const fetchCurrentMoney = async (playerNickname: string) => {
    setIsLoadingMoney(true);
    try {
      const playerProfile = await apiService.getPlayerProfile(playerNickname);
      if (playerProfile?.Money) {
        const money = parseInt(playerProfile.Money) || 0;
        setCurrentMoney(money);
      } else {
        setCurrentMoney(0);
      }
    } catch (error) {
      console.warn('Erro ao buscar Cash do jogador:', error);
      setCurrentMoney(0);
    } finally {
      setIsLoadingMoney(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || '',
      }));
      
      // Buscar Cash atual quando o modal abrir
      const playerNickname = selectedPlayer.name || selectedPlayer.nexonId;
      if (playerNickname) {
        fetchCurrentMoney(playerNickname);
      }
    }
  }, [selectedPlayer, isOpen]);

  // Calcular Cash resultante em tempo real
  const calculateResultingMoney = () => {
    const cashToSend = parseInt(formData.cash) || 0;
    return currentMoney + cashToSend; // SOMAR para sendcash
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true); // Mostra confirmação em vez de executar
  };

const handleConfirmAction = async () => {
  console.log('Data:', formData);
  
  const adminName = user?.profile?.nickname || user?.username || 'Admin';
  const cashAmount = parseInt(formData.cash);
  const newMoney = calculateResultingMoney(); // Usar o cálculo já disponível

  try {
    // Registra a atividade no banco de dados via API
    const dbLogData = {
      adminDiscordId: user?.profile?.discordId || 'system',
      adminNickname: adminName,
      targetDiscordId: formData.discordId,
      targetNickname: selectedPlayer?.name || formData.loginAccount || 'Jogador',
      action: 'send_cash',
      old_value: currentMoney.toString(),
      new_value: newMoney.toString(),
      details: `Enviou ${cashAmount} Cash (${currentMoney} → ${newMoney})`,
      notes: `Envio de Cash via login: ${formData.loginAccount}`
    };

    console.log('Enviando dados do log:', dbLogData);
    await apiService.createLog(dbLogData);
  } catch (error) {
    console.error('Falha ao salvar log de envio de Cash no banco de dados:', error);
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
            ENVIAR CASH
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


          {/* Quantidade de Cash */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Quantidade de Cash
            </label>
            <input
              type="number"
              name="cash"
              value={formData.cash}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Informações de Cash */}
          <div className="bg-[#1a1b1f] rounded-lg p-4 border border-gray-600">
            <h3 className="text-sm font-medium text-white mb-3">Informações de Cash</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cash Atual</label>
                <div className="text-lg font-semibold text-blue-400">
                  {isLoadingMoney ? 'Carregando...' : currentMoney.toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cash Calculado</label>
                <div className="text-lg font-semibold text-green-400">
                  {calculateResultingMoney().toLocaleString()}
                </div>
              </div>
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
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Enviar Item
            </button>
          </div>
        </form>
      </div>
    <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Ação"
          description={`Tem certeza que deseja enviar: ${formData.cash} de Cash para o jogador: ${formData.loginAccount} com o Discord ID: ${formData.discordId}?`}
          confirmActionText="Sim, Enviar"
          cancelActionText="Cancelar"
        />
    </div>
  );
};

export default SendCash;