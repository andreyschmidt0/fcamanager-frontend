import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmActionText?: string;
  cancelActionText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  confirmActionText = 'Confirmar',
  cancelActionText = 'Cancelar',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="relative flex items-center h-16 border-b border-gray-600 px-6">
          <AlertTriangle className="text-yellow-500 mr-3" size={24} />
          <h2 className="text-xl font-bold text-white font-neofara tracking-wider">
            {title}
          </h2>
          <button
            onClick={onCancel}
            className="absolute right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {description && (
            <p className="text-white text-md mb-6">
              {description}
            </p>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {cancelActionText}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              {confirmActionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;