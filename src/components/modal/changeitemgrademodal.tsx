import React, { useState, useEffect, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../../services/api-tauri.service';

interface Item {
  ItemNo: number;
  Name: string;
  ItemGrade: number;
}

interface Product {
  ProductID: number;
  ProductName: string;
  ItemNo00: number;
  ItemName: string;
  CurrentItemGrade: number;
  ItemType: number;
  ConsumeType00: number;
  Period00: number;
  CashPrice: number;
  PointPrice: number;
  PeriodName: string;
}

interface ChangeItemGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeItemGradeModal: React.FC<ChangeItemGradeModalProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [newItemGrade, setNewItemGrade] = useState<number>(1);
  const [affectedProducts, setAffectedProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar itens quando o usuário digitar
  useEffect(() => {
    const searchItems = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setItems([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const result = await apiService.searchItemsForGradeChange(searchTerm);
        if (result.success) {
          setItems(result.data || []);
          if (result.data?.length === 0) {
            setError('Nenhum item encontrado.');
          }
        } else {
          throw new Error(result.error || 'Falha ao buscar itens.');
        }
      } catch (err: any) {
        setError(err.message || 'Ocorreu um erro ao buscar os itens.');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchItems();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const fetchAffectedProducts = useCallback(async (itemNos: number[]) => {
    if (itemNos.length === 0) {
      setAffectedProducts([]);
      return;
    }
    try {
      const result = await apiService.getAffectedProductsByItemNos(itemNos);
      if (result.success) {
        setAffectedProducts(result.data || []);
      } else {
        toast.error(result.error || 'Falha ao buscar produtos afetados.');
      }
    } catch (err) {
      toast.error('Ocorreu um erro ao buscar os produtos afetados.');
    }
  }, []);

  useEffect(() => {
    const itemNos = Array.from(selectedItems);
    fetchAffectedProducts(itemNos);
  }, [selectedItems, fetchAffectedProducts]);

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.ItemNo)));
    }
  };

  const handleSelectItem = (itemNo: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemNo)) {
      newSelection.delete(itemNo);
    } else {
      newSelection.add(itemNo);
    }
    setSelectedItems(newSelection);
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      toast.error('Selecione ao menos um item para alterar.');
      return;
    }
    if (newItemGrade < 1 || newItemGrade > 9) {
        toast.error('O ItemGrade deve ser entre 1 e 9.');
        return;
    }

    setIsUpdating(true);
    try {
      const itemNosArray = Array.from(selectedItems);
      const result = await apiService.updateItemGrade(itemNosArray, newItemGrade);
      if (result.success) {
        toast.success('Itens atualizados com sucesso!');
        // Limpar seleção e busca
        setSelectedItems(new Set());
        setSearchTerm('');
        setItems([]);
        onClose();
      } else {
        throw new Error(result.error || 'Falha ao atualizar itens.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Ocorreu um erro ao atualizar os itens.');
    } finally {
      setIsUpdating(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-[#111216] border border-black rounded-lg shadow-xl text-white w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-neofara">Alterar Valor do Item (ItemGrade)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Item selection */}
            <div className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Digite o nome ou código do item (mínimo 2 caracteres)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1d1e24] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div className="border border-gray-700 rounded-lg bg-[#1d1e24] h-64 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">Carregando...</div>
                ) : error ? (
                  <div className="flex justify-center items-center h-full text-red-500">{error}</div>
                ) : items.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    {searchTerm.length < 2 ? 'Digite no mínimo 2 caracteres para buscar itens' : 'Nenhum item encontrado'}
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="sticky top-0 bg-[#1d1e24] z-10">
                        <th className="px-2 py-2 text-left w-10">
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={selectedItems.size > 0 && selectedItems.size === items.length}
                            className="form-checkbox h-4 w-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                          />
                        </th>
                        <th className="px-2 py-2 text-center w-20">ItemNo</th>
                        <th className="px-2 py-2 text-left">Nome</th>
                        <th className="px-2 py-2 text-center w-24">Grade Atual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map(item => (
                        <tr key={item.ItemNo} className="border-t border-gray-800 hover:bg-gray-800">
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.ItemNo)}
                              onChange={() => handleSelectItem(item.ItemNo)}
                              className="form-checkbox h-4 w-4 text-green-600 bg-gray-700 border-gray-600 rounded"
                            />
                          </td>
                          <td className="px-2 py-2 text-center text-gray-400">{item.ItemNo}</td>
                          <td className="px-2 py-2">{item.Name}</td>
                          <td className="px-2 py-2 text-center">{item.ItemGrade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right side: Configuration and affected products */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Novo ItemGrade (1-9)</label>
                <input
                  type="number"
                  min="1"
                  max="9"
                  value={newItemGrade}
                  onChange={(e) => setNewItemGrade(Number(e.target.value))}
                  className="w-full bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Produtos Afetados ({affectedProducts.length})</h3>
                <div className="border border-gray-700 rounded-lg bg-[#1d1e24] h-48 overflow-y-auto custom-scrollbar">
                  {affectedProducts.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="sticky top-0 bg-[#1d1e24] border-b border-gray-700">
                          <th className="px-2 py-1 text-left">Produto</th>
                          <th className="px-2 py-1 text-center">Período</th>
                          <th className="px-2 py-1 text-right">Preço CA$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affectedProducts.map(p => (
                          <tr key={p.ProductID} className="border-t border-gray-800 hover:bg-gray-800">
                            <td className="px-2 py-1 text-left">
                              <div className="truncate" title={p.ProductName}>
                                {p.ProductName}
                              </div>
                            </td>
                            <td className="px-2 py-1 text-center text-gray-400">{p.PeriodName}</td>
                            <td className="px-2 py-1 text-right text-green-400">{p.CashPrice?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-400">
                      {selectedItems.size === 0 ? 'Selecione itens para ver os produtos afetados' : 'Nenhum produto encontrado para os itens selecionados'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 flex justify-end gap-4">
            <p className="text-sm text-gray-400 self-center">
                {selectedItems.size} item(s) selecionado(s).
            </p>
            <button
                onClick={handleSubmit}
                disabled={isUpdating || selectedItems.size === 0}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isUpdating ? 'Atualizando...' : 'Confirmar e Alterar'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeItemGradeModal;
