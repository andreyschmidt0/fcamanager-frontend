import React from 'react';
import { AlertTriangle } from 'lucide-react';
import BaseModal from '../common/BaseModal';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onRelogin: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({ isOpen, onRelogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
      <BaseModal
        isOpen={isOpen}
        onClose={() => {}} // Não permite fechar sem relogin
        title="Sessão Expirada"
        maxWidth="md"
        className="border border-red-600"
      >
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="text-red-500" size={24} />
          <div>
            <p className="text-gray-300 text-center">
              Sua sessão expirou por motivos de segurança.
              <br />
              Por favor, faça login novamente para continuar.
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onRelogin}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Logar Novamente
          </button>
        </div>
      </BaseModal>
    </div>
  );
};

export default SessionExpiredModal;