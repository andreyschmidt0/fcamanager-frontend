import React, { useEffect, useState, useCallback, useMemo } from 'react';import { RefreshCcw, Trash2, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import DataTable, { TableColumn } from '../common/DataTable';
import TableFilter, { FilterField } from '../common/TableFilter';
import { SubmitButton, CancelButton } from '../common/ActionButton';

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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemNo, setNewItemNo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valores digitados pelo usuário (sem delay)
  const [inputName, setInputName] = useState('');
  const [inputValue, setInputValue] = useState('');

  // Valores com debounce que disparam a busca
  const [filterName, setFilterName] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterName(inputName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterValue(inputValue);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

// ... (dentro do componente ConsultCampItems)

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.getCampItems({
        name: filterName,
        value: filterValue
      });

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
  }, [filterName, filterValue]);

  // Buscar itens quando filtros mudarem (após debounce)
  useEffect(() => {
    if (isOpen && hasLoaded) {
      loadItems();
    }
  }, [filterName, filterValue, isOpen, hasLoaded, loadItems]);

  // Carregar inicial ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setHasLoaded(true);
      loadItems();
    } else {
      setItems([]);
      setError('');
      // Limpar inputs
      setInputName('');
      setInputValue('');
      // Limpar filtros
      setFilterName('');
      setFilterValue('');
      setHasLoaded(false);
    }
  }, [isOpen, loadItems]);

  const handleAddItem = async () => {
    const numericItem = parseInt(newItemNo, 10);
    if (isNaN(numericItem) || numericItem <= 0) {
      toast.error('Informe um ItemNo válido.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await apiService.addCampItem(numericItem);
      if (result.success) {
        toast.success(result.message || 'Item adicionado ao modo CAMP.');
        setShowAddModal(false);
        setNewItemNo('');
        loadItems();
      } else {
        toast.error(result.error || 'Erro ao adicionar item.');
      }
    } catch (err) {
      console.error('Erro ao adicionar item CAMP:', err);
      toast.error('Erro ao adicionar item CAMP.');
    } finally {
      setIsSubmitting(false);
    }
  };

// Atualizar handleDeleteItem com useCallback
  const handleDeleteItem = useCallback(async (itemNo: number) => {
    const confirm = window.confirm(`Remover o item ${itemNo} do modo CAMP?`);
    if (!confirm) return;
    setIsSubmitting(true);
    try {
      const result = await apiService.deleteCampItem(itemNo);
      if (result.success) {
        toast.success(result.message || 'Item removido do modo CAMP.');
        loadItems();
      } else {
        toast.error(result.error || 'Erro ao remover item.');
      }
    } catch (err) {
      console.error('Erro ao remover item CAMP:', err);
      toast.error('Erro ao remover item CAMP.');
    } finally {
      setIsSubmitting(false);
    }
  }, [loadItems]); // Depende do loadItems


  // Definir filtros
  const filters: FilterField[] = [
    {
      key: 'name',
      label: 'Filtrar por Nome',
      placeholder: 'Digite o nome do item...',
      value: inputName,
      onChange: setInputName
    },
    {
      key: 'value',
      label: 'Filtrar por ItemNo',
      placeholder: 'Digite o ItemNo...',
      value: inputValue,
      onChange: setInputValue
    }
  ];

// Definir colunas (Com useMemo)
  const columns = useMemo<TableColumn<CampItem>[]>(() => [
    {
      key: 'Name',
      header: 'Nome do Item',
      render: (row) => (
        <div>
          <div className="text-white font-medium">{row.Name || 'N/A'}</div>
          {row.ItemType !== undefined && row.ItemType !== null && (
            <div className="text-xs text-gray-400">ItemType: {row.ItemType}</div>
          )}
        </div>
      )
    },
    {
      key: 'AllowType',
      header: 'AllowType',
      className: 'px-4 py-3 text-sm text-gray-200'
    },
    {
      key: 'ValueType',
      header: 'ValueType',
      className: 'px-4 py-3 text-sm text-gray-200'
    },
    {
      key: 'Value',
      header: 'Value (ItemNo)',
      className: 'px-4 py-3 text-sm text-gray-200'
    },
    {
      key: 'actions',
      header: 'Ações',
      headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700',
      render: (row) => (
        <div className="text-right">
          <button
            onClick={() => handleDeleteItem(row.Value)}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      ),
      className: 'px-4 py-3'
    }
  ], [handleDeleteItem, isSubmitting]); // Dependências

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="ITENS DO MODO CAMP"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {/* Ações */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">
                {isLoading
                  ? 'Carregando...'
                  : `Exibindo ${items.length} itens do modo CAMP`}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Adicionar Item
              </button>
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

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="text-red-400" size={24} />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Filtros - sempre visíveis após carregar */}
          {hasLoaded && (
            <TableFilter filters={filters} columnsPerRow={2} />
          )}

          {/* Tabela */}
          {!isLoading && items.length > 0 ? (
            <DataTable
              columns={columns}
              data={items}
              totalCount={items.length}
              maxHeight="60vh"
            />
          ) : hasLoaded && !isLoading ? (
            <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
              <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
              <p className="text-gray-400 text-lg">Nenhum item encontrado</p>
              <p className="text-sm text-gray-400 mt-2">Tente ajustar os filtros ou atualizar a lista</p>
            </div>
          ) : null}

          {/* Loading State */}
          {isLoading && (
            <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando itens...</p>
            </div>
          )}
        </div>
      </BaseModal>

      {/* Modal de Adicionar Item */}
      {showAddModal && (
        <BaseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="ADICIONAR ITEM CAMP"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">ItemNo</label>
              <input
                type="number"
                value={newItemNo}
                onChange={(e) => setNewItemNo(e.target.value)}
                className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Ex: 17998"
              />
            </div>
            <div className="flex gap-3 justify-end pt-4">
              <CancelButton
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </CancelButton>
              <SubmitButton
                onClick={handleAddItem}
                disabled={isSubmitting}
                loading={isSubmitting}
                loadingText="Salvando..."
                className="flex-1"
              >
                Adicionar
              </SubmitButton>
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};

export default ConsultCampItems;
