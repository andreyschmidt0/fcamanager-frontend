import React, { useState, useEffect } from 'react';
import { X, Filter, Package } from 'lucide-react';

interface InboxItem {
  OrderNo: number;
  InventorySeqno: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

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

  // Aplicar filtros quando dados ou filtros mudarem
  useEffect(() => {
    let filtered = inboxData;

    // Filtrar por tipo de presente/comprado
    if (giftTypeFilter !== '') {
      filtered = filtered.filter(item => item.GiftType === giftTypeFilter);
    }

    // Filtrar por nome do produto
    if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
      filtered = filtered.filter(item =>
        item.ProductName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.SendNickname.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    setFilteredData(filtered);
  }, [inboxData, giftTypeFilter, debouncedSearchTerm]);

  // Resetar filtros quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setGiftTypeFilter('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
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
                    key={`${item.InventorySeqno}-${index}`}
                    className={`bg-[#1d1e24] rounded-lg p-4 border-l-4 ${
                      item.GiftType === 'Presente' ? 'border-l-purple-500' : 'border-l-blue-500'
                    } hover:bg-[#252631] transition-colors`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-sm">
                      {/* Product Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-2">
                          <Package size={20} className={item.GiftType === 'Presente' ? 'text-purple-400' : 'text-blue-400'} />
                          <div className="flex-1">
                            <p className="text-white font-medium text-base leading-tight">{item.ProductName}</p>
                            <p className="text-xs text-gray-500">ProductID: {item.ProductID}</p>
                            <div className="mt-1">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
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

                      {/* Price & Period */}
                      <div className="lg:col-span-2 flex gap-4 lg:block">
                        <div className="flex-1">
                          <span className="text-xs text-gray-400">Preço:</span>
                          <p className="text-green-400 font-semibold">{(item.Price ?? 0).toLocaleString('pt-BR')} GP</p>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-400">Período:</span>
                          <p className="text-white font-medium">{item.Period00 ?? 0} dias</p>
                        </div>
                      </div>

                      {/* Sender */}
                      <div className="lg:col-span-2">
                        <span className="text-xs text-gray-400">Remetente:</span>
                        <p className="text-yellow-400 font-medium">{item.SendNickname}</p>
                      </div>

                      {/* Dates */}
                      <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-xs text-gray-400 block">Recebido:</span>
                          <p className="text-white text-xs font-mono">
                            {formatDate(item.RecvDate)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Usado:</span>
                          <p className="text-white text-xs font-mono">
                            {item.UseDate ? formatDate(item.UseDate) : 'Não usado'}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-400 block">Expira:</span>
                          <p className="text-white text-xs font-mono">
                            {formatDate(item.EndDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Message se existir */}
                    {item.Message && item.Message !== '.' && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <span className="text-xs text-gray-400">Mensagem:</span>
                        <p className="text-white text-sm italic mt-1">{item.Message}</p>
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
    </div>
  );
};

export default ConsultInboxResult;
