import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface SendItemProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const SendItemFormFields = ({ formData, onInputChange }: any) => (
  <>
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
        onChange={onInputChange}
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
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Separe múltiplos IDs com vírgula (,)
      </p>
    </div>

    {/* Quantidade */}
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
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Quantidade universal para todos os produtos
      </p>
    </div>

    {/* Mensagem */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Mensagem
      </label>
      <textarea
        name="message"
        value={formData.message}
        onChange={onInputChange}
        rows={3}
        placeholder="Ex: Recompensa do Evento!"
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
        required
      />
    </div>
  </>
);

const SendItem: React.FC<SendItemProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    loginAccounts: '',
    productIds: '',
    count: '',
    message: '',
  });

  const handleSendItemAction = async () => {
    const result = await apiService.sendProductToList({
      nexonIdList: formData.loginAccounts,
      productListString: formData.productIds,
      count: parseInt(formData.count),
      message: formData.message,
      adminDiscordId: user?.profile?.discordId || 'system'
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao enviar produtos');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.loginAccounts.trim()) return false;
    if (!formData.productIds.trim()) return false;
    if (!formData.count.trim()) return false;
    if (!formData.message.trim()) return false;
    
    const count = parseInt(formData.count);
    if (isNaN(count) || count <= 0) return false;
    
    return true;
  }, [formData]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja enviar ${formData.count}x dos produtos [${formData.productIds}] para os jogadores: ${formData.loginAccounts}?

Mensagem: "${formData.message}"`;
  }, [formData.count, formData.productIds, formData.loginAccounts, formData.message]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ENVIAR ITEM"
      confirmTitle="Confirmar Envio"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Enviar Produtos"
      action={handleSendItemAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos corretamente."
    >
      <SendItemFormFields />
    </ActionFormModal>
  );
};

export default SendItem;