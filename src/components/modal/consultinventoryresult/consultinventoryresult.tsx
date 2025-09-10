import React, { useState, useEffect, useCallback } from 'react';
import { X, Filter, Power, Loader2 } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import toast from 'react-hot-toast';

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
  targetOidUser?: number | null;
  useType?: string;
  itemName?: string;
}

const ConsultInventoryResult: React.FC<ConsultInventoryResultProps> = ({ 
  isOpen, 
  onClose, 
  inventoryData, 
  playerName,
  targetOidUser,
  useType,
  itemName
}) => {
  const [filteredData, setFilteredData] = useState<InventoryItem[]>(inventoryData);
  const [localFilters, setLocalFilters] = useState({
    useType: useType || '',
    itemName: itemName || ''
  });
  const [searchTerm, setSearchTerm] = useState(itemName || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(itemName || '');
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

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

  // Debounce para o termo de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms de delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Atualizar localFilters quando debouncedSearchTerm mudar
  useEffect(() => {
    setLocalFilters(prev => ({
      ...prev,
      itemName: debouncedSearchTerm
    }));
  }, [debouncedSearchTerm]);

  // Aplicar filtros quando dados ou filtros mudarem
  useEffect(() => {
    const filtered = applyFilters(inventoryData, localFilters.useType, localFilters.itemName);
    setFilteredData(filtered);
  }, [inventoryData, localFilters]);

  // Resetar filtros quando modal abrir
  useEffect(() => {
    if (isOpen) {
      const initialItemName = itemName || '';
      setSearchTerm(initialItemName);
      setDebouncedSearchTerm(initialItemName);
      setLocalFilters({
        useType: useType || '',
        itemName: initialItemName
      });
    }
  }, [isOpen, useType, itemName]);

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'itemName') {
      setSearchTerm(value);
    } else {
      setLocalFilters(prev => ({
        ...prev,
        [filterType]: value
      }));
    }
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

  const handleToggleItemStatus = async (item: InventoryItem) => {
    if (!targetOidUser) {
      toast.error('Erro: targetOidUser não disponível');
      return;
    }

    const inventorySeqNo = item.InventorySeqNo;
    const currentStatus = item.UseType;
    const newAction = currentStatus === 1 ? 'I' : 'A'; // Toggle: se ativo (1) -> Inativar (I), se inativo (0) -> Ativar (A)
    
    // Adicionar item ao loading
    setLoadingItems(prev => new Set(Array.from(prev).concat(inventorySeqNo)));
    
    try {
      const result = await apiService.setInventoryItemStatus({
        targetOidUser,
        inventorySeqNo,
        action: newAction
      });

      if (result.success) {
        // Atualizar o status do item local
        const newUseType = newAction === 'A' ? 1 : 0;
        const newIeAtivo = newAction === 'A' ? 'Ativo' : 'Inativo';
        
        setFilteredData(prev => prev.map(prevItem => 
          prevItem.InventorySeqNo === inventorySeqNo 
            ? { ...prevItem, UseType: newUseType, ie_Ativo: newIeAtivo }
            : prevItem
        ));

        // Atualizar também os dados originais para manter sincronização
        inventoryData.forEach(originalItem => {
          if (originalItem.InventorySeqNo === inventorySeqNo) {
            originalItem.UseType = newUseType;
            originalItem.ie_Ativo = newIeAtivo;
          }
        });

        toast.success(`Item ${newAction === 'A' ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        toast.error(result.error || 'Erro ao alterar status do item');
      }
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
      toast.error('Erro ao alterar status do item');
    } finally {
      // Remover item do loading
      setLoadingItems(prev => {
        const newArray = Array.from(prev).filter(id => id !== inventorySeqNo);
        return new Set(newArray);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            INVENTÁRIO - {playerName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Filtros */}
          <div className="mb-6 p-3 bg-[#1d1e24] rounded-lg border border-gray-600 flex-shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Filtros de Busca
                </h3>
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Status:
                </label>
                <select
                  value={localFilters.useType}
                  onChange={(e) => handleFilterChange('useType', e.target.value)}
                  className="px-2 py-1 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm min-w-[100px]"
                >
                  <option value="">Todos</option>
                  <option value="0">Inativos</option>
                  <option value="1">Ativos</option>
                </select>
              </div>
              
              {/* Item Name Filter */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Nome:
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('itemName', e.target.value)}
                  placeholder="Ex: L96A1"
                  className="flex-1 px-2 py-1 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
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
              <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
              {filteredData.map((item) => (
                <div
                  key={item.InventorySeqNo}
                  className={`bg-[#1d1e24] rounded-lg p-3 border-l-4 ${
                    item.UseType === 1 ? 'border-l-green-500' : 'border-l-red-500'
                  } hover:bg-[#252631] transition-colors`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-8 gap-3 text-sm items-center">
                    {/* Item Info */}
                    <div className="md:col-span-2">
                      <p className="text-white font-medium text-base leading-tight">{item.Name}</p>
                      <p className="text-xs text-gray-500">InventorySeqNo: {item.InventorySeqNo}</p>
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

                    {/* Toggle Button */}
                    <div className="text-center">
                      <button
                        onClick={() => handleToggleItemStatus(item)}
                        disabled={loadingItems.has(item.InventorySeqNo)}
                        className={`
                          inline-flex items-center justify-center w-16 h-8 rounded-full transition-all duration-200 relative
                          ${item.UseType === 1 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-red-600 hover:bg-red-700'
                          }
                          ${loadingItems.has(item.InventorySeqNo) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        title={`${item.UseType === 1 ? 'Desativar' : 'Ativar'} item`}
                      >
                        {loadingItems.has(item.InventorySeqNo) ? (
                          <Loader2 size={14} className="text-white animate-spin" />
                        ) : (
                          <Power size={14} className="text-white" />
                        )}
                        <span className="ml-1 text-xs font-medium text-white">
                          {item.UseType === 1 ? 'ON' : 'OFF'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-600 flex-shrink-0">
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