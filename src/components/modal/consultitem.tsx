import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConsultBanHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultBanHistory: React.FC<ConsultBanHistoryProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    itemname: '',
    availableItems: '',
    daysperiod: '',
    selltype: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica será implementada posteriormente
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
          {/* Discord ID */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nome do Item
            </label>
            <input
              type="text"
              name="discordId"
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
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
              Periodo em Dias (ex.999)
            </label>
            <input
              type="text"
              name="loginAccount"
              placeholder='Opcional'
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Consultar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultBanHistory;