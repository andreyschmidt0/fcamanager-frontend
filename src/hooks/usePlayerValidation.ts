import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';
import apiService from '../services/api-tauri.service';

interface PlayerValidationState {
  fetchedPlayerName: string;
  errorMessage: string;
  isValidatingPlayer: boolean;
  playerValidated: boolean;
  validatedOidUser: number | null;
  accountCount?: number;
}

interface UsePlayerValidationReturn extends PlayerValidationState {
  validatePlayerCrossCheck: (discordId: string, login: string) => Promise<void>;
  resetValidation: () => void;
  setErrorMessage: (message: string) => void;
}

interface UsePlayerValidationOptions {
  autoValidateOnSelectedPlayer?: boolean;
  debounceMs?: number;
  resetOnModalOpen?: boolean;
}

export const usePlayerValidation = (
  formData: { discordId: string; loginAccount: string },
  isModalOpen: boolean,
  options: UsePlayerValidationOptions = {}
): UsePlayerValidationReturn => {
  const {
    autoValidateOnSelectedPlayer = true,
    debounceMs = 500,
    resetOnModalOpen = true
  } = options;

  const { selectedPlayer } = usePlayer();

  // Estados de validação
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [playerValidated, setPlayerValidated] = useState(false);
  const [validatedOidUser, setValidatedOidUser] = useState<number | null>(null);
  const [accountCount, setAccountCount] = useState<number | undefined>(undefined);

  // Função para resetar estados de validação
  const resetValidation = useCallback(() => {
    setFetchedPlayerName('');
    setErrorMessage('');
    setPlayerValidated(false);
    setValidatedOidUser(null);
    setAccountCount(undefined);
    setIsValidatingPlayer(false);
  }, []);

  // Função para validação cross-check de Discord ID + Login
  const validatePlayerCrossCheck = useCallback(async (discordId: string, login: string) => {
    if (!discordId || discordId.trim() === '' || !login || login.trim() === '') {
      resetValidation();
      return;
    }

    setIsValidatingPlayer(true);
    setErrorMessage('');

    try {
      const result = await apiService.validatePlayerCrossCheck(discordId, login);

      if (result.isValid && result.player) {
        setFetchedPlayerName(result.player.NickName || '');
        setValidatedOidUser(result.player.oidUser || null);
        setPlayerValidated(true);
        setErrorMessage('');

        // Buscar contagem de contas por Discord ID
        try {
          const accountsResult = await apiService.searchUsers({ discordId: discordId });
          setAccountCount(accountsResult.length);
        } catch (countError) {
          console.warn('Erro ao buscar contagem de contas:', countError);
          setAccountCount(undefined);
        }
      } else {
        setFetchedPlayerName('');
        setValidatedOidUser(null);
        setPlayerValidated(false);
        setAccountCount(undefined);
        setErrorMessage(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar jogador:', error);
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setAccountCount(undefined);
      setErrorMessage('Erro de conexão');
    } finally {
      setIsValidatingPlayer(false);
    }
  }, [resetValidation]);

  // useEffect para lidar com selectedPlayer quando modal abrir
  useEffect(() => {
    if (!isModalOpen) return;

    if (selectedPlayer) {
      if (resetOnModalOpen) {
        resetValidation();
      }

      // Se temos selectedPlayer e auto validação está ativa, validar automaticamente
      if (autoValidateOnSelectedPlayer && selectedPlayer.discordId && selectedPlayer.nexonId) {
        validatePlayerCrossCheck(selectedPlayer.discordId, selectedPlayer.nexonId);
      }
    } else if (resetOnModalOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      resetValidation();
    }
  }, [selectedPlayer, isModalOpen, autoValidateOnSelectedPlayer, resetOnModalOpen, validatePlayerCrossCheck, resetValidation]);

  // useEffect com debounce para validação automática quando campos são digitados
  useEffect(() => {
    if (!isModalOpen) return;

    // Não executar debounce se temos selectedPlayer (para evitar validação dupla)
    if (selectedPlayer && selectedPlayer.discordId && selectedPlayer.nexonId) {
      return;
    }

    if (formData.discordId && formData.discordId.trim() !== '' && 
        formData.loginAccount && formData.loginAccount.trim() !== '') {
      
      const timeoutId = setTimeout(() => {
        validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
      }, debounceMs);

      return () => clearTimeout(timeoutId);
    } else {
      // Se um dos campos estiver vazio, limpar validação
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setAccountCount(undefined);
      setErrorMessage('');
    }
  }, [formData.discordId, formData.loginAccount, selectedPlayer, isModalOpen, debounceMs, validatePlayerCrossCheck]);

  return {
    fetchedPlayerName,
    errorMessage,
    isValidatingPlayer,
    playerValidated,
    validatedOidUser,
    accountCount,
    validatePlayerCrossCheck,
    resetValidation,
    setErrorMessage
  };
};