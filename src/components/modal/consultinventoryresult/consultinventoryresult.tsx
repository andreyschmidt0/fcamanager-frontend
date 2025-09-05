import React, { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';

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

interface ConsultInventoryResultProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryData: InventoryItem[];
  playerName: string;
  useType?: string;
  itemName?: string;
}

const ConsultInventoryResult: React.FC<ConsultInventoryResultProps> = ({ 
  isOpen, 
  onClose, 
  inventoryData, 
  playerName,
  useType,
  itemName
}) => {
  const [filteredData, setFilteredData] = useState<InventoryItem[]>(inventoryData);
  const [localFilters, setLocalFilters] = useState({
    useType: useType || '',
    itemName: itemName || ''
  });

  // Função para aplicar filtros
  const applyFilters = (data: InventoryItem[], statusFilter: string, nameFilter: string) => {
    let filtered = data;

    // Filtrar por status
    if (statusFilter !== '') {
      const statusValue = parseInt(statusFilter);
      filtered = filtered.filter(item => item.UseType === statusValue);
    }

    // Filtrar por nome do item
    if (nameFilter && nameFilter.trim() !== '') {
      filtered = filtered.filter(item => 
        item.Name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    return filtered;
  };

  // Aplicar filtros quando dados ou filtros mudarem
  useEffect(() => {
    const filtered = applyFilters(inventoryData, localFilters.useType, localFilters.itemName);
    setFilteredData(filtered);
  }, [inventoryData, localFilters]);

  // Resetar filtros quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setLocalFilters({
        useType: useType || '',
        itemName: itemName || ''
      });
    }
  }, [isOpen, useType, itemName]);

  const handleFilterChange = (filterType: string, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getFilterText = () => {
    const filters = [];
    if (localFilters.useType !== '') {
      filters.push(`Status: ${localFilters.useType === '1' ? 'Ativos' : 'Inativos'}`);
    }
    if (localFilters.itemName && localFilters.itemName.trim() !== '') {
      filters.push(`Item: ${localFilters.itemName}`);
    }
    return filters.length > 0 ? ` (${filters.join(', ')})` : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            INVENTÁRIO - {playerName.toUpperCase()}{getFilterText()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Filtros */}
          <div className="mb-6 p-4 bg-[#1d1e24] rounded-lg border border-gray-600">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={18} className="text-green-400" />
              <h3 className="text-lg font-semibold text-white">
                Filtros de Busca
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Status dos itens
                </label>
                <select
                  value={localFilters.useType}
                  onChange={(e) => handleFilterChange('useType', e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                >
                  <option value="">Todos</option>
                  <option value="0">Inativos</option>
                  <option value="1">Ativos</option>
                </select>
              </div>
              
              {/* Item Name Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nome do item
                </label>
                <input
                  type="text"
                  value={localFilters.itemName}
                  onChange={(e) => handleFilterChange('itemName', e.target.value)}
                  placeholder="Ex: L96A1"
                  className="w-full px-3 py-2 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredData.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-8xl mb-6">📦</div>
              <h3 className="text-2xl font-semibold mb-3">
                {inventoryData.length === 0 ? 'Nenhum item encontrado' : 'Nenhum item corresponde aos filtros'}
              </h3>
              <p className="text-lg">
                {inventoryData.length === 0 
                  ? 'O inventário está vazio.' 
                  : 'Tente ajustar os filtros para ver mais resultados.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {filteredData.map((item) => (
                <div
                  key={item.InventorySeqNo}
                  className={`bg-[#1d1e24] rounded-lg p-3 border-l-4 ${
                    item.UseType === 1 ? 'border-l-green-500' : 'border-l-red-500'
                  } hover:bg-[#252631] transition-colors`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-sm items-center">
                    {/* Item Info */}
                    <div className="md:col-span-2">
                      <p className="text-white font-medium text-base leading-tight">{item.Name}</p>
                      <p className="text-xs text-gray-500">ItemNo: {item.ItemNo}</p>
                    </div>
                    
                    {/* Status */}
                    <div className="text-center">
                      <p className={`font-medium text-sm ${item.UseType === 1 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.ie_Ativo}
                      </p>
                    </div>
                    
                    {/* Quantity */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Qtd:</span>
                      <p className="text-white font-medium">{item.RemainCount}</p>
                    </div>
                    
                    {/* Period */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Período:</span>
                      <p className="text-white font-medium">{item.Period}d</p>
                    </div>

                    {/* Dates */}
                    <div className="text-center">
                      <span className="text-xs text-gray-400">Início:</span>
                      <p className="text-white text-xs">
                        {new Date(item.StartDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="text-xs text-gray-400">Expiração:</span>
                      <p className="text-white text-xs">
                        {new Date(item.EndDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium text-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultInventoryResult;