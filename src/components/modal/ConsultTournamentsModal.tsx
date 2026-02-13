import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Calendar, Users, Activity, ExternalLink } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import DataTable, { TableColumn } from '../common/DataTable';

interface Tournament {
  TorneioID: number;
  NomeTorneio: string;
  LimiteInscritos: number | null;
  DataInicio: string | null;
  GameMode: number | null;
  GameModeType: number | null;
  Temporada: number | null;
  Status: string | null;
  StatusInscricoes: string | null;
}

interface ConsultTournamentsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultTournamentsModal: React.FC<ConsultTournamentsModalProps> = ({ isOpen, onClose }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Erro ao buscar torneios:', err);
      setError('Falha ao carregar a lista de torneios.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen]);

  const getStatusColor = (status: string | null) => {
    if (!status) return 'text-gray-400';
    const s = status.toLowerCase();
    if (s.includes('andamento') || s.includes('ativo')) return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (s.includes('finalizado') || s.includes('encerrado')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (s.includes('planejado') || s.includes('futuro')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
  };

  const columns: TableColumn<Tournament>[] = [
    {
      key: 'TorneioID',
      header: 'ID',
      className: 'px-4 py-3 text-center font-mono text-xs text-gray-500 w-16',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-16',
      render: (row) => `#${row.TorneioID}`
    },
    {
      key: 'NomeTorneio',
      header: 'Nome do Torneio',
      className: 'px-4 py-3 font-semibold text-white',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white uppercase tracking-tight">{row.NomeTorneio}</span>
          {row.Temporada && (
            <span className="text-[10px] text-blue-400 font-bold uppercase">Temporada {row.Temporada}</span>
          )}
        </div>
      )
    },
    {
      key: 'DataInicio',
      header: 'Início',
      className: 'px-4 py-3 w-32',
      headerClassName: 'px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700 w-32',
      render: (row) => row.DataInicio ? new Date(row.DataInicio).toLocaleDateString('pt-BR') : '-'
    },
    {
      key: 'LimiteInscritos',
      header: 'Inscritos',
      className: 'px-4 py-3 text-center w-24',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-24',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5 text-gray-300">
          <Users size={14} className="text-gray-500" />
          <span className="text-sm">{row.LimiteInscritos || '∞'}</span>
        </div>
      )
    },
    {
      key: 'Status',
      header: 'Status',
      className: 'px-4 py-3 w-32',
      headerClassName: 'px-4 py-3 text-left text-sm font-semibold text-gray-300 border-b border-gray-700 w-32',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(row.Status)}`}>
          {row.Status || 'N/A'}
        </span>
      )
    },
    {
      key: 'Actions',
      header: 'Ações',
      className: 'px-4 py-3 text-center w-20',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-20',
      render: () => (
        <button 
          title="Ver Detalhes"
          className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
        >
          <ExternalLink size={16} />
        </button>
      )
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONSULTA DE TORNEIOS"
      maxWidth="5xl"
    >
      <div className="flex flex-col gap-4">
        {/* Header/Filters Placeholder */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Activity size={20} />
              <span className="text-sm font-bold uppercase tracking-wider">Histórico de Competições</span>
            </div>
          </div>
          <button
            onClick={fetchTournaments}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1d1e24] hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span className="text-xs font-semibold">Atualizar</span>
          </button>
        </div>

        {error ? (
          <div className="p-8 text-center bg-red-900/10 border border-red-900/20 rounded-lg">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchTournaments}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading && tournaments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p>Carregando torneios...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={tournaments}
            maxHeight="60vh"
            emptyMessage="Nenhum torneio cadastrado no sistema."
          />
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConsultTournamentsModal;