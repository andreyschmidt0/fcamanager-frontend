import React, { useState, useCallback, useEffect } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';
import { useClan } from '../../contexts/ClanContext';

interface RemoveClanEmblemProps {
  isOpen: boolean;
  onClose: () => void;
}

// Componente movido para fora para evitar re-criação
const RemoveClanEmblemFormFields = ({ formData, onInputChange }: any) => {
  const { selectedClan } = useClan();
  const [fetchedClanName, setFetchedClanName] = useState<string>('');
  const [isValidatingClan, setIsValidatingClan] = useState(false);
  const [clanValidationError, setClanValidationError] = useState<string>('');

  // Função para buscar nome do clã por ID
  const fetchClanNameById = async (clanId: string) => {
    if (!clanId || clanId.trim() === '') {
      setFetchedClanName('');
      setClanValidationError('');
      return;
    }

    setIsValidatingClan(true);
    try {
      const clan = await apiService.getClanById(clanId);
      if (clan) {
        setFetchedClanName(clan.strName || '');
        setClanValidationError('');
      } else {
        setFetchedClanName('');
        setClanValidationError('Clã não encontrado com este ID. Verifique o ID informado.');
      }
    } catch (error) {
      console.error('Erro ao buscar nome do clã:', error);
      setFetchedClanName('');
      setClanValidationError('Erro de conexão');
    } finally {
      setIsValidatingClan(false);
    }
  };

  // Auto-populate and validate when selectedClan changes
  useEffect(() => {
    if (selectedClan?.oidGuild) {
      fetchClanNameById(selectedClan.oidGuild.toString());
    }
  }, [selectedClan]);

  // Debounced validation when typing clan ID manually
  useEffect(() => {
    if (!selectedClan && formData.oidGuild && formData.oidGuild.trim() !== '') {
      const timeoutId = setTimeout(() => {
        fetchClanNameById(formData.oidGuild);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else if (!selectedClan && (!formData.oidGuild || formData.oidGuild.trim() === '')) {
      setFetchedClanName('');
      setClanValidationError('');
    }
  }, [formData.oidGuild, selectedClan]);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          ID do Clã
        </label>
        <input
          type="text"
          name="oidGuild"
          value={formData.oidGuild}
          onChange={onInputChange}
          placeholder="Digite o ID do clã"
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required
        />
        {isValidatingClan && (
          <p className="mt-2 text-sm text-blue-400">
            Validando clã...
          </p>
        )}
        {fetchedClanName && (
          <p className="mt-2 text-sm text-green-400">
            ✓ Clã encontrado: {fetchedClanName}
          </p>
        )}
        {clanValidationError && (
          <p className="mt-2 text-sm text-red-400">
            {clanValidationError}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Razão da Remoção do Emblema
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={onInputChange}
          rows={3}
          placeholder="Ex: Removido por ser clã duplicado."
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none transition-colors resize-none"
          required
        />
      </div>
    </>
  );
};

const RemoveClanEmblem: React.FC<RemoveClanEmblemProps> = ({ isOpen, onClose }) => {
  const { selectedClan } = useClan();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    oidGuild: '',
    reason: ''
  });

  // Auto-populate form with selectedClan data
  useEffect(() => {
    if (selectedClan && isOpen) {
      setFormData(prev => ({
        ...prev,
        oidGuild: selectedClan.oidGuild?.toString() || ''
      }));
    } else if (isOpen && !selectedClan) {
      setFormData({ oidGuild: '', reason: '' });
    }
  }, [selectedClan, isOpen]);

  const handleRemoveClanEmblemAction = async () => {
    // Validar se o clã existe antes de prosseguir
    if (!selectedClan) {
      const clan = await apiService.getClanById(formData.oidGuild);
      if (!clan || !clan.strName) {
        throw new Error('Clã não encontrado com este ID. Verifique o ID informado.');
      }
    }

    const result = await apiService.removeClanEmblem({
      oidGuild: parseInt(formData.oidGuild),
      reason: formData.reason
    });

    if (!result.success) {
      throw new Error(result.error || 'Erro ao remover emblema do clã');
    }

    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.oidGuild.trim()) return false;
    if (!formData.reason.trim()) return false;

    const oidGuild = parseInt(formData.oidGuild);
    if (isNaN(oidGuild) || oidGuild <= 0) return false;

    return true;
  }, [formData.oidGuild, formData.reason]);

  const getConfirmDescription = useCallback(() => {
    return `ATENÇÃO: Tem certeza que deseja REMOVER O EMBLEMA do clã "${selectedClan?.strName || 'ID: ' + formData.oidGuild}"?\n\nRazão: "${formData.reason}"\n\nEsta ação irá remover apenas o emblema do clã, mantendo o clã ativo.`;
  }, [selectedClan?.strName, formData.oidGuild, formData.reason]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="REMOVER EMBLEMA DO CLÃ"
      confirmTitle="Confirmar Remoção de Emblema"
      confirmDescription={getConfirmDescription()}
      confirmActionText="Sim, Remover Emblema"
      action={handleRemoveClanEmblemAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, informe um ID de clã válido e a razão da remoção do emblema."
    >
      <RemoveClanEmblemFormFields />
    </ActionFormModal>
  );
};

export default RemoveClanEmblem;
