import React, { useState, useCallback } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const BanFormFields = ({ formData, onInputChange }: any) => (
    <>
      {/* Duração do Ban */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Duração do ban (999 = permanente)
        </label>
        <input
          type="text"
          name="banDuration"
          value={formData.banDuration}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        />
      </div>

      {/* Motivo do Banimento */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Motivo do banimento
        </label>
        <textarea
          name="banReason"
          value={formData.banReason}
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
          name="banScope"
          value={formData.banScope}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        >
          <option value="S">S - Banir apenas o usuário específico</option>
          <option value="M">M - Banir todas as contas no mesmo MAC</option>
        </select>
      </div>

      {/* Opções em linha */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bloquear MAC */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Bloquear MAC
          </label>
          <select
            name="blockMac"
            value={formData.blockMac}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          >
            <option value="N">N - Não bloquear MAC</option>
            <option value="S">S - Sim, bloquear MAC</option>
          </select>
        </div>

        {/* Excluir Clãs */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Excluir Clãs
          </label>
          <select
            name="deleteClans"
            value={formData.deleteClans}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          >
            <option value="N">N - Não excluir clãs</option>
            <option value="S">S - Sim, excluir clãs</option>
          </select>
        </div>
      </div>
    </>
);

const BanModal: React.FC<BanModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    banDuration: '',
    banReason: '',
    banScope: 'S',
    blockMac: 'N',
    deleteClans: 'N'
  });

  const handleBanAction = async () => {
    const banData = {
      discordId: formData.discordId,
      loginAccount: formData.loginAccount,
      banDuration: (parseInt(formData.banDuration) || 1) as number,
      banReason: formData.banReason,
      banScope: formData.banScope || 'S',
      addMacToBlockList: formData.blockMac || 'N',
      excluirClans: formData.deleteClans || 'N'
    };

    const result = await apiService.banUser(banData);
    
    if (!result.success) {
      throw new Error(result.error || result.message || 'Erro desconhecido');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    return formData.banDuration.trim() !== '' && formData.banReason.trim() !== '';
  }, [formData.banDuration, formData.banReason]);

  const getConfirmDescription = useCallback(() => {
    const playerName = formData.loginAccount;
    const duration = formData.banDuration === '999' ? 'tempo permanente' : `${formData.banDuration} dias`;
    return `Tem certeza que deseja banir o jogador: ${playerName} (Discord: ${formData.discordId}) por ${duration}?`;
  }, [formData.loginAccount, formData.discordId, formData.banDuration]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="BANIR JOGADOR"
      confirmTitle="Confirmar Ação"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Banir"
      action={handleBanAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={true}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha a duração e o motivo do banimento."
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
      <BanFormFields />
    </ActionFormModal>
  );
};

export default BanModal;