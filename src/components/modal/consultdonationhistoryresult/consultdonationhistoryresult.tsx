import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import BaseModal from '../../common/BaseModal';
import DataTable, { TableColumn } from '../../common/DataTable';

interface DonationHistoryEntry {
  SRL: number;
  strDiscordID: string;
  oidUser: number;
  strNexonID: string;
  DonatedValue: number;
  TotalValue: number;
  PreviousRealBalance: number;
  NewBalance: number;
  RegDate: string;
  RegUser: string;
  Method: string;
  NickName: string;
}

interface ConsultDonationHistoryResultProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  formData: {
    discordId: string;
  };
  validatedOidUser: number | null;
  onNewConsultation: () => void;
}

const ConsultDonationHistoryResult: React.FC<ConsultDonationHistoryResultProps> = ({
  isOpen,
  onClose,
  playerName,
  validatedOidUser,
  onNewConsultation
}) => {
  const [donationHistory, setDonationHistory] = useState<DonationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const loadDonationHistory = useCallback(async () => {
    if (!validatedOidUser) return;

    setIsLoading(true);
    try {
      const result = await apiService.getDonationHistory(validatedOidUser);

      if (result.success) {
        setDonationHistory(result.data || []);
      } else {
        setDonationHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de doações:', error);
      setDonationHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [validatedOidUser]);

  // Carregar inicial ao abrir o modal
  useEffect(() => {
    if (isOpen && validatedOidUser) {
      setHasLoaded(true);
      loadDonationHistory();
    } else if (!isOpen) {
      setDonationHistory([]);
      setHasLoaded(false);
    }
  }, [isOpen, validatedOidUser, loadDonationHistory]);

  // Definir colunas com useMemo
  const columns = useMemo<TableColumn<DonationHistoryEntry>[]>(() => [
    {
      key: 'RegDate',
      header: 'Data',
      render: (row) => formatDate(row.RegDate),
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'Method',
      header: 'Método',
      className: 'px-4 py-3 text-sm text-gray-300'
    },
    {
      key: 'DonatedValue',
      header: 'Valor Doado',
      render: (row) => (
        <span className="text-green-400 font-medium">
          {row.DonatedValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      className: 'px-4 py-3 text-sm'
    },
    {
      key: 'TotalValue',
      header: 'Valor Total',
      render: (row) => (
        <span className="text-blue-400">
          {row.TotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      className: 'px-4 py-3 text-sm'
    },
    {
      key: 'PreviousRealBalance',
      header: 'Saldo Anterior',
      render: (row) => row.PreviousRealBalance.toString(),
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'NewBalance',
      header: 'Novo Saldo',
      render: (row) => (
        <span className="font-bold text-white">
          {row.NewBalance.toString()}
        </span>
      ),
      className: 'px-4 py-3 text-sm'
    },
    {
      key: 'RegUser',
      header: 'Registrado Por',
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'strNexonID',
      header: 'Login',
      className: 'px-4 py-3 text-sm text-gray-500'
    }
  ], []);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`HISTÓRICO DE DOAÇÃO - ${playerName.toUpperCase()}`}
      maxWidth="5xl"
    >
      <div className="space-y-4 max-w-full overflow-hidden">
        {/* Header Info */}
        <div className="flex items-center justify-between bg-[#1d1e24] rounded-lg p-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Histórico de Doações - {playerName}
            </h3>
            <p className="text-gray-400 text-sm">
              oidUser: {validatedOidUser}
            </p>
          </div>
          <button
            onClick={onNewConsultation}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Nova Consulta
          </button>
        </div>

        {/* Tabela de Resultados */}
        {donationHistory.length > 0 && (
          <DataTable
            columns={columns}
            data={donationHistory}
            totalCount={donationHistory.length}
            maxHeight="60vh"
          />
        )}

        {/* Mensagem quando não há resultados */}
        {!isLoading && hasLoaded && donationHistory.length === 0 && (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum registro de doação encontrado
            </h3>
            <p className="text-gray-400">
              O jogador {playerName} não possui histórico de doações.
            </p>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && (
            <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando histórico...</p>
            </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ConsultDonationHistoryResult;
