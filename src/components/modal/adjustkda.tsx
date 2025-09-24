import React, { useState, useCallback, useEffect } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';

interface AdjustKDAProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdjustKDAFormFields = ({ formData, onInputChange }: any) => (
  <>
    {/* Reduzir Kills */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Reduzir Kills em (%)
      </label>
      <input
        type="number"
        name="reduceKillPct"
        min="0"
        max="100"
        placeholder="Ex: 30"
        value={formData.reduceKillPct}
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
      />
      <p className="mt-1 text-xs text-gray-400">
        Porcentagem que será reduzida dos kills atuais (0-100)
      </p>
    </div>

    {/* Configurar KDA como 1.0 */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Configurar KDA como 1.0
      </label>
      <select
        name="setKDAOne"
        value={formData.setKDAOne}
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
      >
        <option value={0}>Não - Usar reduceDeathPct</option>
        <option value={1}>Sim - Igualar mortes aos kills</option>
      </select>
      <p className="mt-1 text-xs text-gray-400">
        Se "Sim", as mortes serão igualadas aos kills após redução
      </p>
    </div>

    {/* Reduzir Deaths - só aparece se setKDAOne for 0 */}
    {Number(formData.setKDAOne) === 0 && (
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Reduzir Deaths em (%)
        </label>
        <input
          type="number"
          name="reduceDeathPct"
          min="0"
          max="100"
          placeholder="Ex: 20"
          value={formData.reduceDeathPct}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        />
        <p className="mt-1 text-xs text-gray-400">
          Porcentagem que será reduzida das mortes atuais (0-100)
        </p>
      </div>
    )}
  </>
);

const AdjustKDA: React.FC<AdjustKDAProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    reduceKillPct: '',
    reduceDeathPct: '',
    setKDAOne: 0
  });

  // Limpar reduceDeathPct quando setKDAOne muda para 1
  useEffect(() => {
    if (Number(formData.setKDAOne) === 1 && formData.reduceDeathPct) {
      setFormData(prev => ({
        ...prev,
        reduceDeathPct: ''
      }));
    }
  }, [formData.setKDAOne]);

  const handleAdjustKDAAction = async () => {
    const adjustData = {
      discordId: formData.discordId,
      loginAccount: formData.loginAccount,
      reduceKillPct: parseInt(formData.reduceKillPct),
      reduceDeathPct: Number(formData.setKDAOne) === 0 ? parseInt(formData.reduceDeathPct) : undefined,
      setKDAOne: Number(formData.setKDAOne)
    };

    const result = await apiService.adjustUserKD(adjustData);

    if (!result.success) {
      throw new Error(result.error || result.message || 'Erro desconhecido');
    }

    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.reduceKillPct.trim()) return false;

    const killPct = parseInt(formData.reduceKillPct);
    if (isNaN(killPct) || killPct < 0 || killPct > 100) return false;

    // Se setKDAOne for 0, reduceDeathPct é obrigatório
    if (Number(formData.setKDAOne) === 0) {
      if (!formData.reduceDeathPct.trim()) return false;
      const deathPct = parseInt(formData.reduceDeathPct);
      if (isNaN(deathPct) || deathPct < 0 || deathPct > 100) return false;
    }

    return true;
  }, [formData.reduceKillPct, formData.reduceDeathPct, formData.setKDAOne]);

  const getConfirmDescription = useCallback(() => {
    const playerName = formData.loginAccount;
    const killReduction = `${formData.reduceKillPct}%`;

    if (Number(formData.setKDAOne) === 1) {
      return `Tem certeza que deseja ajustar o KDA do jogador: ${playerName} (Discord: ${formData.discordId})?

• Kills serão reduzidos em ${killReduction}
• Mortes serão igualadas aos kills (KDA = 1.0)`;
    } else {
      const deathReduction = `${formData.reduceDeathPct}%`;
      return `Tem certeza que deseja ajustar o KDA do jogador: ${playerName} (Discord: ${formData.discordId})?

• Kills serão reduzidos em ${killReduction}
• Mortes serão reduzidas em ${deathReduction}`;
    }
  }, [formData.loginAccount, formData.discordId, formData.reduceKillPct, formData.reduceDeathPct, formData.setKDAOne]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="AJUSTAR KDA"
      confirmTitle="Confirmar Ajuste de KDA"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Ajustar KDA"
      action={handleAdjustKDAAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha os campos corretamente."
      playerFieldsConfig={{
        labels: {
          discordId: 'Discord ID do usuário alvo',
          loginAccount: 'Login da conta (strNexonID)'
        },
        placeholders: {
          loginAccount: 'Digite o strNexonID da conta'
        }
      }}
    >
      <AdjustKDAFormFields />
    </ActionFormModal>
  );
};

export default AdjustKDA;