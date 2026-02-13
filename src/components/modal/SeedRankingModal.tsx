import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import DataTable, { TableColumn } from '../common/DataTable';

interface SeedRanking {
  RankGlobal: number;
  oidGuild: number;
  clanName: string;
  Points: number;
}

interface SeedRankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SeedRankingModal: React.FC<SeedRankingModalProps> = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState<SeedRanking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getSeedRanking();
      setRankings(data);
    } catch (err) {
      console.error('Erro ao buscar ranking de seeds:', err);
      setError('Falha ao carregar o ranking de seeds.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings();
    }
  }, [isOpen]);

  const columns: TableColumn<SeedRanking>[] = [
    {
      key: 'RankGlobal',
      header: 'Rank',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-20',
      className: 'px-4 py-3 text-center w-20',
      render: (row) => (
        <div className="flex justify-center">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
            row.RankGlobal === 1 ? 'bg-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' :
            row.RankGlobal === 2 ? 'bg-gray-300 text-black shadow-[0_0_10px_rgba(209,213,219,0.4)]' :
            row.RankGlobal === 3 ? 'bg-amber-700 text-white shadow-[0_0_10px_rgba(180,83,9,0.4)]' :
            'bg-gray-800 text-gray-400 border border-gray-700'
          }`}>
            {row.RankGlobal}
          </span>
        </div>
      )
    },
    {
      key: 'oidGuild',
      header: 'OID',
      className: 'px-4 py-3 text-center font-mono text-xs text-gray-500 w-24',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-24',
      render: (row) => `#${row.oidGuild}`
    },
    {
      key: 'clanName',
      header: 'Nome do Clã',
      className: 'px-4 py-3 font-semibold text-white',
      render: (row) => row.clanName || 'Desconhecido'
    },
    {
      key: 'Points',
      header: 'Pontos',
      className: 'px-4 py-3 text-right font-bold text-yellow-500 w-32',
      headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700 w-32',
      render: (row) => (
        <>
          {row.Points.toLocaleString()} <span className="text-[10px] text-gray-500 ml-1">pts</span>
        </>
      )
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="RANKING DE SEEDS GERAL"
      maxWidth="3xl"
    >
      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-yellow-500">
            <Trophy size={20} />
            <span className="text-sm font-medium uppercase tracking-wider">Classificação Global</span>
          </div>
          <button
            onClick={fetchRankings}
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
              onClick={fetchRankings}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading && rankings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mb-4"></div>
            <p>Carregando ranking...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rankings}
            maxHeight="60vh"
            emptyMessage="Nenhum clã ranqueado no momento."
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

export default SeedRankingModal;
