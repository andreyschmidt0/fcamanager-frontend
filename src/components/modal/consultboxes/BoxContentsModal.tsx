import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import BaseModal from '../../common/BaseModal';
import DataTable, { TableColumn } from '../../common/DataTable';
import TableFilter, { FilterField } from '../../common/TableFilter';

interface BoxData {
  BoxName: string;
  GachaponItemNo: number;
}

interface ItemInBox {
  BoxName: string;
  GachaponItemNo: number;
  ItemNo: number;
  ItemName: string;
  ItemType: number;
  Percentage: number;
  Period: number;
  ConsumeType: number;
}

interface ProductInBox {
  BoxName: string;
  GachaponItemNo: number;
  ProductID: number;
  ProductName: string;
  ItemNo00: number;
  Percentage: number;
  Period: number;
  ConsumeType: number;
}

interface BoxContentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBox: BoxData | null;
  boxType: 'items' | 'products';
}

const BoxContentsModal: React.FC<BoxContentsModalProps> = ({
  isOpen,
  onClose,
  selectedBox,
  boxType
}) => {
  const [boxContents, setBoxContents] = useState<(ItemInBox | ProductInBox)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Valores digitados pelo usuário (sem delay)
  const [inputItemNo, setInputItemNo] = useState('');
  const [inputItemName, setInputItemName] = useState('');
  const [inputItemType, setInputItemType] = useState('');
  const [inputPercentage, setInputPercentage] = useState('');
  const [inputProductID, setInputProductID] = useState('');
  const [inputProductName, setInputProductName] = useState('');
  const [inputPeriod, setInputPeriod] = useState('');

  // Valores com debounce que disparam a busca
  const [filterItemNo, setFilterItemNo] = useState('');
  const [filterItemName, setFilterItemName] = useState('');
  const [filterItemType, setFilterItemType] = useState('');
  const [filterPercentage, setFilterPercentage] = useState('');
  const [filterProductID, setFilterProductID] = useState('');
  const [filterProductName, setFilterProductName] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  // Debounce para filtros de items
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterItemNo(inputItemNo);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputItemNo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterItemName(inputItemName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputItemName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterItemType(inputItemType);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputItemType]);

  // Debounce para filtros de products
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterProductID(inputProductID);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputProductID]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterProductName(inputProductName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputProductName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterPeriod(inputPeriod);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputPeriod]);

  // Debounce para percentage (comum a ambos)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterPercentage(inputPercentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputPercentage]);

  // Buscar conteúdo quando modal abrir ou filtros mudarem
  useEffect(() => {
    if (isOpen && selectedBox && hasLoaded) {
      loadContents();
    }
  }, [filterItemNo, filterItemName, filterItemType, filterPercentage, filterProductID, filterProductName, filterPeriod]);

  // Carregar inicial ao abrir
  useEffect(() => {
    if (isOpen && selectedBox) {
      setHasLoaded(true);
      loadContents();
    } else if (!isOpen) {
      setBoxContents([]);
      // Limpar inputs
      setInputItemNo('');
      setInputItemName('');
      setInputItemType('');
      setInputPercentage('');
      setInputProductID('');
      setInputProductName('');
      setInputPeriod('');
      // Limpar filtros
      setFilterItemNo('');
      setFilterItemName('');
      setFilterItemType('');
      setFilterPercentage('');
      setFilterProductID('');
      setFilterProductName('');
      setFilterPeriod('');
      setHasLoaded(false);
    }
  }, [isOpen, selectedBox]);

  const loadContents = async () => {
    if (!selectedBox) return;

    setIsLoading(true);
    try {
      if (boxType === 'items') {
        const filters = {
          itemNo: filterItemNo,
          itemName: filterItemName,
          itemType: filterItemType,
          percentage: filterPercentage
        };
        const result = await apiService.getItemsInBox(selectedBox.GachaponItemNo, filters);
        if (result.success && result.data) {
          setBoxContents(result.data);
        } else {
          setBoxContents([]);
        }
      } else {
        const filters = {
          productID: filterProductID,
          productName: filterProductName,
          period: filterPeriod,
          percentage: filterPercentage
        };
        const result = await apiService.getProductsInBox(selectedBox.GachaponItemNo, filters);
        if (result.success && result.data) {
          setBoxContents(result.data);
        } else {
          setBoxContents([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar conteúdo da caixa:', error);
      setBoxContents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getItemTypeLabel = (itemType: number): string => {
    const types: { [key: number]: string } = {
      0: 'AR', 1: 'SMG', 2: 'Sniper', 3: 'Machine Gun', 4: 'Pistol',
      5: 'Double Shotgun', 6: 'Grenade', 7: 'Knife', 8: 'Explosives',
      11: 'Hat', 12: 'Face', 14: 'Uniform', 15: 'Vest', 16: 'Backpack',
      17: 'Silencer', 18: 'Scope', 19: 'Magazine', 20: 'Box',
      21: 'Function Item', 22: 'Character', 25: 'GP Reward',
      26: 'Shotgun', 27: 'Detector', 29: 'Special Items',
      30: 'Specialist', 32: 'Material', 33: 'Customization Parts',
      34: 'Medal', 35: 'Specialist Enhancement', 36: 'Assassin Items',
      37: 'Assassins', 38: 'Clothing Cosmetic', 40: 'Hat Cosmetic',
      41: 'Face Cosmetic', 42: 'Vest Cosmetic', 43: 'Backpack Cosmetic',
      44: 'Roulette Coin', 45: 'Coupon', 46: 'Head Enhancement',
      47: 'Face Enhancement', 48: 'Vest Enhancement', 49: 'Bullet Enhancement',
      50: 'Weapon Enhancement', 51: 'Fixed EXP'
    };
    return types[itemType] || 'Others';
  };

  if (!isOpen || !selectedBox) return null;

  // Definir filtros baseado no tipo de caixa
  const itemFilters: FilterField[] = [
    {
      key: 'itemNo',
      label: 'Filtrar por Item No',
      placeholder: 'Digite o Item No...',
      value: inputItemNo,
      onChange: setInputItemNo
    },
    {
      key: 'itemName',
      label: 'Filtrar por Nome',
      placeholder: 'Digite o nome do item...',
      value: inputItemName,
      onChange: setInputItemName
    },
    {
      key: 'itemType',
      label: 'Filtrar por Tipo',
      placeholder: 'Digite o tipo (número)...',
      value: inputItemType,
      onChange: setInputItemType
    },
    {
      key: 'percentage',
      label: 'Filtrar por Porcentagem',
      placeholder: 'Ex: 0.5',
      value: inputPercentage,
      onChange: setInputPercentage
    }
  ];

  const productFilters: FilterField[] = [
    {
      key: 'productID',
      label: 'Filtrar por Product ID',
      placeholder: 'Digite o Product ID...',
      value: inputProductID,
      onChange: setInputProductID
    },
    {
      key: 'productName',
      label: 'Filtrar por Nome',
      placeholder: 'Digite o nome do produto...',
      value: inputProductName,
      onChange: setInputProductName
    },
    {
      key: 'period',
      label: 'Filtrar por Período',
      placeholder: 'Digite o período (dias)...',
      value: inputPeriod,
      onChange: setInputPeriod
    },
    {
      key: 'percentage',
      label: 'Filtrar por Porcentagem',
      placeholder: 'Ex: 0.5',
      value: inputPercentage,
      onChange: setInputPercentage
    }
  ];

  // Definir colunas baseado no tipo de caixa
  const itemColumns: TableColumn<ItemInBox>[] = [
    {
      key: 'ItemNo',
      header: 'Item No',
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'ItemName',
      header: 'Nome do Item',
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'ItemType',
      header: 'Tipo',
      render: (item: ItemInBox) => getItemTypeLabel(item.ItemType),
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'Percentage',
      header: 'Porcentagem',
      render: (item: ItemInBox) => `${item.Percentage}%`,
      headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700',
      className: 'px-4 py-3 text-sm text-right text-gray-400'
    }
  ];

  const productColumns: TableColumn<ProductInBox>[] = [
    {
      key: 'ProductID',
      header: 'Product ID',
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'ProductName',
      header: 'Nome do Produto',
      className: 'px-4 py-3 text-sm text-white'
    },
    {
      key: 'Period',
      header: 'Período (dias)',
      render: (product: ProductInBox) => `${product.Period} dias`,
      className: 'px-4 py-3 text-sm text-gray-400'
    },
    {
      key: 'Percentage',
      header: 'Porcentagem',
      render: (product: ProductInBox) => `${product.Percentage}%`,
      headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700',
      className: 'px-4 py-3 text-sm text-right text-gray-400'
    }
  ];

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedBox.BoxName}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Info Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            {boxType === 'items' ? 'Itens na Caixa' : 'Produtos na Caixa'} ({boxContents.length})
          </h3>
          <span className="text-sm text-gray-400">
            ID: {selectedBox.GachaponItemNo}
          </span>
        </div>

        {/* Filtros - sempre visíveis após carregar */}
        {hasLoaded && (
          <TableFilter
            filters={boxType === 'items' ? itemFilters : productFilters}
            columnsPerRow={4}
          />
        )}

        {/* Tabela */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando conteúdo...</p>
            </div>
          </div>
        ) : boxContents.length === 0 ? (
          <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
            <AlertCircle className="mx-auto text-gray-500 mb-3" size={48} />
            <p className="text-gray-400 text-lg">Nenhum item encontrado nesta caixa</p>
          </div>
        ) : boxType === 'items' ? (
          <DataTable
            columns={itemColumns}
            data={boxContents as ItemInBox[]}
            totalCount={boxContents.length}
            maxHeight="60vh"
          />
        ) : (
          <DataTable
            columns={productColumns}
            data={boxContents as ProductInBox[]}
            totalCount={boxContents.length}
            maxHeight="60vh"
          />
        )}
      </div>
    </BaseModal>
  );
};

export default BoxContentsModal;
