import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import ConsultItemResult from './consultitemresult/ConsultItemResult';

interface ConsultItemProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultItem: React.FC<ConsultItemProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    itemname: '',
    availableItems: '',
    daysperiod: '',
    selltype: '',
    productId: '',
    itemNo: '',
    itemGrade: ''
  });

  // Estados para resultados e loading
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 30,
    total: 0,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Função para realizar busca
  const performSearch = async (page: number = 1) => {
    setIsLoading(true);
    setSearchError('');

    try {
      // Preparar filtros para envio
      const filters: any = {
        page,
        pageSize: 30
      };

      // Adicionar apenas campos preenchidos
      if (formData.itemname && formData.itemname.trim()) {
        filters.itemname = formData.itemname.trim();
      }
      
      if (formData.availableItems) {
        filters.availableItems = parseInt(formData.availableItems);
      }
      
      if (formData.daysperiod) {
        filters.daysperiod = parseInt(formData.daysperiod);
      }
      
      if (formData.selltype) {
        filters.selltype = parseInt(formData.selltype);
      }
      
      if (formData.productId) {
        filters.productId = parseInt(formData.productId);
      }
      
      if (formData.itemNo) {
        filters.itemNo = parseInt(formData.itemNo);
      }
      
      if (formData.itemGrade) {
        filters.itemGrade = parseInt(formData.itemGrade);
      }

      // Fazer chamada API
      const response = await apiService.searchItems(filters);

      if (response.success) {
        setSearchResults(response.data);
        setPagination(response.pagination);
        setShowResults(true);
      } else {
        setSearchError(response.error || 'Erro ao buscar itens');
      }

    } catch (error) {
      console.error('Erro na busca de itens:', error);
      setSearchError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(1);
  };

  // Função para mudança de página
  const handlePageChange = (newPage: number) => {
    performSearch(newPage);
  };

  // Resetar dados quando modal fechar
  const handleClose = () => {
    setShowResults(false);
    setSearchResults([]);
    setPagination({ page: 1, pageSize: 30, total: 0, totalPages: 0 });
    setSearchError('');
    setIsLoading(false);
    onClose();
  };

  // Fechar modal de resultados
  const handleResultsClose = () => {
    setShowResults(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            CONSULTAR ITEM
          </h2>
          <button
            onClick={onClose}
            className="ml-[465px] text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome do Item
            </label>
            <input
              type="text"
              name="itemname"
              value={formData.itemname}
              onChange={handleInputChange}
              placeholder="Digite o nome do item (opcional)"
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Disponivel na Loja (0/1)
            </label>
            <select
              name="availableItems"
              value={formData.availableItems}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="">Selecione uma opção (opcional)</option>
              <option value="0">0 - Não está Disponivel na Loja</option>
              <option value="1">1 - Está Disponivel na Loja</option>
            </select>
          </div>
            
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Período em Dias
            </label>
            <input
              type="number"
              name="daysperiod"
              value={formData.daysperiod}
              placeholder="Ex: 999 (opcional)"
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            />
          </div>

                    <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tipo de Venda (0/1/3)
            </label>
            <select
              name="selltype"
              value={formData.selltype}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="">Selecione uma opção (opcional)</option>
              <option value="0">0 - GP</option>
              <option value="1">1 - Cash</option>
              <option value="3">3 - GP Com PasseVIP</option>   
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Número do Item
            </label>
            <input
              type="number"
              name="itemNo"
              value={formData.itemNo}
              placeholder="Ex: 100003114"
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">Filtrar por número específico do item</p>
          </div>

          {/* Item Grade */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Grau do Item (Estrelas)
            </label>
            <select
              name="itemGrade"
              value={formData.itemGrade}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="">Qualquer grau (opcional)</option>
              <option value="0">0 - Sem Estrela</option>
              <option value="1">1 - Bronze</option>
              <option value="2">2 - Bronze</option>
              <option value="3">3 - Bronze</option>
              <option value="4">4 - Prata</option>
              <option value="5">5 - Prata</option>
              <option value="6">6 - Prata</option>
              <option value="7">7 - Ouro</option>
              <option value="8">8 - Ouro</option>
              <option value="9">9 - Ouro</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Filtrar por quantidade e tipo de estrelas do item</p>
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
              <p className="text-red-400 text-sm">{searchError}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Consultando...
                </span>
              ) : (
                'Consultar Item'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Modal */}
      {showResults && (
        <ConsultItemResult
          isOpen={showResults}
          onClose={handleResultsClose}
          itemsData={searchResults}
          pagination={pagination}
          searchFilters={{
            itemname: formData.itemname || undefined,
            availableItems: formData.availableItems ? parseInt(formData.availableItems) : undefined,
            daysperiod: formData.daysperiod ? parseInt(formData.daysperiod) : undefined,
            selltype: formData.selltype ? parseInt(formData.selltype) : undefined,
            productId: formData.productId ? parseInt(formData.productId) : undefined,
            itemNo: formData.itemNo ? parseInt(formData.itemNo) : undefined,
            itemGrade: formData.itemGrade ? parseInt(formData.itemGrade) : undefined,
          }}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default ConsultItem;