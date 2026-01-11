import React, { useState, useEffect, useCallback } from 'react';
import { Search, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import { CancelButton, SubmitButton } from '../common/ActionButton';

interface Item {
  ItemNo: number;
  Name: string;
  ItemGrade: number;
  ItemType: number;
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
  NewCashPrice?: number;
  NewItemGrade?: number;
}

interface ChangeItemGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PriceMatrix {
  ItemType: number;
  TypeName: string;
  Price9Stars_1Day: number;
  Price9Stars_7Days: number;
  Price9Stars_30Days: number;
  Price9Stars_90Days: number;
  Price9Stars_Perm: number;
  Price8Stars_1Day: number;
  Price8Stars_7Days: number;
  Price8Stars_30Days: number;
  Price8Stars_90Days: number;
  Price8Stars_Perm: number;
  Price7Stars_1Day: number;
  Price7Stars_7Days: number;
  Price7Stars_30Days: number;
  Price7Stars_90Days: number;
  Price7Stars_Perm: number;
  Price6Stars_1Day: number;
  Price6Stars_7Days: number;
  Price6Stars_30Days: number;
  Price6Stars_90Days: number;
  Price6Stars_Perm: number;
  Price5Stars_1Day: number;
  Price5Stars_7Days: number;
  Price5Stars_30Days: number;
  Price5Stars_90Days: number;
  Price5Stars_Perm: number;
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
  const [priceMatrix, setPriceMatrix] = useState<PriceMatrix | null>(null);
  const [showPriceMatrix, setShowPriceMatrix] = useState(false);

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

  const fetchAffectedProducts = useCallback(async (itemNos: number[], gradeValue?: number) => {
    if (itemNos.length === 0) {
      setAffectedProducts([]);
      return;
    }
    try {
      const result = await apiService.getAffectedProductsByItemNos(itemNos, gradeValue);
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
    fetchAffectedProducts(itemNos, newItemGrade);

    // Fetch price matrix for the first selected item's ItemType
    if (itemNos.length > 0 && items.length > 0) {
      const firstItem = items.find(i => i.ItemNo === itemNos[0]);
      if (firstItem) {
        fetchPriceMatrix(firstItem.ItemType);
      }
    } else {
      setPriceMatrix(null);
    }
  }, [selectedItems, newItemGrade, fetchAffectedProducts, items]);

  const fetchPriceMatrix = async (itemType: number) => {
    try {
      const result = await apiService.getPriceMatrixForItemType(itemType);
      if (result.success && result.data) {
        setPriceMatrix(result.data);
      } else {
        setPriceMatrix(null);
      }
    } catch (err) {
      console.error('Erro ao buscar matriz de preços:', err);
      setPriceMatrix(null);
    }
  };

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


  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR VALOR DO ITEM"
      maxWidth="4xl"
    >
      <div className="space-y-6">
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
                          <th className="px-2 py-1 text-right">Preço Atual</th>
                          <th className="px-2 py-1 text-right">Novo Preço</th>
                          <th className="px-2 py-1 text-center">Mudança</th>
                        </tr>
                      </thead>
                      <tbody>
                        {affectedProducts.map(p => {
                          const priceDiff = p.NewCashPrice ? p.NewCashPrice - p.CashPrice : 0;
                          const priceChangePercent = p.CashPrice > 0 ? ((priceDiff / p.CashPrice) * 100).toFixed(1) : '0';
                          return (
                            <tr key={p.ProductID} className="border-t border-gray-800 hover:bg-gray-800">
                              <td className="px-2 py-1 text-left">
                                <div className="truncate" title={p.ProductName}>
                                  {p.ProductName}
                                </div>
                              </td>
                              <td className="px-2 py-1 text-center text-gray-400">{p.PeriodName}</td>
                              <td className="px-2 py-1 text-right text-gray-400">{p.CashPrice?.toLocaleString()}</td>
                              <td className="px-2 py-1 text-right text-green-400">
                                {p.NewCashPrice ? p.NewCashPrice.toLocaleString() : '-'}
                              </td>
                              <td className="px-2 py-1 text-center">
                                {p.NewCashPrice ? (
                                  <span className={priceDiff > 0 ? 'text-green-400' : priceDiff < 0 ? 'text-red-400' : 'text-gray-400'}>
                                    {priceDiff > 0 ? '+' : ''}{priceDiff.toLocaleString()} ({priceChangePercent}%)
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-400">
                      {selectedItems.size === 0 ? 'Selecione itens para ver os produtos afetados' : 'Nenhum produto encontrado para os itens selecionados'}
                    </div>
                  )}
                </div>
              </div>

              {/* Price Matrix Section */}
              {priceMatrix && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Tabela de Preços - {priceMatrix.TypeName}</h3>
                    <button
                      onClick={() => setShowPriceMatrix(!showPriceMatrix)}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      {showPriceMatrix ? 'Ocultar' : 'Mostrar'} Tabela
                    </button>
                  </div>
                  {showPriceMatrix && (
                    <div className="border border-gray-700 rounded-lg bg-[#1d1e24] overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-[#16171b]">
                            <th className="px-2 py-2 text-left sticky left-0 bg-[#16171b] z-10">Estrelas</th>
                            <th className="px-2 py-2 text-right">1 Dia</th>
                            <th className="px-2 py-2 text-right">7 Dias</th>
                            <th className="px-2 py-2 text-right">30 Dias</th>
                            <th className="px-2 py-2 text-right">90 Dias</th>
                            <th className="px-2 py-2 text-right">Permanente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[9, 8, 7, 6, 5].map(stars => {
                            const isCurrentGrade = stars === newItemGrade;
                            return (
                              <tr
                                key={stars}
                                className={`border-t border-gray-800 ${isCurrentGrade ? 'bg-green-900/20' : ''}`}
                              >
                                <td className={`px-2 py-2 font-medium sticky left-0 ${isCurrentGrade ? 'bg-green-900/20' : 'bg-[#1d1e24]'} z-10`}>
                                  {stars} ⭐ {isCurrentGrade && <span className="text-green-400 ml-1">(Selecionado)</span>}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-300">
                                  {priceMatrix[`Price${stars}Stars_1Day` as keyof PriceMatrix]?.toLocaleString() || '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-300">
                                  {priceMatrix[`Price${stars}Stars_7Days` as keyof PriceMatrix]?.toLocaleString() || '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-300">
                                  {priceMatrix[`Price${stars}Stars_30Days` as keyof PriceMatrix]?.toLocaleString() || '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-gray-300">
                                  {priceMatrix[`Price${stars}Stars_90Days` as keyof PriceMatrix]?.toLocaleString() || '-'}
                                </td>
                                <td className="px-2 py-2 text-right text-green-400 font-medium">
                                  {priceMatrix[`Price${stars}Stars_Perm` as keyof PriceMatrix]?.toLocaleString() || '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-400">
            {selectedItems.size} item(s) selecionado(s)
          </p>
          <div className="flex gap-3">
            <CancelButton onClick={onClose}>Cancelar</CancelButton>
            <SubmitButton
              onClick={handleSubmit}
              loading={isUpdating}
              disabled={selectedItems.size === 0}
              icon={Save}
            >
              Confirmar e Alterar
            </SubmitButton>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default ChangeItemGradeModal;
