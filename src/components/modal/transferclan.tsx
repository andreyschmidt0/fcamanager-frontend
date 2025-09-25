import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface TransferClanProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const TransferClanFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      OIDUSER do novo líder
    </label>
    <input
      type="number"
      name="oidusernovolider"
      placeholder="Digite o oidUser do novo líder"
      value={formData.oidusernovolider}
      onChange={onInputChange}
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const TransferClan: React.FC<TransferClanProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    oidusernovolider: '',
  });

  const handleTransferClanAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const transferData = {
      oldLeaderOidUser: validationResult.player.oidUser,
      newLeaderOidUser: parseInt(formData.oidusernovolider),
      adminDiscordId: user?.profile?.discordId || 'system'
    };

    const result = await apiService.transferClanLeadership(transferData);

    if (!result.success) {
      throw new Error(result.error || 'Erro ao transferir liderança do clã');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.oidusernovolider.trim() !== '' && !isNaN(parseInt(formData.oidusernovolider));
  }, [formData.oidusernovolider]);

  const getConfirmDescription = useCallback(() => {
    return `Você tem certeza que deseja transferir o clã do jogador ${formData.loginAccount} (Discord: ${formData.discordId}) para o oidUser: ${formData.oidusernovolider}?`;
  }, [formData.loginAccount, formData.discordId, formData.oidusernovolider]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="TRANSFERIR CLÃ"
      confirmTitle="Confirmar Ação"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, transferir"
      action={handleTransferClanAction}
      formData={formData}
      requiresPlayerValidation={true}
      showPlayerFields={true}
      onFormDataChange={setFormData}
      customValidation={customValidation}
      customValidationMessage="Por favor, digite um oidUser válido para o novo líder."
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
      <TransferClanFormFields />
    </ActionFormModal>
  );
};

export default TransferClan;