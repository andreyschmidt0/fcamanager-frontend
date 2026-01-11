import React, { useState, useEffect } from 'react';
import { X, Filter, Power, Package, Loader2, Calendar } from 'lucide-react';
import apiService from '../../../services/api-tauri.service';
import toast from 'react-hot-toast';

interface InboxItem {
  OrderNo: number;
  InventorySeqno: number;
  UserStoreSeqNo: number;
  ProductID: number;
  ProductName: string;
  Price: number;
  Period00: number;
  RecvDate: string;
  EndDate: string;
  UseDate: string;
  SendNickname: string;
  Message: string;
  GiftType: string;
  Status: number; // 0 = Inativo/Expirado, 1 = Ativo
}

interface ConsultInboxResultProps {
  isOpen: boolean;
  onClose: () => void;
  inboxData: InboxItem[];
  playerName: string;
  targetOidUser?: number | null;
}

const ConsultInboxResult: React.FC<ConsultInboxResultProps> = ({
  isOpen,
  onClose,
  inboxData,
  playerName,
  targetOidUser
}) => {
  const [filteredData, setFilteredData] = useState<InboxItem[]>(inboxData);
  const [giftTypeFilter, setGiftTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());

  // Estado para o modal de data
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [manualDate, setManualDate] = useState('');

  // Função para formatar data no formato dd/mm/yy hh:mm:ss
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear()).slice(-2);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Debounce para o termo de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = inboxData;

    if (giftTypeFilter !== '') {
      filtered = filtered.filter(item => item.GiftType === giftTypeFilter);
    }

    if (statusFilter !== '') {
      const statusValue = parseInt(statusFilter);
      filtered = filtered.filter(item => item.Status === statusValue);
    }

    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      filtered = filtered.filter(item =>
        item.ProductName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.SendNickname.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [inboxData, giftTypeFilter, statusFilter, debouncedSearchTerm]);

  // Resetar filtros quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setGiftTypeFilter('');
      setStatusFilter('');
    }
  }, [isOpen]);

  const handleToggleClick = (item: InboxItem) => {
    if (item.Status === 1) {
      // Se está ativo, inativar direto (padrão)
      handleItemStatusChange(item, 'I');
    } else {
      // Se está inativo, abrir modal para escolher tipo de ativação
      setSelectedItem(item);
      setManualDate('');
      setShowDateModal(true);
    }
  };

  const handleItemStatusChange = async (item: InboxItem, action: string, newDate?: string) => {
    if (!targetOidUser) {
      toast.error('Erro: targetOidUser não disponível');
      return;
    }

    const userStoreSeqNo = item.UserStoreSeqNo || item.InventorySeqno; // Fallback se UserStoreSeqNo vier null
    
    setLoadingItems(prev => new Set(Array.from(prev).concat(userStoreSeqNo)));
    
    try {
      const payload: any = {
        targetOidUser,
        userStoreSeqNo,
        action
      };

      if (action === 'A' && newDate) {
        payload.newExpireDate = newDate;
      }

      const result = await apiService.setUserStoreItemStatus(payload);

      if (result.success) {
        // Atualizar estado local
        const newStatus = action === 'A' ? 1 : 0;
        
        setFilteredData(prev => prev.map(prevItem => 
          (prevItem.UserStoreSeqNo === userStoreSeqNo || prevItem.InventorySeqno === userStoreSeqNo)
            ? { ...prevItem, Status: newStatus }
            : prevItem
        ));

        // Atualizar dados originais
        const originalItem = inboxData.find(i => i.UserStoreSeqNo === userStoreSeqNo || i.InventorySeqno === userStoreSeqNo);
        if (originalItem) {
          originalItem.Status = newStatus;
        }

        toast.success(`Item ${action === 'A' ? 'ativado' : 'desativado'} com sucesso!`);
        setShowDateModal(false);
      } else {
        toast.error(result.error || 'Erro ao alterar status do item');
      }
    } catch (error) {
      console.error('Erro ao alterar status do item:', error);
      toast.error('Erro ao alterar status do item');
    } finally {
      setLoadingItems(prev => {
        const newArray = Array.from(prev).filter(id => id !== userStoreSeqNo);
        return new Set(newArray);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            INBOX - {playerName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Filtros */}
          <div className="mb-6 p-3 bg-[#1d1e24] rounded-lg border border-gray-600 flex-shrink-0">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">
                  Filtros de Busca
                </h3>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Status:
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm min-w-[100px]"
                >
                  <option value="">Todos</option>
                  <option value="0">Inativos</option>
                  <option value="1">Ativos</option>
                </select>
              </div>

              {/* Tipo Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Tipo:
                </label>
                <select
                  value={giftTypeFilter}
                  onChange={(e) => setGiftTypeFilter(e.target.value)}
                  className="px-2 py-1 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm min-w-[120px]"
                >
                  <option value="">Todos</option>
                  <option value="Presente">Presente</option>
                  <option value="Comprado">Comprado</option>
                </select>
              </div>

              {/* Search Filter */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <label className="text-sm font-medium text-gray-400 whitespace-nowrap">
                  Buscar:
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome do produto ou remetente"
                  className="flex-1 px-2 py-1 bg-[#2a2b32] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {filteredData.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold mb-3">
                  {inboxData.length === 0 ? 'Nenhum item encontrado' : 'Nenhum item corresponde aos filtros'}
                </h3>
                <p className="text-lg">
                  {inboxData.length === 0
                    ? 'A inbox está vazia.'
                    : 'Tente ajustar os filtros para ver mais resultados.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                {filteredData.map((item, index) => (
                  <div
                    key={`${item.UserStoreSeqNo || item.InventorySeqno}-${index}`}
                    className={`bg-[#1d1e24] rounded-lg p-3 border-l-4 ${
                      item.Status === 1 
                        ? (item.GiftType === 'Presente' ? 'border-l-purple-500' : 'border-l-green-500')
                        : 'border-l-red-500'
                    } hover:bg-[#252631] transition-colors`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 text-sm items-center">
                      {/* Product Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <p className="text-white font-medium text-base leading-tight truncate" title={item.ProductName}>{item.ProductName}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">ProductID: {item.ProductID}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                item.GiftType === 'Presente'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}>
                                {item.GiftType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="lg:col-span-1 text-center">
                        <p className={`font-medium text-sm ${item.Status === 1 ? 'text-green-400' : 'text-red-400'}`}>
                          {item.Status === 1 ? 'Ativo' : 'Inativo'}
                        </p>
                      </div>

                      {/* Price & Period */}
                      <div className="lg:col-span-2">
                        <div className="flex justify-between lg:block">
                          <div>
                            <span className="text-xs text-gray-400">Preço:</span> <span className="text-green-400 font-semibold">{(item.Price ?? 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400">Período:</span> <span className="text-white">{item.Period00}d</span>
                          </div>
                        </div>
                      </div>

                      {/* Sender */}
                      <div className="lg:col-span-2 truncate">
                        <span className="text-xs text-gray-400">De: </span>
                        <span className="text-yellow-400 font-medium" title={item.SendNickname}>{item.SendNickname}</span>
                      </div>

                      {/* Dates */}
                      <div className="lg:col-span-3 grid grid-cols-1 gap-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Recebido:</span>
                          <span className="text-white text-xs font-mono">{formatDate(item.RecvDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">Expira:</span>
                          <span className="text-white text-xs font-mono">{formatDate(item.EndDate)}</span>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <div className="lg:col-span-1 text-center flex justify-center">
                        <button
                          onClick={() => handleToggleClick(item)}
                          disabled={loadingItems.has(item.UserStoreSeqNo || item.InventorySeqno)}
                          className={`
                            inline-flex items-center justify-center w-12 h-8 rounded-full transition-all duration-200
                            ${item.Status === 1 
                              ? 'bg-green-600 hover:bg-green-700' 
                              : 'bg-red-600 hover:bg-red-700'
                            }
                            ${loadingItems.has(item.UserStoreSeqNo || item.InventorySeqno) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          title={`${item.Status === 1 ? 'Inativar' : 'Ativar'} item`}
                        >
                          {loadingItems.has(item.UserStoreSeqNo || item.InventorySeqno) ? (
                            <Loader2 size={14} className="text-white animate-spin" />
                          ) : (
                            <Power size={14} className="text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Message se existir */}
                    {item.Message && item.Message !== '.' && (
                      <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                        <span className="text-gray-400">Msg: </span>
                        <span className="text-white italic">{item.Message}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer com contagem */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400 flex-shrink-0">
            <div>
              Mostrando {filteredData.length} de {inboxData.length} {inboxData.length === 1 ? 'item' : 'itens'}
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-600 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium text-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Date Selection Modal */}
      {showDateModal && selectedItem && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="relative flex items-center h-16 border-b border-gray-600 bg-[#111216]">
              <h3 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-white font-neofara tracking-wide flex items-center gap-2">
                ATIVAR ITEM
              </h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="absolute right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-gray-300 text-sm">
                  Como deseja ativar o item <strong className="text-white block mt-1 text-lg">{selectedItem.ProductName}</strong>?
                </p>
              </div>

              <div className="space-y-4">
                {/* Option 1: Restore */}
                <button
                  onClick={() => handleItemStatusChange(selectedItem, 'A')}
                  className="w-full group bg-[#1d1e24] hover:bg-[#252631] border border-gray-600 hover:border-gray-500 rounded-lg p-4 transition-all duration-200 text-left"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-white group-hover:text-green-400 transition-colors">Restaurar do Log</span>
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase tracking-wider font-bold">Recomendado</span>
                  </div>
                  <p className="text-xs text-gray-400">Restaura a data de expiração original salva no histórico.</p>
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-700"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-[#111216] text-xs text-gray-500 uppercase tracking-widest font-medium">OU</span>
                  </div>
                </div>

                {/* Option 2: Manual Date */}
                <div className="bg-[#1d1e24] p-4 rounded-lg border border-gray-600">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Definir Nova Data de Expiração
                  </label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      placeholder="dd-mm-yyyy"
                      className="w-full bg-[#111216] border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-mono text-sm"
                    />
                    <button
                      onClick={() => {
                        if (!manualDate.match(/^\d{2}-\d{2}-\d{4}$/)) {
                          toast.error('Formato de data inválido. Use dd-mm-yyyy');
                          return;
                        }
                        handleItemStatusChange(selectedItem, 'A', manualDate);
                      }}
                      disabled={!manualDate}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors text-sm uppercase tracking-wide"
                    >
                      Confirmar Nova Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultInboxResult;