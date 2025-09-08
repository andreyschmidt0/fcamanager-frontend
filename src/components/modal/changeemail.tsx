import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface ChangeEmailProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const EmailFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Novo Email
    </label>
    <input
      type="email"
      name="newemail"
      placeholder="novo@email.com"
      value={formData.newemail}
      onChange={onInputChange}
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const ChangeEmail: React.FC<ChangeEmailProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    newemail: ''
  });

  const handleChangeEmailAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.changeEmail({
      targetNexonId: formData.loginAccount,
      newEmail: formData.newemail,
      adminDiscordId: user?.profile?.discordId || 'system',
      targetOidUser: validationResult.player.oidUser
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar email');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.newemail.trim() !== '' && 
           formData.newemail.includes('@') && 
           formData.newemail.includes('.');
  }, [formData.newemail]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja alterar o email do jogador: ${formData.loginAccount} (Discord: ${formData.discordId}) para: ${formData.newemail}?`;
  }, [formData.loginAccount, formData.discordId, formData.newemail]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR EMAIL"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar"
      action={handleChangeEmailAction}
      formData={formData}
      onFormDataChange={setFormData}
      customValidation={customValidation}
      customValidationMessage="Por favor, digite um email válido."
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
      <EmailFormFields />
    </ActionFormModal>
  );
};

export default ChangeEmail;