import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import SuccessModal from '../components/modal/success/SuccessModal';
import SuccessModalManager from '../utils/SuccessModalManager';

interface SuccessModalContextType {
  showSuccess: (title?: string, message?: string) => void;
  hideSuccess: () => void;
}

const SuccessModalContext = createContext<SuccessModalContextType | undefined>(undefined);

interface SuccessModalProviderProps {
  children: ReactNode;
}

export const SuccessModalProvider: React.FC<SuccessModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState<string>('Ação Concluída');
  const [message, setMessage] = useState<string>('Operação executada com sucesso!');

  const showSuccess = (modalTitle?: string, modalMessage?: string) => {
    setTitle(modalTitle || 'Ação Concluída');
    setMessage(modalMessage || 'Operação executada com sucesso!');
    setIsOpen(true);
  };

  const hideSuccess = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const successManager = SuccessModalManager.getInstance();
    successManager.setShowSuccessCallback(showSuccess);
  }, []);

  return (
    <SuccessModalContext.Provider value={{ showSuccess, hideSuccess }}>
      {children}
      <SuccessModal
        isOpen={isOpen}
        onClose={hideSuccess}
        title={title}
        message={message}
      />
    </SuccessModalContext.Provider>
  );
};

export const useSuccessModal = (): SuccessModalContextType => {
  const context = useContext(SuccessModalContext);
  if (!context) {
    throw new Error('useSuccessModal deve ser usado dentro de um SuccessModalProvider');
  }
  return context;
};