import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import BaseModal from '../../common/BaseModal';
import DataTable, { TableColumn } from '../../common/DataTable';
import TableFilter, { FilterField } from '../../common/TableFilter';

interface ItemUseLogEntry {
  oidUser: number;
  Nickname: string;
  InventorySeqNo: number;
  ItemNo: number;
  Name: string;
  RemainCount: number;
  LastRemainCount: number | null;
  DiffRemainCount: number;
  RoomKeyNo: number | null;
  RoomNo: number | null;
  GameMode: number | null;
  ModeName: string | null;
  WinType: number | null;
  Money: number | null;
  MoneyNoBoost: number | null;
  EXP: number | null;
  EXPNoBoost: number | null;
  PercenTotalBonus: number | null;
  ComboCnt: number | null;
  KillCnt: number | null;
  DeadCnt: number | null;
  AvgPing: number | null;
  CreateDate: string;
}

interface ConsultItemUseHistoryResultProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  formData: {
    discordId: string;
  };
  validatedOidUser: number | null;
  onNewConsultation: () => void;
}

const ConsultItemUseHistoryResult: React.FC<ConsultItemUseHistoryResultProps> = ({
  isOpen,
  onClose,
  playerName,
  formData,
  validatedOidUser,
  onNewConsultation
}) => {
  const [history, setHistory] = useState<ItemUseLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Filtros
  const [inputItemName, setInputItemName] = useState('');
  const [inputMode, setInputMode] = useState('');
  
  const [filterItemName, setFilterItemName] = useState('');
  const [filterMode, setFilterMode] = useState('');

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterItemName(inputItemName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputItemName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterMode(inputMode);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputMode]);

  const loadHistory = useCallback(async () => {
    if (!validatedOidUser) return;

    setIsLoading(true);
    try {
      const result = await apiService.getItemUseHistory(validatedOidUser);

      if (result.success) {
        setHistory(result.data || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de uso de itens:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [validatedOidUser]);

  // Carregar inicial ao abrir o modal
  useEffect(() => {
    if (isOpen && validatedOidUser) {
      setHasLoaded(true);
      loadHistory();
    } else if (!isOpen) {
      setHistory([]);
      setInputItemName('');
      setInputMode('');
      setFilterItemName('');
      setFilterMode('');
      setHasLoaded(false);
    }
  }, [isOpen, validatedOidUser, loadHistory]);

  // Filtragem local
  const filteredData = useMemo(() => {
    return history.filter(item => {
      const matchName = item.Name?.toLowerCase().includes(filterItemName.toLowerCase());
      const matchMode = item.ModeName?.toLowerCase().includes(filterMode.toLowerCase());
      return matchName && matchMode;
    });
  }, [history, filterItemName, filterMode]);

  const filters: FilterField[] = [
    {
      key: 'itemName',
      label: 'Filtrar por Item',
      placeholder: 'Nome do item...',
      value: inputItemName,
      onChange: setInputItemName
    },
    {
      key: 'modeName',
      label: 'Filtrar por Modo',
      placeholder: 'Nome do modo...',
      value: inputMode,
      onChange: setInputMode
    }
  ];

  const columns = useMemo<TableColumn<ItemUseLogEntry>[]>(() => [
    {
      key: 'CreateDate',
      header: 'Data/Hora',
      render: (row) => formatDate(row.CreateDate),
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'Name',
      header: 'Item',
      render: (row) => row.Name,
      className: 'px-4 py-3 text-sm text-white font-medium'
    },
    {
      key: 'DiffRemainCount',
      header: 'Consumido',
      render: (row) => (
        <span className="text-red-400 font-bold">
          -{row.DiffRemainCount}
        </span>
      ),
      className: 'px-4 py-3 text-sm text-center'
    },
    {
      key: 'RemainCount',
      header: 'Restante',
      render: (row) => row.RemainCount,
      className: 'px-4 py-3 text-sm text-center text-gray-300'
    },
    {
      key: 'ModeName',
      header: 'Modo de Jogo',
      render: (row) => row.ModeName || 'N/A',
      className: 'px-4 py-3 text-sm text-blue-300'
    },
    {
      key: 'RoomNo',
      header: 'Sala',
      render: (row) => row.RoomNo || 'N/A',
      className: 'px-4 py-3 text-sm text-center text-gray-400'
    },
    {
      key: 'KillDead',
      header: 'K/D',
      render: (row) => row.KillCnt !== null ? `${row.KillCnt}/${row.DeadCnt}` : 'N/A',
      className: 'px-4 py-3 text-sm text-center text-gray-400'
    },
    {
      key: 'EXP',
      header: 'EXP',
      render: (row) => row.EXP?.toLocaleString('pt-BR') || 'N/A',
      className: 'px-4 py-3 text-sm text-right text-yellow-500'
    },
    {
      key: 'PercenTotalBonus',
      header: 'Bônus %',
      render: (row) => row.PercenTotalBonus ? `${row.PercenTotalBonus.toFixed(1)}%` : 'N/A',
      className: 'px-4 py-3 text-sm text-right text-green-400'
    }
  ], []);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`USO DE ITENS POR PARTIDA - ${playerName.toUpperCase()}`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-[#1d1e24] rounded-lg p-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              Histórico de Uso de Itens - {playerName}
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

        {history.length > 0 && (
          <TableFilter filters={filters} columnsPerRow={2} />
        )}

        {history.length > 0 && (
          <DataTable
            columns={columns}
            data={filteredData}
            totalCount={filteredData.length}
            maxHeight="60vh"
            loading={isLoading}
          />
        )}

        {history.length === 0 && !isLoading && (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Nenhum registro de uso encontrado
            </h3>
            <p className="text-gray-400">
              O jogador {playerName} não possui registros de consumo de itens vinculados a partidas recentes.
            </p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ConsultItemUseHistoryResult;
