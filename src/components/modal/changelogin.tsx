import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface ChangeLoginProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const ChangeLoginFormFields = ({ formData, onInputChange }: any) => (
  <div>
    <label className="block text-sm font-medium text-white mb-2">
      Novo Login
    </label>
    <input
      type="text"
      name="new_value"
      value={formData.new_value}
      onChange={onInputChange}
      placeholder="Digite o novo Login"
      className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      required
    />
  </div>
);

const ChangeLogin: React.FC<ChangeLoginProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    new_value: ''
  });

  const handleChangeLoginAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.changeLogin({
      targetNexonId: formData.loginAccount,
      newLogin: formData.new_value,
      targetOidUser: validationResult.player.oidUser
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar login');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.new_value.trim() !== '';
  }, [formData.new_value]);

  const getConfirmDescription = useCallback(() => {
    return `Tem certeza que deseja alterar o login do jogador ${formData.loginAccount} (Discord: ${formData.discordId}) para: "${formData.new_value}"?`;
  }, [formData.loginAccount, formData.discordId, formData.new_value]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR LOGIN"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar"
      action={handleChangeLoginAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, informe o novo login."
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
      <ChangeLoginFormFields />
    </ActionFormModal>
  );
};

export default ChangeLogin;