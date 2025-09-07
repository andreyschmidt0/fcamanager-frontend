import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import apiTauriService from '../../services/api-tauri.service';
import toast from 'react-hot-toast';
import ConsultInventoryResult from './consultinventoryresult/consultinventoryresult';
import BaseModal from '../common/BaseModal';
import PlayerValidationFields from '../common/PlayerValidationFields';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';

interface ConsultInventory {
  isOpen: boolean;
  onClose: () => void;
}

interface InventoryItem {
  oidUser: number;
  Nickname: string;
  InventorySeqNo: number;
  ItemNo: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  Period: number;
  RemainCount: number;
  UseType: number;
  ie_Ativo: string;
}

const ConsultInventory: React.FC<ConsultInventory> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para os resultados
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);

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
      setShowResultModal(false);
      setInventoryData([]);
    } else if (isOpen) {
      setFormData({ discordId: '', loginAccount: '' });
      setShowResultModal(false);
      setInventoryData([]);
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
    
    // Validar se o jogador foi validado antes de buscar inventário
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
      const result = await apiTauriService.searchInventory(
        validation.validatedOidUser.toString()
      );
      
      setInventoryData(result);
      setShowResultModal(true);
      
      if (result.length === 0) {
        toast.success('Busca realizada! Nenhum item encontrado.');
      } else {
        toast.success(`Encontrados ${result.length} itens no inventário`);
      }
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
      toast.error('Erro ao buscar inventário do jogador');
      setInventoryData([]);
      setShowResultModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    setInventoryData([]);
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="CONSULTAR INVENTÁRIO"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <PlayerValidationFields
            formData={formData}
            onInputChange={handleInputChange}
            validation={validation}
            labels={{
              loginAccount: 'Login da conta (strNexonID)'
            }}
            placeholders={{
              discordId: 'Ex 123456789012345678',
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
              loadingText="Consultando..."
              className="flex-1"
            >
              Consultar Inventário
            </SubmitButton>
          </div>
        </form>
      </BaseModal>

      {/* Modal de Resultado */}
      <ConsultInventoryResult
        isOpen={showResultModal}
        onClose={handleCloseResultModal}
        inventoryData={inventoryData}
        playerName={validation.fetchedPlayerName}
      />
    </>
  );
};

export default ConsultInventory;