import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';

interface UnbanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const UnbanFormFields = ({ formData, onInputChange }: any) => (
    <>
      {/* Motivo do Desbanimento */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Motivo do desbanimento
        </label>
        <textarea
          name="unbanReason"
          value={formData.unbanReason}
          onChange={onInputChange}
          rows={3}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
          required
        />
      </div>

      {/* Escopo */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Escopo
        </label>
        <select
          name="unbanScope"
          value={formData.unbanScope}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        >
          <option value="P">P - Só principal</option>
          <option value="A">A - Todas do MAC</option>
        </select>
      </div>

      {/* Limpar Bloqueio do MAC */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Limpar Bloqueio do MAC
        </label>
        <select
          name="clearMacBlock"
          value={formData.clearMacBlock}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        >
          <option value="N">N - Não</option>
          <option value="S">S - Sim</option>
        </select>
      </div>
    </>
);

const UnbanModal: React.FC<UnbanModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    unbanReason: '',
    unbanScope: 'P',
    clearMacBlock: 'N'
  });

  const handleUnbanAction = async () => {
    const unbanData = {
      discordId: formData.discordId,
      loginAccount: formData.loginAccount,
      reason: formData.unbanReason,
      unbanScope: formData.unbanScope,
      clearMacBlockEntry: formData.clearMacBlock
    };

    const result = await apiService.unbanUser(unbanData);
    
    if (!result.success) {
      throw new Error(result.error || result.message || 'Erro desconhecido');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.unbanReason.trim() !== '';
  }, [formData.unbanReason]);

  const getConfirmDescription = useCallback(() => {
    const playerName = formData.loginAccount;
    return `Tem certeza que deseja desbanir o jogador: ${playerName} (Discord: ${formData.discordId})?`;
  }, [formData.loginAccount, formData.discordId]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="DESBANIR JOGADOR"
      confirmTitle="Confirmar Ação"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Desbanir"
      action={handleUnbanAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha o motivo do desbanimento."
      playerFieldsConfig={{
        labels: {
          discordId: 'Discord ID do usuário alvo',
          loginAccount: 'Login da conta'
        },
        placeholders: {
          loginAccount: 'Digite o strNexonID da conta'
        }
      }}
    >
      <UnbanFormFields />
    </ActionFormModal>
  );
};

export default UnbanModal;