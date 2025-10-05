import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface RemoveAccountProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const RemoveAccountFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Motivo da Remoção
    </label>
    <textarea
      name="reason"
      placeholder="Motivo da exclusão"
      value={formData.reason}
      onChange={onInputChange}
      rows={3}
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
      required
    />
  </div>
);

const RemoveAccount: React.FC<RemoveAccountProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    reason: ''
  });

  const handleRemoveAccountAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.removeAccount({
      targetNexonId: formData.loginAccount,
      reason: formData.reason,
      targetOidUser: validationResult.player.oidUser
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao remover conta');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.reason.trim() !== '';
  }, [formData.reason]);

  const getConfirmDescription = useCallback(() => {
    return `ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE a conta do jogador ${formData.loginAccount} (Discord: ${formData.discordId})?

Motivo: "${formData.reason}"

Esta ação é IRREVERSÍVEL!`;
  }, [formData.loginAccount, formData.discordId, formData.reason]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVER CONTA"
      confirmTitle="Confirmar Remoção de Conta"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Remover Permanentemente"
      action={handleRemoveAccountAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, informe o motivo da remoção da conta."
      playerFieldsConfig={{
        labels: {
          discordId: 'Discord ID do usuário alvo',
          loginAccount: 'Login da Conta'
        },
        placeholders: {
          discordId: 'Ex: 123456789012345678',
          loginAccount: 'Digite o strNexonID da conta'
        }
      }}
    >
      <RemoveAccountFormFields />
    </ActionFormModal>
  );
};

export default RemoveAccount;