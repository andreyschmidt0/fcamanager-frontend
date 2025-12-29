import React, { useState, useEffect, useCallback } from 'react';
import { X, Filter, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface ItemData {
  ProductID: number;
  ProductName: string;
  ProductType: string;
  Price: number;
  Period00: number;
  ShopView: number;
  SaleType: number;
  ItemNo: number;
  ItemType: number;
  ItemGrade: number;
  ModoCamp: number;
  NewTag: number;
  HotTag: number;
  SellBackPrice: number;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface ConsultItemResultProps {
  isOpen: boolean;
  onClose: () => void;
  itemsData: ItemData[];
  pagination: PaginationInfo;
  searchFilters: {
    itemname?: string;
    availableItems?: number;
    daysperiod?: number;
    selltype?: number;
    productId?: number;
    itemNo?: number;
    itemGrade?: number;
  };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

const ConsultItemResult: React.FC<ConsultItemResultProps> = ({ 
  isOpen, 
  onClose, 
  itemsData, 
  pagination,
  searchFilters,
  onPageChange,
  isLoading = false
}) => {
  const [filteredData, setFilteredData] = useState<ItemData[]>(itemsData);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Função para aplicar filtros locais
  const applyLocalFilters = (data: ItemData[], searchTerm: string) => {
    let filtered = data;

    // Filtrar por nome local (não afeta a API)
    if (searchTerm && searchTerm.trim() !== '') {
      filtered = filtered.filter(item => 
        item.ProductName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Debounce para o termo de pesquisa local
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  // Aplicar filtros locais quando dados ou termo de busca mudarem
  useEffect(() => {
    const filtered = applyLocalFilters(itemsData, debouncedSearchTerm);
    setFilteredData(filtered);
  }, [itemsData, debouncedSearchTerm]);

  // Resetar filtros locais quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setLocalSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, [isOpen]);

  // Função para obter texto do tipo de venda
  const getSaleTypeText = (saleType: number) => {
    switch (saleType) {
      case 0: return 'GP';
      case 1: return 'Cash';
      case 3: return 'GP VIP';
      default: return 'N/A';
    }
  };

  // Função para obter cor do tipo de venda
  const getSaleTypeColor = (saleType: number) => {
    switch (saleType) {
      case 0: return 'text-green-400'; // GP
      case 1: return 'text-blue-400';  // Cash
      case 3: return 'text-purple-400'; // GP VIP
      default: return 'text-gray-400';
    }
  };

  // Função para obter texto das estrelas
  const getStarsText = (grade: number) => {
    if (grade === 0) return 'Sem Estrela';
    if (grade <= 3) return `${'⭐'.repeat(grade)} Bronze`;
    if (grade <= 6) return `${'⭐'.repeat(grade - 3)} Prata`;
    if (grade <= 9) return `${'⭐'.repeat(grade - 6)} Ouro`;
    return 'N/A';
  };

  // Função para obter texto dos filtros ativos
  const getActiveFiltersText = () => {
    const filters = [];
    
    if (searchFilters.itemname) {
      filters.push(`Nome: "${searchFilters.itemname}"`);
    }
    if (searchFilters.availableItems !== undefined) {
      filters.push(`Loja: ${searchFilters.availableItems === 1 ? 'Disponível' : 'Indisponível'}`);
    }
    if (searchFilters.selltype !== undefined) {
      filters.push(`Venda: ${getSaleTypeText(searchFilters.selltype)}`);
    }
    if (searchFilters.daysperiod) {
      filters.push(`Período: ${searchFilters.daysperiod} dias`);
    }
    if (searchFilters.productId) {
      filters.push(`ID Produto: ${searchFilters.productId}`);
    }
    if (searchFilters.itemNo) {
      filters.push(`Item Nº: ${searchFilters.itemNo}`);
    }
    if (searchFilters.itemGrade !== undefined) {
      filters.push(`Grau: ${getStarsText(searchFilters.itemGrade)}`);
    }

    return filters.length > 0 ? ` (${filters.join(', ')})` : '';
  };

  // Função para navegar páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !isLoading) {
      onPageChange(newPage);
    }
  };

  // Gerar array de páginas para exibir
  const getPageNumbers = () => {
    const delta = 2; // Quantas páginas mostrar de cada lado da atual
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, pagination.page - delta); 
         i <= Math.min(pagination.totalPages - 1, pagination.page + delta); 
         i++) {
      range.push(i);
    }

    if (pagination.page - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (pagination.page + delta < pagination.totalPages - 1) {
      rangeWithDots.push('...', pagination.totalPages);
    } else {
      if (pagination.totalPages > 1) {
        rangeWithDots.push(pagination.totalPages);
      }
    }

    return rangeWithDots.filter((page, index, array) => array.indexOf(page) === index);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            CONSULTA DE ITENS{getActiveFiltersText()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Informações e Filtro Local */}
          <div className="mb-6 p-4 bg-[#1d1e24] rounded-lg border border-gray-600 flex-shrink-0">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* Info */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-green-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Resultados da Busca
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isLoading ? 'Carregando...' : `${pagination.total} itens encontrados`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Busca Local */}
              <div className="flex items-center gap-2 min-w-[300px]">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                  placeholder="Buscar na página atual..."
                  className="flex-1 px-3 py-2 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold">Carregando itens...</h3>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold mb-3">
                  {itemsData.length === 0 ? 'Nenhum item encontrado' : 'Nenhum item na busca local'}
                </h3>
                <p className="text-lg">
                  {itemsData.length === 0 
                    ? 'Tente ajustar os filtros de busca.' 
                    : 'Tente ajustar o termo de busca local.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {filteredData.map((item) => (
                  <div
                    key={`${item.ProductID}-${item.ItemNo}`}
                    className={`bg-[#1d1e24] rounded-lg p-4 border-l-4 ${
                      item.ShopView === 1 ? 'border-l-green-500' : 'border-l-gray-500'
                    } hover:bg-[#252631] transition-colors`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-9 gap-3 text-sm items-center">
                      {/* Item Info */}
                      <div className="lg:col-span-2">
                        <p className="text-white font-medium text-base leading-tight">{item.ProductName}</p>
                        <p className="text-xs text-gray-500">ProductID: {item.ProductID} | Item: {item.ItemNo}</p>
                        <p className="text-xs text-blue-400">{item.ProductType}</p>
                      </div>

                      {/* Price & Sale Type */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Preço:</span>
                        <p className="text-white font-medium">{item.Price.toLocaleString()}</p>
                        <p className={`text-xs font-medium ${getSaleTypeColor(item.SaleType)}`}>
                          {getSaleTypeText(item.SaleType)}
                        </p>
                      </div>

                      {/* Period */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Período:</span>
                        <p className="text-white font-medium">{item.Period00}d</p>
                      </div>

                      {/* Shop Status */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Loja:</span>
                        <p className={`font-medium text-sm ${item.ShopView === 1 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.ShopView === 1 ? 'Disponível' : 'Indisponível'}
                        </p>
                      </div>

                      {/* Stars/Grade */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Grau:</span>
                        <p className="text-white font-medium text-xs">
                          {getStarsText(item.ItemGrade)}
                        </p>
                      </div>

                      {/* Modo CAMP */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">CAMP:</span>
                        <p className="text-white font-medium text-xs">
                          {item.ModoCamp > 0 ? 'Sim' : 'Não'}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="text-center">
                        <div className="flex gap-1 justify-center">
                          {item.NewTag === 1 && (
                            <span className="px-1 py-0.5 bg-yellow-600 text-yellow-100 rounded text-xs font-bold">
                              NEW
                            </span>
                          )}
                          {item.HotTag === 1 && (
                            <span className="px-1 py-0.5 bg-red-600 text-red-100 rounded text-xs font-bold">
                              HOT
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Sell Back Price */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Venda:</span>
                        <p className="text-white font-medium text-xs">
                          {item.SellBackPrice > 0 ? item.SellBackPrice.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && pagination.totalPages > 1 && (
            <div className="mt-6 pt-4 border-t border-gray-600 flex-shrink-0">
              <div className="flex items-center justify-between">
                {/* Page Info */}
                <div className="text-sm text-gray-400">
                  Página {pagination.page} de {pagination.totalPages} 
                  ({((pagination.page - 1) * pagination.pageSize + 1).toLocaleString()} - {Math.min(pagination.page * pagination.pageSize, pagination.total).toLocaleString()} de {pagination.total.toLocaleString()})
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1 || isLoading}
                    className="px-3 py-2 bg-[#2a2b32] text-white rounded-lg hover:bg-[#3a3b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      <React.Fragment key={index}>
                        {page === '...' ? (
                          <span className="px-2 py-2 text-gray-400">...</span>
                        ) : (
                          <button
                            onClick={() => handlePageChange(page as number)}
                            disabled={isLoading}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              page === pagination.page
                                ? 'bg-green-600 text-white'
                                : 'bg-[#2a2b32] text-white hover:bg-[#3a3b42]'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {page}
                          </button>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Next */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages || isLoading}
                    className="px-3 py-2 bg-[#2a2b32] text-white rounded-lg hover:bg-[#3a3b42] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

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

export default ConsultItemResult;