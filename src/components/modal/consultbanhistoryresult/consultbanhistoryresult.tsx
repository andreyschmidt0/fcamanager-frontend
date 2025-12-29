import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import BaseModal from '../../common/BaseModal';
import DataTable, { TableColumn } from '../../common/DataTable';
import TableFilter, { FilterField } from '../../common/TableFilter';

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

interface ConsultBanHistoryResultProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  formData: {
    discordId: string;
  };
  validatedOidUser: number | null;
  onNewConsultation: () => void;
}

const ConsultBanHistoryResult: React.FC<ConsultBanHistoryResultProps> = ({
  isOpen,
  onClose,
  playerName,
  formData,
  validatedOidUser,
  onNewConsultation
}) => {
  const [banHistory, setBanHistory] = useState<BanLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Valores digitados pelo usuário (sem delay)
  const [inputStatus, setInputStatus] = useState('');
  const [inputExecutor, setInputExecutor] = useState('');
  const [inputMotivo, setInputMotivo] = useState('');
  const [inputData, setInputData] = useState('');

  // Valores com debounce que disparam a busca
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExecutor, setFilterExecutor] = useState('');
  const [filterMotivo, setFilterMotivo] = useState('');
  const [filterData, setFilterData] = useState('');

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

  const formatDateOnly = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterStatus(inputStatus);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterExecutor(inputExecutor);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputExecutor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterMotivo(inputMotivo);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputMotivo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterData(inputData);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputData]);

  const loadBanHistory = useCallback(async () => {
    if (!validatedOidUser) return;

    setIsLoading(true);
    try {
      const result = await apiService.getBanHistory(validatedOidUser, {
        status: filterStatus,
        executor: filterExecutor,
        motivo: filterMotivo,
        logDate: filterData
      });

      if (result.success) {
        setBanHistory(result.data || []);
      } else {
        setBanHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de bans:', error);
      setBanHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [validatedOidUser, filterStatus, filterExecutor, filterMotivo, filterData]);

  // Buscar histórico quando filtros mudarem (após debounce)
  useEffect(() => {
    if (isOpen && hasLoaded) {
      loadBanHistory();
    }
  }, [filterStatus, filterExecutor, filterMotivo, filterData, isOpen, hasLoaded, loadBanHistory]);

  // Carregar inicial ao abrir o modal
  useEffect(() => {
    if (isOpen && validatedOidUser) {
      setHasLoaded(true);
      loadBanHistory();
    } else if (!isOpen) {
      setBanHistory([]);
      // Limpar inputs
      setInputStatus('');
      setInputExecutor('');
      setInputMotivo('');
      setInputData('');
      // Limpar filtros
      setFilterStatus('');
      setFilterExecutor('');
      setFilterMotivo('');
      setFilterData('');
      setHasLoaded(false);
    }
  }, [isOpen, validatedOidUser, loadBanHistory]);

  // Definir filtros
  const filters: FilterField[] = [
    {
      key: 'status',
      label: 'Filtrar por Status',
      placeholder: 'Digite o status...',
      value: inputStatus,
      onChange: setInputStatus
    },
    {
      key: 'executor',
      label: 'Filtrar por Executor',
      placeholder: 'Digite o executor...',
      value: inputExecutor,
      onChange: setInputExecutor
    },
    {
      key: 'motivo',
      label: 'Filtrar por Motivo',
      placeholder: 'Digite o motivo...',
      value: inputMotivo,
      onChange: setInputMotivo
    },
    {
      key: 'data',
      label: 'Filtrar por Data',
      placeholder: 'Digite a data...',
      value: inputData,
      onChange: setInputData
    }
  ];

  // Definir colunas com useMemo
  const columns = useMemo<TableColumn<BanLogEntry>[]>(() => [
    {
      key: 'LogDate',
      header: 'Data do Log',
      render: (row) => formatDate(row.LogDate),
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'Status',
      header: 'Status',
      render: (row) => (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
          row.Status.toLowerCase() === 'banido' ? 'bg-red-900 text-white' :
          row.UnbanDate ? 'bg-green-900 text-green-300' :
          'bg-gray-700 text-gray-300'
        }`}>
          {row.Status}
        </span>
      ),
      className: 'px-4 py-3 text-sm'
    },
    {
      key: 'MacAddressBanned',
      header: 'MAC Banido',
      render: (row) => (
        <span className={`font-medium ${
          row.MacAddressBanned?.toLowerCase() === 's' ? 'text-red-400' : 'text-green-400'
        }`}>
          {row.MacAddressBanned?.toLowerCase() === 's' ? 'Sim' : 'Não'}
        </span>
      ),
      className: 'px-4 py-3 text-sm text-center'
    },
    {
      key: 'ExecutorNickName',
      header: 'Executor',
      render: (row) => row.ExecutorNickName || 'N/A',
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'MacAddress',
      header: 'MAC Address',
      render: (row) => row.MacAddress || 'N/A',
      className: 'px-4 py-3 text-sm text-gray-300'
    },
    {
      key: 'BlockStartDate',
      header: 'Início',
      render: (row) => formatDateOnly(row.BlockStartDate),
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'BlockEndDate',
      header: 'Final',
      render: (row) => formatDateOnly(row.BlockEndDate),
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'Motivo',
      header: 'Motivo',
      render: (row) => (
        <span className="truncate block max-w-xs" title={row.Motivo}>
          {row.Motivo || 'N/A'}
        </span>
      ),
      className: 'px-4 py-3 text-sm text-gray-300'
    }
  ], []);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`HISTÓRICO DE BAN - ${playerName.toUpperCase()}`}
      maxWidth="5xl"
    >
      <div className="space-y-4">
        {/* Header Info */}
        <div className="flex items-center justify-between bg-[#1d1e24] rounded-lg p-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Histórico de Bans - {playerName}
            </h3>
            <p className="text-gray-400 text-sm">
              Discord: {formData.discordId} | oidUser: {validatedOidUser}
            </p>
          </div>
          <button
            onClick={onNewConsultation}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Nova Consulta
          </button>
        </div>

        {/* Filtros */}
        {banHistory.length > 0 && (
          <TableFilter filters={filters} columnsPerRow={4} />
        )}

        {/* Tabela de Resultados */}
        {banHistory.length > 0 && (
          <DataTable
            columns={columns}
            data={banHistory}
            totalCount={banHistory.length}
            maxHeight="60vh"
          />
        )}

        {/* Mensagem quando não há resultados */}
        {banHistory.length === 0 && (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum registro de ban encontrado
            </h3>
            <p className="text-gray-400">
              O jogador {playerName} não possui histórico de bans.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ConsultBanHistoryResult;
