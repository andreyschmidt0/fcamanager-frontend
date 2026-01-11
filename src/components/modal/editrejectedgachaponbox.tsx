import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import ItemSearchModal from '../common/ItemSearchModal';
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
  itemNo00?: number;
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const boxType = request?.tipo_caixa;

  // Carregar configuração da solicitação rejeitada
  useEffect(() => {
    if (isOpen && request) {
      try {
        const config = request.config || {};
        if (config && config.items) {
          setConfiguredItems(config.items.map((item: any) => ({
            itemNo: item.itemNo,
            productID: item.productID,
            itemNo00: item.itemNo00,
            name: item.name,
            percentage: item.percentage,
            percentageDisplay: (item.percentage / 100),
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

  if (!isOpen) return null;

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

  // Adicionar item à configuração
  const handleAddItem = (item: any) => {
    const period = boxType === 'produto' ? (item.Period) : (item.DefaultPeriod);

    const newItem: GachaponConfigItem = {
      itemNo: boxType === 'item' ? item.ItemNo : undefined,
      productID: boxType === 'produto' ? item.ProductID : undefined,
      itemNo00: boxType === 'produto' ? item.ItemNo00 : undefined,
      name: boxType === 'item' ? item.Name : item.ProductName,
      percentage: 0,
      percentageDisplay: 0,
      period: period,
      consumeType: boxType === 'item' ? 1 : (item.ConsumeType || 1),
      broadcast: period === 999
    };

    setConfiguredItems(prev => [...prev, newItem]);
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
      <ItemSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleAddItem}
        boxType={boxType}
        searchFunction={(filters) =>
          boxType === 'item'
            ? apiService.searchGachaponItems(filters)
            : apiService.searchGachaponProducts(filters)
        }
      />
    </BaseModal>
  );
};

export default EditRejectedGachaponBox;
