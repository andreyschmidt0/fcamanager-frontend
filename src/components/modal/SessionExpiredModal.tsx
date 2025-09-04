import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onRelogin: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ isOpen, onRelogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-md border border-red-600">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b border-red-600">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-bold text-white">
            Sessão Expirada
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-300 mb-6 text-center">
            Sua sessão expirou por motivos de segurança.
            <br />
            Por favor, faça login novamente para continuar.
          </p>

          {/* Button */}
          <div className="flex justify-center">
            <button
              onClick={onRelogin}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              Logar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;