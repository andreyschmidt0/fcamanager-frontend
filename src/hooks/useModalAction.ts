import { useState, useCallback } from 'react';

interface UseModalActionOptions<T = any> {
  onSuccess?: (result: T) => void;
  onError?: (error: string) => void;
  requiresValidation?: boolean;
  validationCheck?: () => boolean;
  validationErrorMessage?: string;
}

interface UseModalActionReturn {
  isLoading: boolean;
  showConfirmation: boolean;
  errorMessage: string;
  handleSubmit: (e: React.FormEvent) => void;
  handleConfirmAction: () => Promise<void>;
  handleCancelConfirmation: () => void;
  setErrorMessage: (message: string) => void;
  resetState: () => void;
}

export const useModalAction = <T = any>(
  actionFn: () => Promise<T>,
  options: UseModalActionOptions<T> = {}
): UseModalActionReturn => {
  const {
    onSuccess,
    onError,
    requiresValidation = false,
    validationCheck,
    validationErrorMessage = 'Validação necessária antes de executar a ação.'
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const resetState = useCallback(() => {
    setIsLoading(false);
    setShowConfirmation(false);
    setErrorMessage('');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (requiresValidation && validationCheck && !validationCheck()) {
      setErrorMessage(validationErrorMessage);
      return;
    }

    setErrorMessage('');
    setShowConfirmation(true);
  }, [requiresValidation, validationCheck, validationErrorMessage]);

  const handleConfirmAction = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Validação dupla se necessário
      if (requiresValidation && validationCheck && !validationCheck()) {
        setErrorMessage(validationErrorMessage);
        setShowConfirmation(false);
        return;
      }

      const result = await actionFn();
      
      setShowConfirmation(false);
      onSuccess?.(result);
    } catch (error) {
      console.error('Erro na ação:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setErrorMessage(errorMsg);
      setShowConfirmation(false);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, actionFn, requiresValidation, validationCheck, validationErrorMessage, onSuccess, onError]);

  const handleCancelConfirmation = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  return {
    isLoading,
    showConfirmation,
    errorMessage,
    handleSubmit,
    handleConfirmAction,
    handleCancelConfirmation,
    setErrorMessage,
    resetState
  };
};