import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';

interface CreateGachaponBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

type BoxType = 'item' | 'produto';

interface GachaponConfigItem {
  itemNo?: number;
  productID?: number;
  name: string;
  percentage: number;
  percentageDisplay: number;
  period: number;
  consumeType: number;
  broadcast: boolean;
}

const CreateGachaponBox: React.FC<CreateGachaponBoxProps> = ({ isOpen, onClose }) => {
  const [boxType, setBoxType] = useState<BoxType>('item');
  const [gachaponItemNo, setGachaponItemNo] = useState('');
  const [gachaponName, setGachaponName] = useState('');
  const [configuredItems, setConfiguredItems] = useState<GachaponConfigItem[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Calcular total de percentages
  const totalPercentage = useMemo(() => {
    return configuredItems.reduce((sum, item) => sum + item.percentage, 0);
  }, [configuredItems]);

  const totalPercentageDisplay = useMemo(() => {
    return (totalPercentage / 100).toFixed(2);
  }, [totalPercentage]);

  const isValidConfig = useMemo(() => {
    return totalPercentage === 10000 && configuredItems.length > 0 && gachaponItemNo.trim() !== '';
  }, [totalPercentage, configuredItems, gachaponItemNo]);

  // Carregar configuração existente
  const handleLoadExistingConfig = async () => {
    if (!gachaponItemNo.trim()) {
      setError('Informe o GachaponItemNo da caixa');
      return;
    }

    try {
      const result = await apiService.getGachaponBoxConfig(parseInt(gachaponItemNo), boxType);

      if (result.success && result.data && result.data.length > 0) {
        const loadedItems: GachaponConfigItem[] = result.data.map((item: any) => ({
          itemNo: boxType === 'item' ? item.ItemNo : undefined,
          productID: boxType === 'produto' ? item.ProductID : undefined,
          name: boxType === 'item' ? item.ItemName : item.ProductName,
          percentage: item.Percentage,
          percentageDisplay: item.Percentage / 100,
          period: item.Period,
          consumeType: item.ConsumeType,
          broadcast: item.Broadcast === 1
        }));

        setConfiguredItems(loadedItems);
        setGachaponName(result.data[0].BoxName || '');
        setError('');
      } else {
        setError('Caixa não encontrada ou vazia');
      }
    } catch (err) {
      setError('Erro ao carregar configuração');
      console.error(err);
    }
  };

  // Buscar itens/produtos
  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setError('Digite no mínimo 2 caracteres');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const result = boxType === 'item'
        ? await apiService.searchGachaponItems(searchTerm)
        : await apiService.searchGachaponProducts(searchTerm);

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
      setHasSearched(true);
    }
  };

  // Adicionar item à configuração
  const handleAddItem = (item: any) => {
    const newItem: GachaponConfigItem = {
      itemNo: boxType === 'item' ? item.ItemNo : undefined,
      productID: boxType === 'produto' ? item.ProductID : undefined,
      name: boxType === 'item' ? item.Name : item.ProductName,
      percentage: 0,
      percentageDisplay: 0,
      period: boxType === 'item' ? (item.DefaultPeriod || 999) : item.Period,
      consumeType: item.ConsumeType,
      broadcast: false
    };

    setConfiguredItems([...configuredItems, newItem]);
    setIsSearchModalOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Remover item da configuração
  const handleRemoveItem = (index: number) => {
    setConfiguredItems(configuredItems.filter((_, i) => i !== index));
  };

  // Atualizar percentage de um item
  const handleUpdatePercentage = (index: number, percentageDisplay: number) => {
    const percentage = Math.round(percentageDisplay * 100);
    const updatedItems = [...configuredItems];
    updatedItems[index].percentage = percentage;
    updatedItems[index].percentageDisplay = percentageDisplay;
    setConfiguredItems(updatedItems);
  };

  // Atualizar period de um item
  const handleUpdatePeriod = (index: number, period: number) => {
    const updatedItems = [...configuredItems];
    updatedItems[index].period = period;
    setConfiguredItems(updatedItems);
  };

  // Toggle broadcast
  const handleToggleBroadcast = (index: number) => {
    const updatedItems = [...configuredItems];
    updatedItems[index].broadcast = !updatedItems[index].broadcast;
    setConfiguredItems(updatedItems);
  };

  // Submeter solicitação
  const handleSubmit = async () => {
    if (!isValidConfig) {
      setError('Configuração inválida. Verifique se a soma é 100% e todos os campos estão preenchidos.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await apiService.createGachaponRequest({
        tipoCaixa: boxType,
        gachaponItemNo: parseInt(gachaponItemNo),
        gachaponName: gachaponName || `Caixa ${gachaponItemNo}`,
        config: {
          items: configuredItems,
          totalPercentage: totalPercentage,
          itemCount: configuredItems.length
        }
      });

      if (result.success) {
        handleClose();
      } else {
        setError(result.error || 'Erro ao criar solicitação');
      }
    } catch (err) {
      setError('Erro ao criar solicitação');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setBoxType('item');
    setGachaponItemNo('');
    setGachaponName('');
    setConfiguredItems([]);
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    onClose();
  };

  return (
    <>
      <BaseModal isOpen={isOpen} onClose={handleClose} title="CRIAR/EDITAR CAIXA DE GACHAPON" maxWidth="2xl">
        <div className="space-y-6">
          {/* Tipo de Caixa e GachaponItemNo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Tipo de Caixa</label>
              <select
                value={boxType}
                onChange={(e) => setBoxType(e.target.value as BoxType)}
                className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none"
              >
                <option value="item">Caixa de Itens</option>
                <option value="produto">Caixa de Produtos</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">GachaponItemNo</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={gachaponItemNo}
                  onChange={(e) => setGachaponItemNo(e.target.value)}
                  placeholder="Ex: 90000001"
                  className="flex-1 px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={handleLoadExistingConfig}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Carregar
                </button>
              </div>
            </div>
          </div>

          {/* Nome da Caixa */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Nome da Caixa (Opcional)</label>
            <input
              type="text"
              value={gachaponName}
              onChange={(e) => setGachaponName(e.target.value)}
              placeholder="Nome descritivo da caixa"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none"
            />
          </div>

          {/* Botão Adicionar Item */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus size={20} />
            Adicionar {boxType === 'item' ? 'Item' : 'Produto'}
          </button>

          {/* Lista de Itens Configurados */}
          {configuredItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Itens Configurados ({configuredItems.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {configuredItems.map((item, index) => (
                  <div key={index} className="bg-[#1d1e24] p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white font-medium">{item.name}</p>
                        <p className="text-sm text-gray-400">
                          {boxType === 'item' ? `ItemNo: ${item.itemNo}` : `ProductID: ${item.productID}`}
                          {' | '}ConsumeType: {item.consumeType}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(index)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Percentage (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.percentageDisplay}
                          onChange={(e) => handleUpdatePercentage(index, parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-[#111216] text-white rounded text-sm focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Period (dias)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.period}
                          onChange={(e) => handleUpdatePeriod(index, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-[#111216] text-white rounded text-sm focus:border-green-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.broadcast}
                            onChange={() => handleToggleBroadcast(index)}
                            className="w-4 h-4"
                          />
                          Broadcast
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Percentage */}
              <div className={`p-4 rounded-lg ${totalPercentage === 10000 ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'}`}>
                <p className={`text-lg font-semibold ${totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}`}>
                  Total: {totalPercentageDisplay}% ({totalPercentage} pontos)
                </p>
                {totalPercentage !== 10000 && (
                  <p className="text-sm text-red-400 mt-1">
                    A soma deve ser exatamente 100% (10.000 pontos)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValidConfig || isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Enviando...' : 'Criar Solicitação'}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar">
            <div className="sticky top-0 bg-[#111216] z-10 flex items-center justify-between p-6 border-b border-gray-600">
              <h3 className="text-2xl font-bold text-white">
                Buscar {boxType === 'item' ? 'Item' : 'Produto'}
              </h3>
              <button
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setSearchTerm('');
                  setSearchResults([]);
                  setHasSearched(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Nome ou ${boxType === 'item' ? 'ItemNo' : 'ProductID'}`}
                  className="flex-1 px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Search size={20} />
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-[#1d1e24] p-3 rounded-lg flex items-center justify-between hover:bg-[#252631] transition-colors"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {boxType === 'item' ? result.Name : result.ProductName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {boxType === 'item' ? `ItemNo: ${result.ItemNo}` : `ProductID: ${result.ProductID}`}
                          {' | '}ConsumeType: {result.ConsumeType}
                          {' | '}Period: {boxType === 'item' ? result.DefaultPeriod : result.Period}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddItem(result)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Mensagem quando não há resultados */}
              {hasSearched && searchResults.length === 0 && !isSearching && (
                <div className="rounded-lg p-4 text-center">
                  <p className="text-white font-medium mb-1">Nenhum resultado encontrado</p>
                  <p className="text-sm text-gray-400">
                    Tente buscar por outro termo ou verifique se digitou corretamente
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateGachaponBox;
