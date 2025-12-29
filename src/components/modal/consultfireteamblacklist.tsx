import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import { SubmitButton } from '../common/ActionButton';
import DataTable, { TableColumn } from '../common/DataTable';
import TableFilter, { FilterField } from '../common/TableFilter';

interface FireteamBlacklistEntry {
  oidUser: number;
  Reason: string;
  AddedAt: string;
  NickName: string;
}

interface ConsultFireteamBlacklistProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultFireteamBlacklist: React.FC<ConsultFireteamBlacklistProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [blacklist, setBlacklist] = useState<FireteamBlacklistEntry[]>([]);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Valores digitados pelo usuário (sem delay)
  const [inputNickName, setInputNickName] = useState('');
  const [inputReason, setInputReason] = useState('');
  const [inputDate, setInputDate] = useState('');

  // Valores com debounce que disparam a busca
  const [filterNickName, setFilterNickName] = useState('');
  const [filterReason, setFilterReason] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterNickName(inputNickName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputNickName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterReason(inputReason);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputReason]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterDate(inputDate);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputDate]);

  // Buscar dados quando filtros mudarem (após debounce)
  useEffect(() => {
    if (isOpen && hasLoaded) {
      handleFetchBlacklist();
    }
  }, [filterNickName, filterReason, filterDate]);

  // Carregar inicial ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setHasLoaded(true);
      handleFetchBlacklist();
    } else {
      // Limpar ao fechar
      setBlacklist([]);
      setError('');
      // Limpar inputs
      setInputNickName('');
      setInputReason('');
      setInputDate('');
      // Limpar filtros
      setFilterNickName('');
      setFilterReason('');
      setFilterDate('');
      setHasLoaded(false);
    }
  }, [isOpen]);

  const handleFetchBlacklist = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.getFireteamBlacklist({
        nickname: filterNickName,
        reason: filterReason,
        date: filterDate
      });

      if (result.success && result.data) {
        setBlacklist(result.data);
      } else {
        setError(result.error || 'Erro ao consultar blacklist');
        setBlacklist([]);
      }
    } catch (error) {
      console.error('Erro ao buscar blacklist:', error);
      setError('Erro de conexão ao buscar blacklist');
      setBlacklist([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Definir filtros
  const filters: FilterField[] = [
    {
      key: 'nickname',
      label: 'Filtrar por NickName',
      placeholder: 'Digite o nickname...',
      value: inputNickName,
      onChange: setInputNickName
    },
    {
      key: 'reason',
      label: 'Filtrar por Motivo',
      placeholder: 'Digite o motivo...',
      value: inputReason,
      onChange: setInputReason
    },
    {
      key: 'date',
      label: 'Filtrar por Data',
      placeholder: 'Digite a data...',
      value: inputDate,
      onChange: setInputDate
    }
  ];

  // Definir colunas
  const columns: TableColumn<FireteamBlacklistEntry>[] = [
    {
      key: 'NickName',
      header: 'NickName',
      render: (row) => row.NickName || '-'
    },
    {
      key: 'Reason',
      header: 'Motivo',
      render: (row) => row.Reason || '-',
      className: 'px-4 py-3 text-sm text-gray-300'
    },
    {
      key: 'AddedAt',
      header: 'Data de Inclusão',
      render: (row) => formatDate(row.AddedAt),
      className: 'px-4 py-3 text-sm text-gray-400'
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONSULTAR BLACKLIST DE FIRETEAM REWARDS"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Botão de Atualizar */}
        <div className="flex justify-end">
          <SubmitButton
            onClick={handleFetchBlacklist}
            disabled={isLoading}
            loading={isLoading}
            icon={Search}
            loadingText="Carregando..."
            className="px-4"
          >
            Atualizar Lista
          </SubmitButton>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={24} />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filtros - sempre visíveis após carregar */}
        {hasLoaded && (
          <TableFilter filters={filters} columnsPerRow={3} />
        )}

        {/* Tabela de Resultados */}
        {!isLoading && blacklist.length > 0 ? (
          <DataTable
            columns={columns}
            data={blacklist}
            totalCount={blacklist.length}
            maxHeight="500px"
          />
        ) : hasLoaded && !isLoading ? (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400 text-lg">Nenhum registro encontrado na blacklist</p>
          </div>
        ) : null}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando blacklist...</p>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ConsultFireteamBlacklist;
