import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';

interface RemoveExpProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const RemoveExpFormFields = ({ formData, onInputChange }: any) => (
  <>
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Nível de Patente (Grade Level)
      </label>
      <input
        type="number"
        name="targetGradeLevel"
        value={formData.targetGradeLevel}
        onChange={onInputChange}
        placeholder="Ex: 30 (para patente correspondente)"
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
        min="1"
        max="100"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Razão do Downgrade
      </label>
      <textarea
        name="reason"
        value={formData.reason}
        onChange={onInputChange}
        rows={3}
        placeholder="Ex: Correção de rank após punição."
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
        required
      />
    </div>
  </>
);

const RemoveExp: React.FC<RemoveExpProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    targetGradeLevel: '',
    reason: ''
  });

  const handleRemoveExpAction = async () => {
    // Fazer a validação dupla através do ActionFormModal
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const result = await apiService.setUserRank({
      discordId: formData.discordId,
      loginAccount: formData.loginAccount,
      targetGradeLevel: parseInt(formData.targetGradeLevel),
      reason: formData.reason,
      adminDiscordId: user?.profile?.discordId || 'system'
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao aplicar downgrade');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.targetGradeLevel.trim()) return false;
    if (!formData.reason.trim()) return false;
    
    const gradeLevel = parseInt(formData.targetGradeLevel);
    if (isNaN(gradeLevel) || gradeLevel < 1 || gradeLevel > 100) return false;
    
    return true;
  }, [formData.targetGradeLevel, formData.reason]);

  const getConfirmDescription = useCallback(() => {
    return `ATENÇÃO: Tem certeza que deseja aplicar DOWNGRADE DE RANK ao jogador ${formData.loginAccount} (Discord: ${formData.discordId})?\n\nNovo Nível de Patente: ${formData.targetGradeLevel}\nRazão: "${formData.reason}"\n\nEsta ação reduzirá permanentemente o rank do jogador!`;
  }, [formData.loginAccount, formData.discordId, formData.targetGradeLevel, formData.reason]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVER EXP"
      confirmTitle="Confirmar Downgrade de Rank"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Aplicar Downgrade"
      action={handleRemoveExpAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, informe o nível de patente válido (1-100) e a razão do downgrade."
      playerFieldsConfig={{
        labels: {
          discordId: 'Discord ID do jogador alvo',
          loginAccount: 'Login da Conta (strNexonID)'
        },
        placeholders: {
          discordId: 'Digite o Discord ID do jogador',
          loginAccount: 'Digite o strNexonID da conta'
        }
      }}
    >
      <RemoveExpFormFields />
    </ActionFormModal>
  );
};

export default RemoveExp;