import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useClan } from '../../contexts/ClanContext';

interface removeclanProps {
  isOpen: boolean;
  onClose: () => void;
}

const removeclan: React.FC<removeclanProps> = ({ isOpen, onClose }) => {
  const { selectedClan } = useClan();
  const [formData, setFormData] = useState({
    clanid: '',
    oidguild: ''
  });

  useEffect(() => {
    if (selectedClan && isOpen) {
      setFormData(prev => ({
        ...prev,
        clanid: selectedClan.clanid || '',
        oidguild: selectedClan.oidguild || ''
      }));
    }
  }, [selectedClan, isOpen]);

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
    console.log('Clan Data:', formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            REMOVER CLÃ
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
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ID do Clã
            </label>
            <input
              type="text"
              name="clanid"
              value={formData.clanid}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              OID Guild
            </label>
            <input
              type="text"
              name="oidguild"
              value={formData.oidguild}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Remover Clã
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default removeclan;