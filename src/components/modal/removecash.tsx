import React, { useState, useCallback, useEffect } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';
import { usePlayer } from '../../contexts/PlayerContext';

interface RemoveCashProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const RemoveCashFormFields = ({ formData, onInputChange }: any) => (
  <>
    {/* Login da Conta */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Login da conta (strNexonID)
      </label>
      <input
        type="text"
        name="loginAccount"
        placeholder="Ex: schmidt"
        value={formData.loginAccount}
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Login do jogador que terá o cash removido
      </p>
    </div>

    {/* Quantidade de Cash a Remover */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Quantidade de Cash a Remover
      </label>
      <input
        type="number"
        name="cashAmount"
        min="1"
        placeholder="Ex: 5000"
        value={formData.cashAmount}
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Quantidade de cash que será removido do jogador
      </p>
    </div>

    {/* Razão da Remoção */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Razão da Remoção
      </label>
      <textarea
        name="removalReason"
        value={formData.removalReason}
        onChange={onInputChange}
        rows={3}
        placeholder="Ex: Creditado incorretamente"
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
        required
      />
    </div>
  </>
);

const RemoveCash: React.FC<RemoveCashProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    loginAccount: '',
    cashAmount: '',
    removalReason: '',
  });

  // Preencher automaticamente o login quando um player é selecionado
  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        loginAccount: selectedPlayer.nexonId || ''
      }));
    }
  }, [selectedPlayer, isOpen]);

  const handleRemoveCashAction = async () => {
    const result = await apiService.removeCashFromUser({
      targetNexonId: formData.loginAccount,
      amountToRemove: parseInt(formData.cashAmount),
      reason: formData.removalReason
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao remover cash');
    }

    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.loginAccount.trim()) return false;
    if (!formData.cashAmount.trim()) return false;
    if (!formData.removalReason.trim()) return false;

    const cashAmount = parseInt(formData.cashAmount);
    if (isNaN(cashAmount) || cashAmount <= 0) return false;

    return true;
  }, [formData]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja remover ${formData.cashAmount} de Cash do jogador: ${formData.loginAccount}?

Razão: "${formData.removalReason}"

⚠️ ATENÇÃO: Esta ação irá remover cash do jogador!`;
  }, [formData.cashAmount, formData.loginAccount, formData.removalReason]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVER CASH"
      confirmTitle="Confirmar Remoção de Cash"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Remover Cash"
      action={handleRemoveCashAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos corretamente."
    >
      <RemoveCashFormFields />
    </ActionFormModal>
  );
};

export default RemoveCash;
