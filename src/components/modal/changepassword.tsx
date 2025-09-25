import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const PasswordFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Nova senha
    </label>
    <input
      type="text"
      name="newPassword"
      placeholder="Digite a nova senha"
      value={formData.newPassword}
      onChange={onInputChange}
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const ChangePassword: React.FC<ChangePasswordProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    newPassword: ''
  });

  const handleChangePasswordAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.changePassword({
      targetNexonId: formData.loginAccount,
      newPassword: formData.newPassword,
      adminDiscordId: user?.profile?.discordId || 'system',
      targetOidUser: validationResult.player.oidUser
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar senha');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.newPassword.trim() !== '' && formData.newPassword.length >= 3;
  }, [formData.newPassword]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja alterar a senha do jogador: ${formData.loginAccount} (Discord: ${formData.discordId})?`;
  }, [formData.loginAccount, formData.discordId]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR SENHA"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar Senha"
      action={handleChangePasswordAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      showPlayerFields={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, digite uma senha válida (mínimo 3 caracteres)."
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
      <PasswordFormFields />
    </ActionFormModal>
  );
};

export default ChangePassword;