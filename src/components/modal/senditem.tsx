import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';


interface SendItemProps {
  isOpen: boolean;
  onClose: () => void;
}

const SendItem: React.FC<SendItemProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    loginAccounts: '',
    productIds: '',
    count: '',
    message: '',
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
        productIds: '', 
        count: '', 
        message: '' 
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
    
    if (!formData.productIds.trim()) {
      setErrorMessage('Por favor, informe ao menos um ID de produto.');
      return;
    }
    
    if (!formData.count.trim()) {
      setErrorMessage('Por favor, informe a quantidade.');
      return;
    }

    if (!formData.message.trim()) {
      setErrorMessage('Por favor, informe uma mensagem.');
      return;
    }

    // Validar se count é número válido
    const count = parseInt(formData.count);
    if (isNaN(count) || count <= 0) {
      setErrorMessage('A quantidade deve ser um número válido maior que zero.');
      return;
    }
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  if (isLoading) return; // Prevent double-clicks
  
  setIsLoading(true);
  try {
    // Chamar API para enviar produtos
    const result = await apiService.sendProductToList({
      nexonIdList: formData.loginAccounts,
      productListString: formData.productIds,
      count: parseInt(formData.count),
      message: formData.message,
      adminDiscordId: user?.profile?.discordId || 'system'
    });

    if (result.success) {
      setErrorMessage('');
      setShowConfirmation(false);
      onClose();
      // Reset form
      setFormData({
        loginAccounts: '',
        productIds: '',
        count: '',
        message: ''
      });
    } else {
      setErrorMessage(result.error || 'Erro ao enviar produtos');
      setShowConfirmation(false);
    }
  } catch (error) {
    console.error("Erro ao enviar produtos:", error);
    setErrorMessage('Erro de conexão ao enviar produtos');
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
            ENVIAR ITEM
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

          {/* IDs dos Produtos */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              IDs dos Produtos
            </label>
            <input
              type="text"
              name="productIds"
              placeholder="Ex: 101, 202, 303"
              value={formData.productIds}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Separe múltiplos IDs com vírgula (,)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Quantidade (por item)
            </label>
            <input
              type="number"
              name="count"
              min="1"
              placeholder="Ex: 1"
              value={formData.count}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              Quantidade universal para todos os produtos
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Mensagem
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              rows={3}
              placeholder="Ex: Recompensa do Evento!"
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
              Enviar Item
            </button>
          </div>
        </form>
      </div>
        <ConfirmationModal
          isOpen={showConfirmation}
          onConfirm={handleConfirmAction}
          onCancel={handleCancelConfirmation}
          title="Confirmar Envio"
          description={`Tem certeza que deseja enviar ${formData.count}x dos produtos [${formData.productIds}] para os jogadores: ${formData.loginAccounts}?

Mensagem: "${formData.message}"`}
          confirmActionText="Sim, Enviar Produtos"
          cancelActionText="Cancelar"
          isLoading={isLoading}
        />
    </div>
  );
};

export default SendItem;