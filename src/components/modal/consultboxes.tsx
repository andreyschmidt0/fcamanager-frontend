import React, { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BoxContentsModal from './consultboxes/BoxContentsModal';

interface ConsultBoxesProps {
  isOpen: boolean;
  onClose: () => void;
}

type BoxType = 'items' | 'products';

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

const ConsultBoxes: React.FC<ConsultBoxesProps> = ({ isOpen, onClose }) => {
  const [boxType, setBoxType] = useState<BoxType>('items');
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [boxContents, setBoxContents] = useState<(ItemInBox | ProductInBox)[]>([]);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [showContentsModal, setShowContentsModal] = useState(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleClose = () => {
    setBoxType('items');
    setBoxes([]);
    setSelectedBox(null);
    setBoxContents([]);
    setShowContentsModal(false);
    setError('');
    onClose();
  };

  const handleContentsModalClose = () => {
    setShowContentsModal(false);
    setSelectedBox(null);
    setBoxContents([]);
  };

  const handleListBoxes = async () => {
    setIsLoadingBoxes(true);
    setError('');
    setSelectedBox(null);
    setBoxContents([]);
    setShowContentsModal(false);

    try {
      const result = boxType === 'items'
        ? await apiService.getAllItemBoxes()
        : await apiService.getAllProductBoxes();

      if (result.success && result.data) {
        setBoxes(result.data);
      } else {
        setError(result.error || 'Erro ao buscar caixas');
      }
    } catch (err) {
      setError('Erro ao buscar caixas');
      console.error(err);
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  const handleListContents = async (box: BoxData) => {
    setSelectedBox(box);
    setIsLoadingContents(true);
    setShowContentsModal(true);
    setBoxContents([]);
    setError('');

    try {
      const result = boxType === 'items'
        ? await apiService.getItemsInBox(box.GachaponItemNo)
        : await apiService.getProductsInBox(box.GachaponItemNo);

      if (result.success && result.data) {
        setBoxContents(result.data);
      } else {
        setError(result.error || 'Erro ao buscar conteúdo da caixa');
        setShowContentsModal(false);
      }
    } catch (err) {
      setError('Erro ao buscar conteúdo da caixa');
      console.error(err);
      setShowContentsModal(false);
    } finally {
      setIsLoadingContents(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-[#111216] rounded-lg shadow-2xl w-full ${boxes.length > 0 ? 'max-w-4xl' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto transition-all duration-300`}>
        {/* Header */}
        <div className="sticky top-0 bg-[#111216] z-10 relative flex items-center justify-center h-20 border-b border-gray-600">
          <h2 className="text-3xl font-bold text-white font-neofara tracking-wider">
            CONSULTAR CAIXAS
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Seleção de Tipo */}
          <div className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white mb-2">
                  Tipo de Caixa
                </label>
                <div className="relative">
                  <select
                    value={boxType}
                    onChange={(e) => setBoxType(e.target.value as BoxType)}
                    className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  >
                    <option value="items">Caixas de Items</option>
                    <option value="products">Caixas de Produtos</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleListBoxes}
                disabled={isLoadingBoxes}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingBoxes ? 'Carregando...' : 'Listar Caixas'}
              </button>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Tabela de Caixas */}
          {boxes.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {boxType === 'items' ? 'Caixas de Items' : 'Caixas de Produtos'} ({boxes.length})
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-700">
                <table className="w-full">
                  <thead className="bg-[#111216]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Nome da Caixa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Item No
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {boxes.map((box) => (
                      <tr key={box.GachaponItemNo} className="hover:bg-[#1d1e24] transition-colors">
                        <td className="px-4 py-3 text-sm text-white">{box.BoxName}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{box.GachaponItemNo}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleListContents(box)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                          >
                            {boxType === 'items' ? 'Listar Itens' : 'Listar Produtos'}
                          </button>
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
            onClick={handleClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Box Contents Modal */}
      <BoxContentsModal
        isOpen={showContentsModal}
        onClose={handleContentsModalClose}
        selectedBox={selectedBox}
        boxType={boxType}
        boxContents={boxContents}
        isLoading={isLoadingContents}
      />
    </div>
  );
};

export default ConsultBoxes;
