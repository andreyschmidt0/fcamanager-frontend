import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface SendCashProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendCash: React.FC<SendCashProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    loginAccounts: '',
    cashAmount: '',
    creditReason: '',
  });
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        loginAccounts: selectedPlayer.nexonId || ''
      }));
      setErrorMessage('');
    } else if (isOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      setFormData({ 
        loginAccounts: '', 
        cashAmount: '', 
        creditReason: '' 
      });
      setErrorMessage('');
    }
  }, [selectedPlayer, isOpen]);

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
    
    // Validar campos obrigatórios
    if (!formData.loginAccounts.trim()) {
      setErrorMessage('Por favor, informe ao menos um login de conta.');
      return;
    }
    
    if (!formData.cashAmount.trim()) {
      setErrorMessage('Por favor, informe a quantidade de cash.');
      return;
    }

    if (!formData.creditReason.trim()) {
      setErrorMessage('Por favor, informe a razão do envio.');
      return;
    }

    // Validar se cashAmount é número válido
    const cashAmount = parseInt(formData.cashAmount);
    if (isNaN(cashAmount) || cashAmount <= 0) {
      setErrorMessage('A quantidade deve ser um número válido maior que zero.');
      return;
    }
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  if (isLoading) return; // Prevent multiple calls
  
  setIsLoading(true);
  try {
    // Chamar API para enviar cash
    const result = await apiService.creditCashToList({
      nexonIdList: formData.loginAccounts,
      cashAmount: parseInt(formData.cashAmount),
      creditReason: formData.creditReason,
      adminDiscordId: user?.profile?.discordId || 'system'
    });

    if (result.success) {
      setErrorMessage('');
      setShowConfirmation(false);
      onClose();
      // Reset form
      setFormData({
        loginAccounts: '',
        cashAmount: '',
        creditReason: ''
      });
    } else {
      setErrorMessage(result.error || 'Erro ao enviar cash');
      setShowConfirmation(false);
    }
  } catch (error) {
    console.error("Erro ao enviar cash:", error);
    setErrorMessage('Erro de conexão ao enviar cash');
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
          {/* Login das Contas */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Login das contas (strNexonID)
            </label>
            <input
              type="text"
              name="loginAccounts"
              placeholder="Ex: schmidt, nicki, player3"
              value={formData.loginAccounts}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Separe múltiplos logins com vírgula (,)
            </p>
          </div>

          {/* Quantidade de Cash */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Quantidade de Cash
            </label>
            <input
              type="number"
              name="cashAmount"
              min="1"
              placeholder="Ex: 10000"
              value={formData.cashAmount}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Quantidade de cash para todos os jogadores
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Razão do Envio
            </label>
            <textarea
              name="creditReason"
              value={formData.creditReason}
              onChange={handleInputChange}
              rows={3}
              placeholder="Ex: Vencedores do Sorteio Semanal"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Mensagem de erro */}
          {errorMessage && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                ✗ {errorMessage}
              </p>
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
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Enviar Cash
            </button>
          </div>
        </form>
      </div>
    <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Envio de Cash"
          description={`Tem certeza que deseja enviar ${formData.cashAmount} de Cash para os jogadores: ${formData.loginAccounts}?

Razão: "${formData.creditReason}"`}
          confirmActionText="Sim, Enviar Cash"
          cancelActionText="Cancelar"
          isLoading={isLoading}
        />
    </div>
  );
};

export default SendCash;