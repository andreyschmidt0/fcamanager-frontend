import React, { useState, useEffect } from 'react';
import { ClipboardList, RefreshCw, Search, Filter } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import DataTable, { TableColumn } from '../common/DataTable';

interface Inscription {
  InscricaoID: number;
  TorneioID: number;
  NomeTorneio: string;
  StatusInscricao: string;
  LiderOidUser: number;
  LiderNickname: string;
  ClanID: number;
  ClanName: string;
  DataInscricao: string;
  Grupo: string | null;
}

interface ConsultInscriptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultInscriptionsModal: React.FC<ConsultInscriptionsModalProps> = ({ isOpen, onClose }) => {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filters, setFilters] = useState({
    torneioId: '',
    clanId: '',
    status: ''
  });

  const fetchInscriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiService.getTournamentInscriptions(filters);
      setInscriptions(data);
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
      setError('Falha ao carregar as inscrições.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchInscriptions();
    }
  }, [isOpen]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInscriptions();
  };

  const getStatusColor = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'CONFIRMADO') return 'text-green-400 bg-green-400/10 border-green-400/20';
    if (s === 'PENDENTE') return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    if (s === 'CANCELADO' || s === 'REJEITADO') return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  };

  const columns: TableColumn<Inscription>[] = [
    {
      key: 'InscricaoID',
      header: 'ID',
      className: 'px-4 py-3 text-center font-mono text-xs text-gray-500 w-16',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-16',
      render: (row) => `#${row.InscricaoID}`
    },
    {
      key: 'NomeTorneio',
      header: 'Torneio',
      className: 'px-4 py-3 w-48',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white uppercase truncate" title={row.NomeTorneio}>
            {row.NomeTorneio}
          </span>
          <span className="text-[10px] text-gray-500 font-mono">ID: {row.TorneioID}</span>
        </div>
      )
    },
    {
      key: 'ClanName',
      header: 'Clã',
      className: 'px-4 py-3 w-40',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-blue-400 truncate" title={row.ClanName}>
            {row.ClanName}
          </span>
          <span className="text-[10px] text-gray-500 uppercase">ID: {row.ClanID}</span>
        </div>
      )
    },
    {
      key: 'LiderNickname',
      header: 'Líder / Responsável',
      className: 'px-4 py-3 w-40',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">{row.LiderNickname}</span>
          <span className="text-[10px] text-gray-500 font-mono">OID: {row.LiderOidUser}</span>
        </div>
      )
    },
    {
      key: 'StatusInscricao',
      header: 'Status',
      className: 'px-4 py-3 text-center w-32',
      headerClassName: 'px-4 py-3 text-center text-sm font-semibold text-gray-300 border-b border-gray-700 w-32',
      render: (row) => (
        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(row.StatusInscricao)}`}>
          {row.StatusInscricao}
        </span>
      )
    },
    {
      key: 'DataInscricao',
      header: 'Data',
      className: 'px-4 py-3 text-right w-36',
      headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700 w-36',
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="text-xs text-gray-300">
            {new Date(row.DataInscricao).toLocaleDateString('pt-BR')}
          </span>
          <span className="text-[10px] text-gray-500">
            {new Date(row.DataInscricao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      )
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="CONSULTA DE INSCRIÇÕES"
      maxWidth="5xl"
    >
      <div className="flex flex-col gap-6">
        {/* Barra de Filtros */}
        <form onSubmit={handleApplyFilters} className="p-4 bg-[#1d1e24] rounded-lg border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">ID Torneio</label>
              <input
                type="number"
                name="torneioId"
                value={filters.torneioId}
                onChange={handleFilterChange}
                placeholder="Ex: 3"
                className="w-full px-3 py-2 bg-[#111216] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">ID do Clã</label>
              <input
                type="number"
                name="clanId"
                value={filters.clanId}
                onChange={handleFilterChange}
                placeholder="Ex: 3040"
                className="w-full px-3 py-2 bg-[#111216] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 ml-1">Status</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 bg-[#111216] border border-gray-700 rounded-md text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="">Todos</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-bold transition-colors"
              >
                <Search size={16} />
                <span>BUSCAR</span>
              </button>
              <button
                type="button"
                onClick={fetchInscriptions}
                disabled={isLoading}
                className="p-2 bg-[#2a2b34] hover:bg-[#3a3b42] text-gray-300 rounded-md transition-colors border border-gray-700"
                title="Atualizar"
              >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <div className="p-10 text-center bg-red-900/10 border border-red-900/20 rounded-lg">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={fetchInscriptions}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-bold"
            >
              Tentar novamente
            </button>
          </div>
        ) : isLoading && inscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-sm font-medium uppercase tracking-widest">Carregando inscrições...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1 px-1">
              <ClipboardList size={18} className="text-blue-400" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Registros Encontrados</span>
            </div>
            <DataTable
              columns={columns}
              data={inscriptions}
              maxHeight="55vh"
              emptyMessage="Nenhuma inscrição encontrada com os filtros selecionados."
            />
          </div>
        )}

        <div className="flex justify-end mt-2">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-bold text-sm uppercase tracking-wider"
          >
            Fechar
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConsultInscriptionsModal;