import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

type BoxType = 'item' | 'produto';

interface ItemSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  boxType: BoxType;
  title?: string;
  searchFunction: (filters: any) => Promise<any>;
}

const ItemSearchModal: React.FC<ItemSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  boxType,
  title,
  searchFunction
}) => {
  // Estados de input (valores digitados - sem delay)
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  const [inputFilterName, setInputFilterName] = useState('');
  const [inputFilterItemNo, setInputFilterItemNo] = useState('');
  const [inputFilterPeriod, setInputFilterPeriod] = useState('');

  // Estados de filtro (com debounce - disparam busca)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterItemNo, setFilterItemNo] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputSearchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterName(inputFilterName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilterName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterItemNo(inputFilterItemNo);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilterItemNo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterPeriod(inputFilterPeriod);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputFilterPeriod]);

  // Buscar itens/produtos
  const handleSearch = async () => {
    setIsSearching(true);
    setError('');

    try {
      const filters = {
        searchTerm: searchTerm || undefined,
        filterName: filterName || undefined,
        filterItemNo: filterItemNo || undefined,
        filterPeriod: filterPeriod || undefined
      };

      const result = await searchFunction(filters);

      if (result.success && result.data) {
        setSearchResults(result.data);
      } else {
        setError(result.error || 'Erro ao buscar');
      }
    } catch (err) {
      setError('Erro ao buscar');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  // Carregar dados inicial ao abrir modal
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      setHasLoaded(true);
      handleSearch();
    } else if (!isOpen) {
      setHasLoaded(false);
      setSearchResults([]);
      setInputSearchTerm('');
      setInputFilterName('');
      setInputFilterItemNo('');
      setInputFilterPeriod('');
      setSearchTerm('');
      setFilterName('');
      setFilterItemNo('');
      setFilterPeriod('');
      setError('');
    }
  }, [isOpen]);

  // Buscar quando filtros mudarem (após debounce)
  useEffect(() => {
    if (isOpen && hasLoaded) {
      handleSearch();
    }
  }, [searchTerm, filterName, filterItemNo, filterPeriod]);

  const handleItemSelect = (item: any) => {
    onSelect(item);
    onClose();
  };

  const modalTitle = title || `Buscar ${boxType === 'item' ? 'Item' : 'Produto'}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
      <div className="bg-[#111216] border border-black rounded-lg shadow-xl text-white w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium">{modalTitle}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Busca geral */}
          <div>
            <input
              type="text"
              value={inputSearchTerm}
              onChange={(e) => setInputSearchTerm(e.target.value)}
              placeholder="Busca geral (nome ou código)..."
              className="w-full bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2"
              autoFocus
            />
          </div>

          {/* Filtros específicos */}
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={inputFilterName}
              onChange={(e) => setInputFilterName(e.target.value)}
              placeholder="Filtrar por Nome..."
              className="bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={inputFilterItemNo}
              onChange={(e) => setInputFilterItemNo(e.target.value)}
              placeholder={`Filtrar por ${boxType === 'item' ? 'ItemNo' : 'ProductID'}...`}
              className="bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={inputFilterPeriod}
              onChange={(e) => setInputFilterPeriod(e.target.value)}
              placeholder="Filtrar por Período..."
              className="bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          {isSearching && <p className="text-gray-400 text-sm">Buscando...</p>}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {searchResults.length === 0 && hasLoaded && !isSearching ? (
            <p className="text-center text-gray-400 py-8">Nenhum resultado encontrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#16171b] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-2 text-left">Nome</th>
                  <th className="px-6 py-2 text-center w-32">
                    {boxType === 'item' ? 'ItemNo' : 'ProductID'}
                  </th>
                  <th className="px-6 py-2 text-center w-32">Período</th>
                  <th className="px-6 py-2 text-center w-40">Ação</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((item, index) => {
                  const itemId = boxType === 'item' ? item.ItemNo : item.ProductID;
                  const period = boxType === 'item' ? item.DefaultPeriod : item.Period;
                  const name = boxType === 'item' ? item.Name : item.ProductName;

                  return (
                    <tr key={index} className="border-t border-gray-800 hover:bg-gray-800">
                      <td className="px-6 py-2">
                        <p className="font-medium">{name}</p>
                      </td>
                      <td className="px-6 py-2 text-center text-gray-400">
                        {itemId}
                      </td>
                      <td className="px-6 py-2 text-center text-gray-400">
                        {period} dias
                      </td>
                      <td className="px-6 py-2 text-center">
                        <button
                          onClick={() => handleItemSelect(item)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition-colors"
                        >
                          Adicionar {boxType === 'item' ? 'Item' : 'Produto'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemSearchModal;
