import React, { useEffect } from 'react';
import BaseModal from './BaseModal';
import PlayerValidationFields from './PlayerValidationFields';
import ConfirmationModal from '../modal/confirm/confirmmodal';
import { usePlayer } from '../../contexts/PlayerContext';
import { usePlayerValidation } from '../../hooks/usePlayerValidation';
import { useModalAction } from '../../hooks/useModalAction';

interface BaseActionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  confirmTitle: string;
  confirmDescription:
    | string
    | ((args: {
        formData: any;
        validatedPlayer: any | null;
        fetchedPlayerName: string;
        validatedOidUser: number | null;
      }) => string);
  confirmActionText: string;
  cancelActionText?: string;
  action: (data: any) => Promise<any>;
  children?: React.ReactNode;
  onFormDataChange: (data: any) => void;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  customValidation?: () => boolean;
  customValidationMessage?: string;
  playerFieldsConfig?: {
    labels?: { discordId?: string; loginAccount?: string; oidUser?: string };
    placeholders?: { discordId?: string; loginAccount?: string };
    showOidUserField?: boolean;
    required?: boolean;
  };
}

interface ActionFormModalWithPlayerProps extends BaseActionFormModalProps {
  requiresPlayerValidation: true;
  showPlayerFields?: true;
  formData: {
    discordId: string;
    loginAccount: string;
    [key: string]: any;
  };
}

interface ActionFormModalWithoutPlayerProps extends BaseActionFormModalProps {
  requiresPlayerValidation: false;
  showPlayerFields: false;
  formData: Record<string, any>;
}

type ActionFormModalProps = ActionFormModalWithPlayerProps | ActionFormModalWithoutPlayerProps;

const ActionFormModal: React.FC<ActionFormModalProps> = ({
  isOpen,
  onClose,
  title,
  confirmTitle,
  confirmDescription,
  confirmActionText,
  cancelActionText = 'Cancelar',
  action,
  children,
  formData,
  onFormDataChange,
  maxWidth = 'lg',
  requiresPlayerValidation = true,
  customValidation,
  customValidationMessage,
  showPlayerFields = true,
  playerFieldsConfig = {}
}) => {
  const { selectedPlayer } = usePlayer();

  // Player validation hook
  const playerValidation = usePlayerValidation(
    { 
      discordId: formData.discordId || '', 
      loginAccount: formData.loginAccount || '' 
    },
    isOpen,
    {
      autoValidateOnSelectedPlayer: requiresPlayerValidation,
      debounceMs: 500,
      resetOnModalOpen: true
    }
  );

  // Modal action hook
  const modalAction = useModalAction(
    () => action(formData),
    {
      onSuccess: () => onClose(),
      requiresValidation: requiresPlayerValidation || !!customValidation,
      validationCheck: () => {
        if (requiresPlayerValidation && (!playerValidation.playerValidated || !playerValidation.fetchedPlayerName || !playerValidation.validatedOidUser)) {
          return false;
        }
        if (customValidation && !customValidation()) {
          return false;
        }
        return true;
      },
      validationErrorMessage: customValidationMessage || 'Por favor, aguarde a validação do jogador ser concluída.'
    }
  );

  // Sync form data with selected player
  useEffect(() => {
    if (selectedPlayer && isOpen) {
      onFormDataChange({
        ...formData,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      });
    } else if (isOpen && !selectedPlayer) {
      // Clear form when no player is selected
      const clearedData = { ...formData };
      clearedData.discordId = '';
      clearedData.loginAccount = '';
      onFormDataChange(clearedData);
    }
  }, [selectedPlayer, isOpen]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFormDataChange({
      ...formData,
      [name]: value
    });

    // Clear error messages when user types
    if (modalAction.errorMessage) {
      modalAction.setErrorMessage('');
    }
    if (playerValidation.errorMessage) {
      playerValidation.setErrorMessage('');
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      modalAction.resetState();
    }
  }, [isOpen, modalAction.resetState]);

  if (!isOpen) return null;

  const resolvedConfirmDescription =
    typeof confirmDescription === 'function'
      ? confirmDescription({
          formData,
          validatedPlayer: requiresPlayerValidation ? playerValidation.validatedPlayer : null,
          fetchedPlayerName: playerValidation.fetchedPlayerName,
          validatedOidUser: playerValidation.validatedOidUser
        })
      : confirmDescription;

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        maxWidth={maxWidth}
      >
        <form onSubmit={modalAction.handleSubmit} className="space-y-6">
          {showPlayerFields && (
            <PlayerValidationFields
              formData={{ 
                discordId: formData.discordId || '', 
                loginAccount: formData.loginAccount || '' 
              }}
              onInputChange={handleInputChange}
              validation={{
                isValidatingPlayer: playerValidation.isValidatingPlayer,
                playerValidated: playerValidation.playerValidated,
                fetchedPlayerName: playerValidation.fetchedPlayerName,
                validatedOidUser: playerValidation.validatedOidUser,
                errorMessage: playerValidation.errorMessage,
                accountCount: playerValidation.accountCount
              }}
              {...playerFieldsConfig}
            />
          )}

          {children && React.isValidElement(children) && React.cloneElement(children, {
            formData,
            onInputChange: handleInputChange,
            validatedPlayer: requiresPlayerValidation ? playerValidation.validatedPlayer : null
          } as any)}

          {/* Error Message */}
          {modalAction.errorMessage && (
            <div className="p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-sm text-red-400">
                ✗ {modalAction.errorMessage}
              </p>
            </div>
          )}

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
              disabled={requiresPlayerValidation ? !playerValidation.playerValidated : false}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              {confirmActionText}
            </button>
          </div>
        </form>
      </BaseModal>

      <ConfirmationModal
        isOpen={modalAction.showConfirmation}
        onConfirm={modalAction.handleConfirmAction}
        onCancel={modalAction.handleCancelConfirmation}
        title={confirmTitle}
        description={resolvedConfirmDescription}
        confirmActionText={confirmActionText}
        cancelActionText={cancelActionText}
        isLoading={modalAction.isLoading}
      />
    </>
  );
};

export default ActionFormModal;
