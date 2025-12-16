import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import PatentDropdown from '../common/PatentDropdown';
import apiService from '../../services/api-tauri.service';

interface RemoveExpProps {
  isOpen: boolean;
  onClose: () => void;
}

const toNumberOrNull = (value: any): number | null => {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const RemoveExpFormFields = ({ formData, onInputChange, validatedPlayer }: any) => {
  const mode = `${formData.mode ?? '1'}`;
  const isRankDowngrade = mode === '0';

  const currentExp = toNumberOrNull(validatedPlayer?.EXP);
  const expToRemove = parseInt(formData.expToRemove);
  const expAfter = currentExp === null || Number.isNaN(expToRemove) ? null : Math.max(0, currentExp - expToRemove);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Modo (0/1)
        </label>
        <select
          name="mode"
          value={mode}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors"
          required
        >
          <option value="0">0 - Rebaixar patente (Downgrade)</option>
          <option value="1">1 - Remover EXP (quantia)</option>
        </select>
        <p className="mt-1 text-xs text-gray-400">
          0 = Executa BSP_SetUserRankByLevel | 1 = Executa BSP_RemoveUserExp
        </p>
      </div>

      {isRankDowngrade ? (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Nível de Patente (Grade Level)
          </label>
          <PatentDropdown
            name="targetGradeLevel"
            value={formData.targetGradeLevel}
            onChange={onInputChange}
            required
            placeholder="Selecione uma patente"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Quantidade de EXP a remover
          </label>
          <input
            type="number"
            name="expToRemove"
            min="1"
            placeholder="Ex: 500000"
            value={formData.expToRemove}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors"
            required
          />

          {currentExp !== null && (
            <p className="mt-1 text-xs text-gray-300">
              EXP atual: <span className="font-semibold">{currentExp.toLocaleString('pt-BR')}</span>
              {'  '}|{'  '}
              EXP após remoção:{' '}
              <span className="font-semibold">{(expAfter ?? currentExp).toLocaleString('pt-BR')}</span>
            </p>
          )}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          {isRankDowngrade ? 'Razão do Downgrade' : 'Razão da remoção'}
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={onInputChange}
          rows={3}
          placeholder={isRankDowngrade ? 'Ex: Correção de rank após punição.' : 'Ex: Punição por uso PowerLevel.'}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
          required
        />
      </div>
    </>
  );
};

const RemoveExp: React.FC<RemoveExpProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    mode: '1',
    targetGradeLevel: '',
    expToRemove: '',
    reason: ''
  });

  const handleRemoveExpAction = async () => {
    const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
    if (!validationResult.isValid || !validationResult.player?.oidUser) {
      throw new Error('Jogador não pôde ser validado. Verifique os dados informados.');
    }

    const isRankDowngrade = `${formData.mode ?? '1'}` === '0';

    const result = isRankDowngrade
      ? await apiService.setUserRank({
          discordId: formData.discordId,
          loginAccount: formData.loginAccount,
          targetGradeLevel: parseInt(formData.targetGradeLevel),
          reason: formData.reason
        })
      : await apiService.removeUserExp({
          discordId: formData.discordId,
          loginAccount: formData.loginAccount,
          expToRemove: parseInt(formData.expToRemove),
          reason: formData.reason,
          targetOidUser: validationResult.player.oidUser
        });

    if (!result.success) {
      throw new Error(result.error || (isRankDowngrade ? 'Erro ao aplicar downgrade' : 'Erro ao remover EXP'));
    }

    return result;
  };

  const customValidation = useCallback(() => {
    const isRankDowngrade = `${formData.mode ?? '1'}` === '0';

    if (isRankDowngrade) {
      if (!formData.targetGradeLevel.trim()) return false;
      if (!formData.reason.trim()) return false;

      const gradeLevel = parseInt(formData.targetGradeLevel);
      if (Number.isNaN(gradeLevel) || gradeLevel < 1 || gradeLevel > 100) return false;

      return true;
    }

    if (!formData.expToRemove.trim()) return false;
    if (!formData.reason.trim()) return false;

    const expToRemove = parseInt(formData.expToRemove);
    if (Number.isNaN(expToRemove) || expToRemove <= 0) return false;

    return true;
  }, [formData.mode, formData.targetGradeLevel, formData.expToRemove, formData.reason]);

  const getConfirmDescription = useCallback(({ formData, validatedPlayer }: any) => {
    const isRankDowngrade = `${formData.mode ?? '1'}` === '0';

    if (isRankDowngrade) {
      return `ATENÇÃO: Tem certeza que deseja aplicar DOWNGRADE DE RANK ao jogador ${formData.loginAccount} (Discord: ${formData.discordId})?\n\nNovo Nível de Patente: ${formData.targetGradeLevel}\nRazão: "${formData.reason}"\n\nEsta ação reduzirá permanentemente o rank do jogador!`;
    }

    const currentExp = toNumberOrNull(validatedPlayer?.EXP);
    const expToRemove = parseInt(formData.expToRemove);
    const expAfter = currentExp === null || Number.isNaN(expToRemove) ? null : Math.max(0, currentExp - expToRemove);

    const expLines =
      currentExp === null
        ? `EXP a remover: ${formData.expToRemove}`
        : `EXP atual: ${currentExp.toLocaleString('pt-BR')}\nEXP a remover: ${expToRemove.toLocaleString('pt-BR')}\nEXP após remoção: ${(expAfter ?? currentExp).toLocaleString('pt-BR')}`;

    return `ATENÇÃO: Tem certeza que deseja REMOVER EXP do jogador ${formData.loginAccount} (Discord: ${formData.discordId})?\n\n${expLines}\nRazão: "${formData.reason}"\n\nEsta ação removerá permanentemente EXP do jogador!`;
  }, []);

  const isRankDowngrade = `${formData.mode ?? '1'}` === '0';

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVER EXP"
      confirmTitle={isRankDowngrade ? 'Confirmar Downgrade de Rank' : 'Confirmar Remoção de EXP'}
      confirmDescription={getConfirmDescription}
      confirmActionText={isRankDowngrade ? 'Sim, Aplicar Downgrade' : 'Sim, Remover EXP'}
      action={handleRemoveExpAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage={
        isRankDowngrade
          ? 'Por favor, informe o nível de patente válido (1-100) e a razão do downgrade.'
          : 'Por favor, informe um valor de EXP válido e a razão da remoção.'
      }
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
