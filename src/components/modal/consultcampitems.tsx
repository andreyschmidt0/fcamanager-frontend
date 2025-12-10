import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Search, X } from 'lucide-react';
import apiService from '../../services/api-tauri.service';

interface CampItem {
  Name: string;
  ItemType?: number | null;
  AllowType: number;
  ValueType: number;
  Value: number;
}

interface ConsultCampItemsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultCampItems: React.FC<ConsultCampItemsProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<CampItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.getCampItems();

      if (result.success) {
        setItems(result.data || []);
      } else {
        setError(result.error || 'Erro ao buscar itens do modo CAMP');
        setItems([]);
      }
    } catch (err) {
      console.error('Erro ao buscar itens do modo CAMP:', err);
      setError('Erro ao buscar itens do modo CAMP');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      loadItems();
    } else {
      setItems([]);
      setError('');
    }
  }, [isOpen]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return items;

    return items.filter(item => {
      const nameMatch = item.Name?.toLowerCase().includes(term);
      const valueMatch = item.Value.toString().includes(term);
      return nameMatch || valueMatch;
    });
  }, [items, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            ITENS DO MODO CAMP
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden gap-4">
          {/* Actions / Filters */}
          <div className="flex flex-wrap items-center gap-3 justify-between bg-[#1d1e24] border border-gray-700 rounded-lg p-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Lista de itens habilitados</h3>
              <p className="text-sm text-gray-400">
                {isLoading
                  ? 'Carregando...'
                  : `Exibindo ${filteredItems.length} de ${items.length} itens do modo CAMP`}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-1 sm:flex-initial">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome ou ItemNo"
                  className="w-full pl-9 pr-3 py-2 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={loadItems}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-hidden rounded-lg border border-gray-700 bg-[#0f1014]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
                <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
                <p>Carregando itens...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 px-6 text-center">
                <p className="text-lg font-semibold">Nenhum item encontrado</p>
                <p className="text-sm text-gray-400">
                  Tente atualizar a lista ou ajustar o termo de busca.
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[60vh] custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-[#1c1d23]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nome do Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        AllowType
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        ValueType
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Value (ItemNo)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredItems.map((item) => (
                      <tr key={`${item.Value}-${item.AllowType}-${item.ValueType}`} className="hover:bg-[#1d1e24] transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{item.Name || 'N/A'}</div>
                          {item.ItemType !== undefined && item.ItemType !== null && (
                            <div className="text-xs text-gray-400">ItemType: {item.ItemType}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-200">{item.AllowType}</td>
                        <td className="px-4 py-3 text-sm text-gray-200">{item.ValueType}</td>
                        <td className="px-4 py-3 text-sm text-gray-200">{item.Value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultCampItems;
