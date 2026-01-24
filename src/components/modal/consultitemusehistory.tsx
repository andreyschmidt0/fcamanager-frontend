import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import apiService from '../../services/api-tauri.service';
import ConsultItemUseHistoryResult from './consultitemusehistoryresult/consultitemusehistoryresult';
import BaseModal from '../common/BaseModal';
import PlayerValidationFields from '../common/PlayerValidationFields';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';

interface ConsultItemUseHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultItemUseHistory: React.FC<ConsultItemUseHistoryProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const validation = usePlayerValidation(formData, isOpen, {
    autoValidateOnSelectedPlayer: true,
    debounceMs: 500,
    resetOnModalOpen: true
  });

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData({
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      });
      setShowResults(false);
    } else if (isOpen) {
      setFormData({ discordId: '', loginAccount: '' });
      setShowResults(false);
    }
  }, [selectedPlayer, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validation.errorMessage) {
      validation.setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.playerValidated || !validation.fetchedPlayerName || !validation.validatedOidUser) {
      validation.setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }

    if (validation.isValidatingPlayer) {
      validation.setErrorMessage('Aguarde a validação ser concluída antes de consultar o histórico.');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      setShowResults(true);
      validation.setErrorMessage('');
    } catch (error) {
      console.error('Erro ao abrir modal de histórico de uso:', error);
      validation.setErrorMessage('Erro ao abrir histórico de uso de itens');
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setShowResults(false);
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="CONSULTAR HISTÓRICO DE USO DE ITENS POR PARTIDA"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <PlayerValidationFields
            formData={formData}
            onInputChange={handleInputChange}
            validation={validation}
            labels={{
              loginAccount: 'Login da Conta (strNexonID)'
            }}
            placeholders={{
              discordId: 'Ex: 123456789012345678',
              loginAccount: 'Digite o strNexonID da conta'
            }}
          />

          <div className="flex gap-3 pt-4">
            <CancelButton
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </CancelButton>
            <SubmitButton
              disabled={isLoading || !validation.playerValidated}
              loading={isLoading}
              icon={Search}
              loadingText="Buscando..."
              className="flex-1"
            >
              Consultar Histórico
            </SubmitButton>
          </div>
        </form>
      </BaseModal>

      <ConsultItemUseHistoryResult
        isOpen={showResults}
        onClose={handleCloseResultModal}
        playerName={validation.fetchedPlayerName}
        formData={formData}
        validatedOidUser={validation.validatedOidUser}
        onNewConsultation={() => setShowResults(false)}
      />
    </>
  );
};

export default ConsultItemUseHistory;
