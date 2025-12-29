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
    periodIn: [] as number[],
    selltype: '',
    productId: '',
    productIds: '',
    itemNo: '',
    itemTypes: [] as number[],
    itemGrade: '',
    priceNotEqual99999: false,
    sellBackPriceFilter: ''
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
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePeriodCheckbox = (period: number) => {
    setFormData(prev => ({
      ...prev,
      periodIn: prev.periodIn.includes(period)
        ? prev.periodIn.filter(p => p !== period)
        : [...prev.periodIn, period]
    }));
  };

  const handleItemTypeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.selectedOptions;
    const values: number[] = [];
    for (let i = 0; i < options.length; i++) {
      values.push(parseInt(options[i].value));
    }
    setFormData(prev => ({
      ...prev,
      itemTypes: values
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

      // Filtro de múltiplos períodos
      if (formData.periodIn.length > 0) {
        filters.periodIn = formData.periodIn;
      }

      if (formData.selltype) {
        filters.selltype = parseInt(formData.selltype);
      }

      if (formData.productId) {
        filters.productId = parseInt(formData.productId);
      }

      // Filtro de múltiplos product IDs
      if (formData.productIds && formData.productIds.trim()) {
        const ids = formData.productIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        if (ids.length > 0) {
          filters.productIds = ids;
        }
      }

      if (formData.itemNo) {
        filters.itemNo = parseInt(formData.itemNo);
      }

      // Filtro de múltiplos item types
      if (formData.itemTypes.length > 0) {
        filters.itemTypes = formData.itemTypes;
      }

      if (formData.itemGrade) {
        filters.itemGrade = parseInt(formData.itemGrade);
      }

      // Filtro de preço != 99999
      if (formData.priceNotEqual99999) {
        filters.priceNotEqual99999 = true;
      }

      // Filtro de SellBackPrice
      if (formData.sellBackPriceFilter) {
        filters.sellBackPriceFilter = formData.sellBackPriceFilter;
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

          {/* Múltiplos Períodos */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Filtrar por Períodos Específicos
            </label>
            <div className="flex flex-wrap gap-3 bg-[#1d1e24] p-3 rounded-lg">
              {[1, 7, 30, 90, 999].map(period => (
                <label key={period} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.periodIn.includes(period)}
                    onChange={() => handlePeriodCheckbox(period)}
                    className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
                  />
                  <span className="text-white text-sm">{period === 999 ? 'Permanente' : `${period} dias`}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Marque os períodos desejados (múltipla escolha)</p>
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
              ID do Item
            </label>
            <input
              type="number"
              name="itemNo"
              value={formData.itemNo}
              placeholder="Ex: 17850"
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

          {/* Múltiplos Product IDs */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              IDs de Produtos (Múltiplos)
            </label>
            <textarea
              name="productIds"
              value={formData.productIds}
              onChange={handleInputChange}
              placeholder="Ex: 100001,100002,100003"
              rows={2}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Insira os IDs separados por vírgula</p>
          </div>

          {/* Múltiplos Item Types */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Tipos de Item (Múltiplos)
            </label>
            <select
              multiple
              value={formData.itemTypes.map(String)}
              onChange={handleItemTypeSelect}
              size={6}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="0">AR</option>
              <option value="1">SMG</option>
              <option value="2">Sniper</option>
              <option value="3">Machine Gun</option>
              <option value="4">Pistol</option>
              <option value="5">Double Shotgun</option>
              <option value="6">Grenade</option>
              <option value="7">Knife</option>
              <option value="11">Hat</option>
              <option value="12">Face</option>
              <option value="14">Uniform</option>
              <option value="15">Vest</option>
              <option value="16">Backpack</option>
              <option value="20">Box</option>
              <option value="21">Function Item</option>
              <option value="22">Character</option>
              <option value="26">Shotgun</option>
              <option value="29">Special Items</option>
              <option value="30">Specialist</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Segure Ctrl/Cmd para selecionar múltiplos tipos</p>
          </div>

          {/* Filtro de Preço */}
          <div className="flex items-center gap-3 bg-[#1d1e24] p-3 rounded-lg">
            <input
              type="checkbox"
              name="priceNotEqual99999"
              checked={formData.priceNotEqual99999}
              onChange={handleInputChange}
              className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500"
            />
            <label className="text-white text-sm cursor-pointer">
              Excluir itens com preço 99999
            </label>
          </div>

          {/* Filtro de SellBackPrice */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Preço de Revenda (SellBackPrice)
            </label>
            <select
              name="sellBackPriceFilter"
              value={formData.sellBackPriceFilter}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            >
              <option value="">Todos (com ou sem preço de revenda)</option>
              <option value="null">Apenas itens SEM preço de revenda</option>
              <option value="notnull">Apenas itens COM preço de revenda</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">Filtrar itens por disponibilidade de revenda</p>
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