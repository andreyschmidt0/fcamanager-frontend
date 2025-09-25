import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface TransferDiscordProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const TransferDiscordFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Novo Discord ID
    </label>
    <input
      type="text"
      name="newDiscordID"
      placeholder="Digite o novo Discord ID (ex: 134123421342131)"
      value={formData.newDiscordID}
      onChange={onInputChange}
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const TransferDiscord: React.FC<TransferDiscordProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    newDiscordID: '',
  });

  const handleTransferDiscordAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const changeDiscordData = {
      targetOidUser: validationResult.player.oidUser,
      newDiscordID: formData.newDiscordID,
      adminDiscordId: user?.profile?.discordId || 'system'
    };

    const result = await apiService.changeUserDiscordId(changeDiscordData);
    
    if (!result.success) {
      throw new Error(result.error || result.message || 'Erro ao alterar Discord ID');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.newDiscordID.trim() !== '' && 
           formData.newDiscordID.length >= 17 && 
           formData.newDiscordID.length <= 19 &&
           /^\d+$/.test(formData.newDiscordID);
  }, [formData.newDiscordID]);

  const getConfirmDescription = useCallback(() => {
    return `Você tem certeza que deseja alterar o Discord ID do jogador ${formData.loginAccount} (Discord atual: ${formData.discordId}) para o novo Discord ID: ${formData.newDiscordID}?`;
  }, [formData.loginAccount, formData.discordId, formData.newDiscordID]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR DISCORD ID"
      confirmTitle="Confirmar Ação"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, alterar Discord ID"
      action={handleTransferDiscordAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      showPlayerFields={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, digite um Discord ID válido (17-19 dígitos numéricos)."
      playerFieldsConfig={{
        labels: {
          discordId: 'Discord ID do usuário alvo',
          loginAccount: 'Login da conta (strNexonID)'
        },
        placeholders: {
          discordId: 'Ex: 123456789012345678',
          loginAccount: 'Digite o strNexonID da conta'
        }
      }}
    >
      <TransferDiscordFormFields />
    </ActionFormModal>
  );
};

export default TransferDiscord;