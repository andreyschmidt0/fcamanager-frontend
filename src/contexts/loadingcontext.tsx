'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import LoadingSpinner from '../components/loading/loading';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  showLoading: (text?: string) => void;
  hideLoading: () => void;
  isNavigationLoading: boolean;
  setNavigationLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Carregando...');
  const [isNavigationLoading, setIsNavigationLoading] = useState(false);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const showLoading = (text: string = 'Carregando...') => {
    setLoadingText(text);
    setIsLoading(true);
    setIsNavigationLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setIsNavigationLoading(false);
  };

  const setNavigationLoading = (loading: boolean) => {
    setIsNavigationLoading(loading);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        setLoading,
        showLoading,
        hideLoading,
        isNavigationLoading,
        setNavigationLoading,
      }}
    >
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          <LoadingSpinner 
            size="lg" 
            text={loadingText} 
            fullScreen={true}
          />
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading deve ser usado dentro de um LoadingProvider');
  }
  return context;
};