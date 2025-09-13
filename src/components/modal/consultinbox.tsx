import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../contexts/PlayerContext';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import PlayerValidationFields from '../common/PlayerValidationFields';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';

interface ConsultInboxProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultInbox: React.FC<ConsultInboxProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Usar hook de validação reutilizável
  const validation = usePlayerValidation(formData, isOpen, {
    autoValidateOnSelectedPlayer: true,
    debounceMs: 500,
    resetOnModalOpen: true
  });

  // Preencher formData quando selectedPlayer muda
  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData({
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      });
    } else if (isOpen) {
      setFormData({ discordId: '', loginAccount: '' });
    }
  }, [selectedPlayer, isOpen]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar mensagem de erro quando usuário digitar
    if (validation.errorMessage) {
      validation.setErrorMessage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado
    if (!validation.playerValidated || !validation.fetchedPlayerName || !validation.validatedOidUser) {
      validation.setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (validation.isValidatingPlayer) {
      validation.setErrorMessage('Aguarde a validação ser concluída antes de enviar.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Por enquanto só simular sucesso
      setTimeout(() => {
        setIsLoading(false);
        alert(`Em breve!`);
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao consultar inbox:', error);
      validation.setErrorMessage('Erro ao consultar inbox do jogador');
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONSULTAR INBOX"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <PlayerValidationFields
          formData={formData}
          onInputChange={handleInputChange}
          validation={validation}
          placeholders={{
            discordId: 'Ex 123456789012345678',
            loginAccount: 'Digite o strNexonID da conta.'
          }}
        />

        {/* Buttons */}
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
            loadingText="Consultando..."
            className="flex-1"
          >
            Consultar Inbox
          </SubmitButton>
        </div>
      </form>
    </BaseModal>
  );
};

export default ConsultInbox;