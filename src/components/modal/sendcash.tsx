import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface SendCashProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const SendCashFormFields = ({ formData, onInputChange }: any) => (
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
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Quantidade de cash para todos os jogadores
      </p>
    </div>

    {/* Razão do Envio */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Razão do Envio
      </label>
      <textarea
        name="creditReason"
        value={formData.creditReason}
        onChange={onInputChange}
        rows={3}
        placeholder="Ex: Vencedores do Sorteio Semanal"
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
        required
      />
    </div>
  </>
);

const SendCash: React.FC<SendCashProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    loginAccounts: '',
    cashAmount: '',
    creditReason: '',
  });

  const handleSendCashAction = async () => {
    const result = await apiService.creditCashToList({
      nexonIdList: formData.loginAccounts,
      cashAmount: parseInt(formData.cashAmount),
      creditReason: formData.creditReason,
      adminDiscordId: user?.profile?.discordId || 'system'
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao enviar cash');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.loginAccounts.trim()) return false;
    if (!formData.cashAmount.trim()) return false;
    if (!formData.creditReason.trim()) return false;
    
    const cashAmount = parseInt(formData.cashAmount);
    if (isNaN(cashAmount) || cashAmount <= 0) return false;
    
    return true;
  }, [formData]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja enviar ${formData.cashAmount} de Cash para os jogadores: ${formData.loginAccounts}?

Razão: "${formData.creditReason}"`;
  }, [formData.cashAmount, formData.loginAccounts, formData.creditReason]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ENVIAR CASH"
      confirmTitle="Confirmar Envio de Cash"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Enviar Cash"
      action={handleSendCashAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos corretamente."
    >
      <SendCashFormFields />
    </ActionFormModal>
  );
};

export default SendCash;