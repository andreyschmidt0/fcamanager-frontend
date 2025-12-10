import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import BaseModal from '../common/BaseModal';
import PlayerValidationFields from '../common/PlayerValidationFields';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';
import { usePlayer } from '../../contexts/PlayerContext';
import apiService from '../../services/api-tauri.service';

interface InsertFireteamBlacklistProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_REASON = '';

const InsertFireteamBlacklist: React.FC<InsertFireteamBlacklistProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: '',
    reason: DEFAULT_REASON
  });
  const [isLoading, setIsLoading] = useState(false);

  const validation = usePlayerValidation(formData, isOpen, {
    autoValidateOnSelectedPlayer: true,
    debounceMs: 400,
    resetOnModalOpen: true
  });

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData({
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || '',
        reason: DEFAULT_REASON
      });
    } else if (isOpen) {
      setFormData({
        discordId: '',
        loginAccount: '',
        reason: DEFAULT_REASON
      });
    }
  }, [selectedPlayer, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (validation.errorMessage) {
      validation.setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.playerValidated || !validation.validatedOidUser || validation.isValidatingPlayer) {
      validation.setErrorMessage('Aguarde a validação do jogador antes de enviar.');
      return;
    }

    if (!formData.reason.trim()) {
      validation.setErrorMessage('Informe um motivo.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.insertFireteamRewardBlacklist({
        discordId: formData.discordId,
        loginAccount: formData.loginAccount,
        reason: formData.reason.trim()
      });

      if (result.success) {
        toast.success(result.message || 'Jogador inserido na blacklist de Fireteam.');
        onClose();
      } else {
        toast.error(result.error || 'Erro ao inserir na blacklist.');
      }
    } catch (error) {
      console.error('Erro ao inserir blacklist Fireteam:', error);
      toast.error('Erro ao inserir na blacklist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="INSERIR BLACKLIST EA"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PlayerValidationFields
          formData={formData}
          onInputChange={handleInputChange}
          validation={validation}
          labels={{ loginAccount: 'Login da conta (strNexonID)' }}
          placeholders={{
            discordId: 'Ex: 123456789012345678',
            loginAccount: 'Digite o strNexonID da conta'
          }}
        />

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Motivo
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
            placeholder={DEFAULT_REASON}
          />
        </div>

        {validation.errorMessage && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
            <p className="text-red-400 text-sm">{validation.errorMessage}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <CancelButton onClick={onClose} className="flex-1">
            Cancelar
          </CancelButton>
          <SubmitButton
            disabled={isLoading || !validation.playerValidated}
            loading={isLoading}
            loadingText="Inserindo..."
            className="flex-1"
          >
            Inserir Blacklist
          </SubmitButton>
        </div>
      </form>
    </BaseModal>
  );
};

export default InsertFireteamBlacklist;
