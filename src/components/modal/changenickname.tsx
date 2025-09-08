import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface ChangeNicknameProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const ChangeNicknameFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Novo Nickname
    </label>
    <input
      type="text"
      name="new_value"
      value={formData.new_value}
      onChange={onInputChange}
      placeholder="Digite o novo nickname"
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const ChangeNickname: React.FC<ChangeNicknameProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    new_value: ''
  });

  const handleChangeNicknameAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.changeNickname({
      targetNexonId: formData.loginAccount,
      newNickname: formData.new_value,
      adminDiscordId: user?.profile?.discordId || 'system',
      targetOidUser: validationResult.player.oidUser
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar nickname');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.new_value.trim() !== '';
  }, [formData.new_value]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja alterar o nickname do jogador ${formData.loginAccount} (Discord: ${formData.discordId}) para: "${formData.new_value}"?`;
  }, [formData.loginAccount, formData.discordId, formData.new_value]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR NICKNAME"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar"
      action={handleChangeNicknameAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, informe o novo nickname."
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
      <ChangeNicknameFormFields />
    </ActionFormModal>
  );
};

export default ChangeNickname;