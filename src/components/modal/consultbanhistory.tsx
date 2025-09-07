import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';
import ConsultBanHistoryResult from './consultbanhistoryresult/consultbanhistoryresult';
import BaseModal from '../common/BaseModal';
import PlayerValidationFields from '../common/PlayerValidationFields';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';

interface BanLogEntry {
  BanLogID: number;
  MacAddress: string;
  strDiscordID: string;
  BlockStartDate: string;
  BlockEndDate: string;
  Motivo: string;
  MacAddressBanned: string;
  LogDate: string;
  ClansDeleted: number;
  AccountsBanned: number;
  DeletedClanNames: string | null;
  Status: string;
  ExecutorNickName: string;
  UnbannedByGM_oidUser: number | null;
  UnbanDate: string | null;
}

interface ConsultBanHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultBanHistory: React.FC<ConsultBanHistoryProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });
  
  // Estados para busca e resultados
  const [isLoading, setIsLoading] = useState(false);
  const [banHistory, setBanHistory] = useState<BanLogEntry[]>([]);
  const [showResults, setShowResults] = useState(false);

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
      setBanHistory([]);
      setShowResults(false);
    } else if (isOpen) {
      setFormData({ discordId: '', loginAccount: '' });
      setBanHistory([]);
      setShowResults(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado antes de buscar histórico
    if (!validation.playerValidated || !validation.fetchedPlayerName || !validation.validatedOidUser) {
      validation.setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (validation.isValidatingPlayer) {
      validation.setErrorMessage('Aguarde a validação ser concluída antes de consultar o histórico.');
      return;
    }
    
    if (isLoading) return; // Prevent double-clicks
    
    setIsLoading(true);
    try {
      // Validação dupla antes de buscar histórico
      let oidUserToUse = validation.validatedOidUser;
      if (!validation.playerValidated || !validation.validatedOidUser) {
        try {
          const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
          if (!validationResult.isValid || !validationResult.player?.oidUser) {
            validation.setErrorMessage('Jogador não pôde ser validado. Verifique os dados informados.');
            return;
          }
          oidUserToUse = validationResult.player.oidUser;
        } catch (error) {
          console.error('Erro na validação dupla:', error);
          validation.setErrorMessage('Erro ao validar jogador. Tente novamente.');
          return;
        }
      }

      // Buscar histórico de ban usando o oidUser validado
      const result = await apiService.getBanHistory(oidUserToUse!);
      
      if (result.success) {
        setBanHistory(result.data || []);
        setShowResults(true);
        validation.setErrorMessage('');
      } else {
        validation.setErrorMessage(result.error || 'Erro ao buscar histórico de bans');
        setBanHistory([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      validation.setErrorMessage('Erro de conexão ao buscar histórico de bans');
      setBanHistory([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setShowResults(false);
    setBanHistory([]);
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="CONSULTAR HISTÓRICO DE BAN"
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
              icon={Search}
              loadingText="Buscando..."
              className="flex-1"
            >
              Consultar Histórico
            </SubmitButton>
          </div>
        </form>
      </BaseModal>

      {/* Modal de Resultado */}
      <ConsultBanHistoryResult
        isOpen={showResults}
        onClose={handleCloseResultModal}
        banHistory={banHistory}
        playerName={validation.fetchedPlayerName}
        formData={formData}
        validatedOidUser={validation.validatedOidUser}
        onNewConsultation={() => setShowResults(false)}
      />
    </>
  );
};

export default ConsultBanHistory;