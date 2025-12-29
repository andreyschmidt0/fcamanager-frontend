import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BoxContentsModal from './consultboxes/BoxContentsModal';
import DataTable from '../common/DataTable';
import TableFilter from '../common/TableFilter';

interface ConsultBoxesProps {
  isOpen: boolean;
  onClose: () => void;
}

type BoxType = 'items' | 'products';

interface BoxData {
  BoxName: string;
  GachaponItemNo: number;
}

const ConsultBoxes: React.FC<ConsultBoxesProps> = ({ isOpen, onClose }) => {
  const [boxType, setBoxType] = useState<BoxType>('items');
  const [boxes, setBoxes] = useState<BoxData[]>([]);
  const [isLoadingBoxes, setIsLoadingBoxes] = useState(false);
  const [selectedBox, setSelectedBox] = useState<BoxData | null>(null);
  const [showContentsModal, setShowContentsModal] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Valores digitados pelo usuário (sem delay)
  const [inputBoxName, setInputBoxName] = useState('');
  const [inputGachaponItemNo, setInputGachaponItemNo] = useState('');

  // Valores com debounce que disparam a busca
  const [filterBoxName, setFilterBoxName] = useState('');
  const [filterGachaponItemNo, setFilterGachaponItemNo] = useState('');

  // Debounce para filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterBoxName(inputBoxName);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputBoxName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterGachaponItemNo(inputGachaponItemNo);
    }, 500);
    return () => clearTimeout(timer);
  }, [inputGachaponItemNo]);

  // Buscar caixas quando filtros mudarem
  useEffect(() => {
    if (isOpen && hasLoaded) {
      handleListBoxes();
    }
  }, [filterBoxName, filterGachaponItemNo]);

  // Resetar ao fechar
  useEffect(() => {
    if (!isOpen) {
      setBoxType('items');
      setBoxes([]);
      setSelectedBox(null);
      setShowContentsModal(false);
      setError('');
      // Limpar inputs
      setInputBoxName('');
      setInputGachaponItemNo('');
      // Limpar filtros
      setFilterBoxName('');
      setFilterGachaponItemNo('');
      setHasLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  const handleContentsModalClose = () => {
    setShowContentsModal(false);
    setSelectedBox(null);
  };

  const handleListBoxes = async () => {
    setIsLoadingBoxes(true);
    setError('');
    setSelectedBox(null);
    setShowContentsModal(false);
    setHasLoaded(true);

    try {
      const filters = {
        boxName: filterBoxName,
        gachaponItemNo: filterGachaponItemNo
      };

      const result = boxType === 'items'
        ? await apiService.getAllItemBoxes(filters)
        : await apiService.getAllProductBoxes(filters);

      if (result.success && result.data) {
        setBoxes(result.data);
      } else {
        setError(result.error || 'Erro ao buscar caixas');
        setBoxes([]);
      }
    } catch (err) {
      setError('Erro ao buscar caixas');
      setBoxes([]);
      console.error(err);
    } finally {
      setIsLoadingBoxes(false);
    }
  };

  const handleListContents = (box: BoxData) => {
    setSelectedBox(box);
    setShowContentsModal(true);
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

          {/* Filtros - sempre visíveis após listar */}
          {hasLoaded && (
            <TableFilter
              filters={[
                {
                  key: 'boxName',
                  label: 'Filtrar por Nome',
                  placeholder: 'Digite o nome da caixa...',
                  value: inputBoxName,
                  onChange: setInputBoxName
                },
                {
                  key: 'gachaponItemNo',
                  label: 'Filtrar por Item No',
                  placeholder: 'Digite o Item No...',
                  value: inputGachaponItemNo,
                  onChange: setInputGachaponItemNo
                }
              ]}
              columnsPerRow={2}
            />
          )}

          {/* Tabela de Caixas */}
          {boxes.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'BoxName',
                  header: 'Nome da Caixa',
                  className: 'px-4 py-3 text-sm text-white'
                },
                {
                  key: 'GachaponItemNo',
                  header: 'Item No',
                  className: 'px-4 py-3 text-sm text-gray-400'
                },
                {
                  key: 'actions',
                  header: 'Ações',
                  headerClassName: 'px-4 py-3 text-right text-sm font-semibold text-gray-300 border-b border-gray-700',
                  render: (box: BoxData) => (
                    <div className="text-right">
                      <button
                        onClick={() => handleListContents(box)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                      >
                        {boxType === 'items' ? 'Listar Itens' : 'Listar Produtos'}
                      </button>
                    </div>
                  ),
                  className: 'px-4 py-3'
                }
              ]}
              data={boxes}
              totalCount={boxes.length}
              maxHeight="60vh"
            />
          ) : hasLoaded && !isLoadingBoxes ? (
            <div className="bg-[#1d1e24] rounded-lg p-8 text-center">
              <p className="text-gray-400 text-lg">Nenhuma caixa encontrada</p>
            </div>
          ) : null}
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
      />
    </div>
  );
};

export default ConsultBoxes;
