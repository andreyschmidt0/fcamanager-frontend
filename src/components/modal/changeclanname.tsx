import React, { useState, useCallback, useEffect } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';
import { useClan } from '../../contexts/ClanContext';

interface ChangeClanNameProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeClanName: React.FC<ChangeClanNameProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedClan } = useClan();
  const [formData, setFormData] = useState({
    oidGuild: '',
    newClanName: ''
  });

  // Preencher automaticamente o campo oidGuild quando um clan for selecionado
  useEffect(() => {
    if (selectedClan && isOpen) {
      setFormData(prev => ({
        ...prev,
        oidGuild: selectedClan.oidGuild.toString()
      }));
    } else if (isOpen && !selectedClan) {
      // Limpar campo quando não há clan selecionado
      setFormData(prev => ({
        ...prev,
        oidGuild: ''
      }));
    }
  }, [selectedClan, isOpen]);

  const handleChangeClanNameAction = async () => {
    // Validar oidGuild
    const oidGuildNum = parseInt(formData.oidGuild);
    if (isNaN(oidGuildNum) || oidGuildNum <= 0) {
      throw new Error('OID do Clã inválido');
    }

    const result = await apiService.changeClanName({
      oidGuild: oidGuildNum,
      newClanName: formData.newClanName
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao alterar nome do clã');
    }

    return result;
  };

  const customValidation = useCallback(() => {
    return (
      formData.oidGuild.trim() !== '' &&
      formData.newClanName.trim() !== '' &&
      formData.newClanName.length >= 3 &&
      formData.newClanName.length <= 16 &&
      !isNaN(parseInt(formData.oidGuild)) &&
      parseInt(formData.oidGuild) > 0
    );
  }, [formData.oidGuild, formData.newClanName]);

  const getConfirmDescription = useCallback(() => {
    const clanInfo = selectedClan
      ? `${selectedClan.strName} (OID: ${formData.oidGuild})`
      : `OID: ${formData.oidGuild}`;
    return `Tem certeza que deseja alterar o nome do clã ${clanInfo} para: "${formData.newClanName}"?`;
  }, [formData.oidGuild, formData.newClanName, selectedClan]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR NOME DO CLÃ"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar"
      action={handleChangeClanNameAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos corretamente. O nome do clã deve ter entre 3 e 16 caracteres."
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            OID do Clã (Guild)
          </label>
          <input
            type="number"
            name="oidGuild"
            placeholder="Ex: 12345"
            value={formData.oidGuild}
            onChange={(e) => setFormData({ ...formData, oidGuild: e.target.value })}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            required
            min="1"
          />
          {selectedClan && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Clan selecionado: {selectedClan.strName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Novo Nome do Clã
          </label>
          <input
            type="text"
            name="newClanName"
            placeholder="Digite o novo nome do clã"
            value={formData.newClanName}
            onChange={(e) => setFormData({ ...formData, newClanName: e.target.value })}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            required
            maxLength={16}
          />
          <p className="text-xs text-gray-400 mt-1">Máximo 16 caracteres</p>
        </div>
      </div>
    </ActionFormModal>
  );
};

export default ChangeClanName;
