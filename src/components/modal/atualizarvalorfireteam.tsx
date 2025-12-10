import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';

interface AtualizarValorFireteamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AtualizarValorFireteamFormFields = ({ formData, onInputChange }: any) => (
    <>
      {/* Map Name*/}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Nome do Mapa
        </label>
        <select
          name="mapName"
          value={formData.mapName}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        >
          <option value="">Selecione um mapa</option>
          <option value="Desert Thunder">Desert Thunder</option>
          <option value="Cabin Fever">Cabin Fever</option>
          <option value="Black Lung">Black Lung</option>
          <option value="Desert Fox">Desert Fox</option>
          <option value="Nemexis HQ">Nemexis HQ</option>
          <option value="Nemexis Labs">Nemexis Labs</option>
          <option value="Dead Water">Dead Water</option>
          <option value="Outpost 31">Outpost 31</option>
        </select>
      </div>

      {/* Attribute Name */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Atributo
        </label>
        <select
          name="attributeName"
          value={formData.attributeName}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        >
          <option value="">Selecione um atributo</option>
          <option value="Kills">Kills</option>
          <option value="Deaths">Deaths</option>
          <option value="Headshots">Headshots</option>
          <option value="Combos">Combos</option>
          <option value="Matches">Matches</option>
          <option value="Wins">Wins</option>
        </select>
      </div>

      {/* New Value */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Novo Valor
        </label>
        <input
          type="number"
          name="newValue"
          value={formData.newValue}
          onChange={onInputChange}
          min="0"
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        />
      </div>
    </>
);

const AtualizarValorFireteamModal: React.FC<AtualizarValorFireteamModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    mapName: '',
    attributeName: '',
    newValue: ''
  });

  const handleUpdateFireteamAction = async () => {
    const updateData = {
      discordId: formData.discordId,
      loginAccount: formData.loginAccount,
      mapName: formData.mapName,
      attributeName: formData.attributeName,
      newValue: parseInt(formData.newValue) || 0
    };

    const result = await apiService.updateFireteamStat(updateData);
    
    if (!result.success) {
      throw new Error(result.error || result.message || 'Erro desconhecido');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.mapName.trim() !== '' && 
           formData.attributeName.trim() !== '' && 
           formData.newValue.trim() !== '';
  }, [formData.mapName, formData.attributeName, formData.newValue]);

  const getConfirmDescription = useCallback(() => {
    const playerName = formData.loginAccount;
    return `Tem certeza que deseja alterar o valor de ${formData.attributeName} no mapa ${formData.mapName} para ${formData.newValue} do jogador: ${playerName} (Discord: ${formData.discordId})?`;
  }, [formData.loginAccount, formData.discordId, formData.mapName, formData.attributeName, formData.newValue]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="ATUALIZAR VALOR FIRETEAM"
      confirmTitle="Confirmar Alteração"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Alterar"
      action={handleUpdateFireteamAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos obrigatórios."
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
      <AtualizarValorFireteamFormFields />
    </ActionFormModal>
  );
};

export default AtualizarValorFireteamModal;