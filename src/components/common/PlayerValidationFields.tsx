import React from 'react';
import { usePlayer } from '../../contexts/PlayerContext';

interface PlayerValidationFieldsProps {
  formData: {
    discordId: string;
    loginAccount: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validation: {
    isValidatingPlayer: boolean;
    playerValidated: boolean;
    fetchedPlayerName: string;
    validatedOidUser: number | null;
    errorMessage: string;
    accountCount?: number;
  };
  labels?: {
    discordId?: string;
    loginAccount?: string;
    oidUser?: string;
  };
  placeholders?: {
    discordId?: string;
    loginAccount?: string;
  };
  showOidUserField?: boolean;
  required?: boolean;
}

const PlayerValidationFields: React.FC<PlayerValidationFieldsProps> = ({
  formData,
  onInputChange,
  validation,
  labels = {},
  placeholders = {},
  showOidUserField = true,
  required = true
}) => {
  const { selectedPlayer } = usePlayer();
  
  const defaultLabels = {
    discordId: 'Discord ID do usuário alvo',
    loginAccount: 'Login da Conta',
    oidUser: 'OIDUSER (preenchido automaticamente)',
    ...labels
  };

  const defaultPlaceholders = {
    discordId: 'Ex: 123456789012345678',
    loginAccount: 'Digite o strNexonID da conta',
    ...placeholders
  };

  return (
    <>
      {/* Discord ID Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          {defaultLabels.discordId}
        </label>
        <input
          type="text"
          name="discordId"
          value={formData.discordId}
          placeholder={defaultPlaceholders.discordId}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required={required}
        />
      </div>

      {/* Login Account Field */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          {defaultLabels.loginAccount}
        </label>
        <input
          type="text"
          name="loginAccount"
          value={formData.loginAccount}
          placeholder={defaultPlaceholders.loginAccount}
          onChange={onInputChange}
          className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
          required={required}
        />
        
        {/* Feedback visual de validação */}
        {validation.isValidatingPlayer && (
          <p className="mt-2 text-sm text-yellow-400">
            Validando jogador...
          </p>
        )}
        {validation.fetchedPlayerName && validation.playerValidated && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-green-400">
              ✓ Jogador validado: {validation.fetchedPlayerName} | oidUser: {validation.validatedOidUser}
            </p>
            {validation.accountCount !== undefined && (
              <p className="text-sm text-blue-400">
                Contas encontradas para este Discord ID: {validation.accountCount}
              </p>
            )}
          </div>
        )}
        {validation.errorMessage && (
          <p className="mt-2 text-sm text-red-400">
            ✗ {validation.errorMessage}
          </p>
        )}
      </div>

      {/* Auto-filled OidUser Field */}
      {showOidUserField && validation.fetchedPlayerName && validation.playerValidated && validation.validatedOidUser && (
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            {defaultLabels.oidUser}
          </label>
          <input
            type="text"
            value={validation.validatedOidUser}
            disabled
            className="w-full px-3 py-2 bg-[#2a2b32] text-gray-400 rounded-lg cursor-not-allowed"
          />
        </div>
      )}
    </>
  );
};

export default PlayerValidationFields;