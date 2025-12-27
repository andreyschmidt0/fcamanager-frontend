import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import toast from 'react-hot-toast';

interface EditRejectedGachaponBoxProps {
  isOpen: boolean;
  onClose: () => void;
  request: any; // Solicitação rejeitada
  onSuccess: () => void;
}

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

const EditRejectedGachaponBox: React.FC<EditRejectedGachaponBoxProps> = ({
  isOpen,
  onClose,
  request,
  onSuccess
}) => {
  const [configuredItems, setConfiguredItems] = useState<GachaponConfigItem[]>([]);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boxType = request?.tipo_caixa || 'item';

  // Carregar configuração da solicitação rejeitada
  useEffect(() => {
    console.log('EditRejectedGachaponBox useEffect', { isOpen, request });
    if (isOpen && request) {
      try {
        const config = JSON.parse(request.config_json);
        console.log('Config carregado:', config);
        if (config && config.items) {
          setConfiguredItems(config.items.map((item: any) => ({
            itemNo: item.itemNo,
            productID: item.productID,
            name: item.name,
            percentage: item.percentage,
            percentageDisplay: item.percentageDisplay || (item.percentage / 100),
            period: item.period,
            consumeType: item.consumeType,
            broadcast: item.broadcast
          })));
        }
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
        toast.error('Erro ao carregar configuração da solicitação');
      }
    }
  }, [isOpen, request]);

  if (!isOpen) {
    console.log('Modal não aberto - isOpen:', isOpen);
    return null;
  }

  console.log('Modal renderizando com request:', request);

  // Calcular total de percentages
  const totalPercentage = useMemo(() => {
    return configuredItems.reduce((sum, item) => sum + item.percentage, 0);
  }, [configuredItems]);

  const totalPercentageDisplay = useMemo(() => {
    return (totalPercentage / 100).toFixed(2);
  }, [totalPercentage]);

  const isValidConfig = useMemo(() => {
    return totalPercentage === 10000 && configuredItems.length > 0;
  }, [totalPercentage, configuredItems]);

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

      if (result.success) {
        setSearchResults(result.data || []);
        setHasSearched(true);
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

  // Adicionar item à configuração
  const handleAddItem = (item: any) => {
    const newItem: GachaponConfigItem = {
      itemNo: boxType === 'item' ? item.ItemNo : undefined,
      productID: boxType === 'produto' ? item.ProductID : undefined,
      name: boxType === 'item' ? item.Name : item.ProductName,
      percentage: 0,
      percentageDisplay: 0,
      period: boxType === 'item' ? 999 : (item.Period00 || 999),
      consumeType: boxType === 'item' ? 1 : (item.ConsumeType00 || 1),
      broadcast: false
    };

    setConfiguredItems(prev => [...prev, newItem]);
    setIsSearchModalOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Atualizar percentage de um item
  const handlePercentageChange = (index: number, value: string) => {
    const percentageValue = parseFloat(value) || 0;
    const percentageInt = Math.round(percentageValue * 100);

    setConfiguredItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        percentageDisplay: percentageValue,
        percentage: percentageInt
      };
      return updated;
    });
  };

  // Atualizar period
  const handlePeriodChange = (index: number, value: string) => {
    const period = parseInt(value) || 999;
    setConfiguredItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], period };
      return updated;
    })
  };

  // Toggle broadcast
  const handleBroadcastToggle = (index: number) => {
    setConfiguredItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], broadcast: !updated[index].broadcast };
      return updated;
    });
  };

  // Remover item
  const handleRemoveItem = (index: number) => {
    setConfiguredItems(prev => prev.filter((_, i) => i !== index));
  };

  // Reenviar solicitação
  const handleResubmit = async () => {
    if (!isValidConfig) {
      toast.error('Configuração inválida. A soma deve ser exatamente 100%');
      return;
    }

    setIsSubmitting(true);

    try {
      const config = {
        items: configuredItems,
        totalPercentage,
        itemCount: configuredItems.length
      };

      const result = await apiService.resubmitGachaponRequest(request.id, config);

      if (result.success) {
        toast.success('Solicitação reenviada com sucesso!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Erro ao reenviar solicitação');
      }
    } catch (err) {
      console.error('Erro ao reenviar:', err);
      toast.error('Erro ao reenviar solicitação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="EDITAR SOLICITAÇÃO REJEITADA">
      <div className="space-y-4">
        {/* Info da caixa */}
        <div className="bg-[#1d1e24] p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Tipo:</span>
              <span className="ml-2 text-white font-medium">{boxType === 'item' ? 'Item' : 'Produto'}</span>
            </div>
            <div>
              <span className="text-gray-400">GachaponItemNo:</span>
              <span className="ml-2 text-white font-medium">{request?.gachapon_itemno}</span>
            </div>
            {request?.gachapon_name && (
              <div className="col-span-2">
                <span className="text-gray-400">Nome:</span>
                <span className="ml-2 text-white font-medium">{request.gachapon_name}</span>
              </div>
            )}
            {request?.motivo_rejeicao && (
              <div className="col-span-2 border-t border-gray-700 pt-3 mt-2">
                <span className="text-red-400 font-medium">Motivo da Rejeição:</span>
                <p className="text-white mt-1">{request.motivo_rejeicao}</p>
              </div>
            )}
          </div>
        </div>

        {/* Total e validação */}
        <div className="bg-[#1d1e24] p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total de Percentages:</span>
            <span className={`text-xl font-bold ${totalPercentage === 10000 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPercentageDisplay}%
            </span>
          </div>
          {totalPercentage !== 10000 && (
            <p className="text-xs text-red-400 mt-2">
              Ajuste as percentagens para somar exatamente 100%
            </p>
          )}
        </div>

        {/* Botão adicionar */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Adicionar {boxType === 'item' ? 'Item' : 'Produto'}
        </button>

        {/* Lista de itens configurados */}
        <div className="border border-gray-700 rounded-lg bg-[#1d1e24]">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-medium text-white">Itens Configurados ({configuredItems.length})</h3>
          </div>
          <div className="max-h-96 h-60 overflow-y-auto custom-scrollbar">
            {configuredItems.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhum item configurado
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#16171b] sticky top-0">
                    <th className="px-3 py-2 text-left">Nome</th>
                    <th className="px-3 py-2 text-center w-32">% (0-100)</th>
                    <th className="px-3 py-2 text-center w-28">Período</th>
                    <th className="px-3 py-2 text-center w-24">Broadcast</th>
                    <th className="px-3 py-2 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {configuredItems.map((item, index) => (
                    <tr key={index} className="border-t border-gray-800 hover:bg-gray-800">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={item.percentageDisplay}
                          onChange={(e) => handlePercentageChange(index, e.target.value)}
                          className="w-full bg-[#111216] border border-gray-600 rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.period}
                          onChange={(e) => handlePeriodChange(index, e.target.value)}
                          className="w-full bg-[#111216] border border-gray-600 rounded px-2 py-1 text-center"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.broadcast}
                          onChange={() => handleBroadcastToggle(index)}
                          className="form-checkbox h-4 w-4"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Botão reenviar */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleResubmit}
            disabled={!isValidConfig || isSubmitting}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Reenviando...' : 'Reenviar para Aprovação'}
          </button>
        </div>
      </div>

      {/* Modal de busca */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60]">
          <div className="bg-[#111216] border border-black rounded-lg shadow-xl text-white w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-800">
              <h3 className="text-lg font-medium">Buscar {boxType === 'item' ? 'Item' : 'Produto'}</h3>
              <button onClick={() => {
                setIsSearchModalOpen(false);
                setSearchTerm('');
                setSearchResults([]);
                setHasSearched(false);
              }}>
                <X size={24} />
              </button>
            </div>

            <div className="p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Digite o nome ou código..."
                  className="flex-1 bg-[#1d1e24] border border-gray-700 rounded-lg px-3 py-2"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:bg-gray-500"
                >
                  <Search size={20} />
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {hasSearched && searchResults.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Nenhum resultado encontrado</p>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((item, index) => (
                    <div
                      key={index}
                      className="bg-[#1d1e24] p-3 rounded-lg flex justify-between items-center hover:bg-gray-800 cursor-pointer"
                      onClick={() => handleAddItem(item)}
                    >
                      <div>
                        <p className="font-medium">{boxType === 'item' ? item.Name : item.ProductName}</p>
                        <p className="text-sm text-gray-400">
                          {boxType === 'item' ? `ItemNo: ${item.ItemNo}` : `ProductID: ${item.ProductID}`}
                        </p>
                      </div>
                      <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
                        Adicionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default EditRejectedGachaponBox;
