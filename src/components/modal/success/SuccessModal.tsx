import React from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = 'Ação Concluída',
  message = 'Operação executada com sucesso!'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="relative flex items-center h-16 border-b border-gray-600 px-6">
          <Check className="text-green-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white font-neofara tracking-wider">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white text-md mb-6">
            {message}
          </p>

          {/* Button */}
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg transition-colors font-medium"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;