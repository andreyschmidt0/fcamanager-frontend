import React from 'react';
import { X } from 'lucide-react';

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
  boxContents: (ItemInBox | ProductInBox)[];
  isLoading: boolean;
}

const BoxContentsModal: React.FC<BoxContentsModalProps> = ({
  isOpen,
  onClose,
  selectedBox,
  boxType,
  boxContents,
  isLoading
}) => {
  if (!isOpen || !selectedBox) return null;

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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#111216] z-10 relative flex items-center justify-center h-20 border-b border-gray-600">
          <h2 className="text-2xl font-bold text-white font-neofara tracking-wider">
            {selectedBox.BoxName}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando conteúdo...</p>
              </div>
            </div>
          ) : boxContents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">Nenhum item encontrado nesta caixa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  {boxType === 'items' ? 'Itens na Caixa' : 'Produtos na Caixa'} ({boxContents.length})
                </h3>
                <span className="text-sm text-gray-400">
                  ID: {selectedBox.GachaponItemNo}
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full">
                  <thead className="bg-[#0a0b0e]">
                    <tr>
                      {boxType === 'items' ? (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Item No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Nome do Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Tipo
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Product ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Nome do Produto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Período (dias)
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Porcentagem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {boxContents.map((item, index) => (
                      <tr key={index} className="hover:bg-[#1d1e24] transition-colors">
                        {boxType === 'items' ? (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {(item as ItemInBox).ItemNo}
                            </td>
                            <td className="px-4 py-3 text-sm text-white">
                              {(item as ItemInBox).ItemName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {getItemTypeLabel((item as ItemInBox).ItemType)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {(item as ProductInBox).ProductID}
                            </td>
                            <td className="px-4 py-3 text-sm text-white">
                              {(item as ProductInBox).ProductName}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-400">
                              {(item as ProductInBox).Period} dias
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-sm text-right text-gray-400">
                          {item.Percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-600">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BoxContentsModal;
