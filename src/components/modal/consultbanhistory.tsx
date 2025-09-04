import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePlayer } from '../../contexts/PlayerContext';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface BanLogEntry {
  LogID: number;
  ActionDate: string;
  ExecutorOidUser: number;
  ExecutorInfo: string;
  SourceProcedure: string;
  ActionType: string;
  TargetInfo: string;
  TargetDiscordID: string;
  ValueBefore: string;
  ValueAfter: string;
  Notes: string;
  TargetOidUser: number;
  BlockStartDate: string | null;
  BlockEndDate: string | null;
}

interface ConsultBanHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultBanHistory: React.FC<ConsultBanHistoryProps> = ({ isOpen, onClose }) => {
  const { selectedPlayer } = usePlayer();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    discordId: '',
    loginAccount: ''
  });

  // Estados para validação
  const [fetchedPlayerName, setFetchedPlayerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isValidatingPlayer, setIsValidatingPlayer] = useState(false);
  const [playerValidated, setPlayerValidated] = useState(false);
  const [validatedOidUser, setValidatedOidUser] = useState<number | null>(null);
  
  // Estados para busca e resultados
  const [isLoading, setIsLoading] = useState(false);
  const [banHistory, setBanHistory] = useState<BanLogEntry[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Função para validação cross-check de Discord ID + Login
  const validatePlayerCrossCheck = async (discordId: string, login: string) => {
    if (!discordId || discordId.trim() === '' || !login || login.trim() === '') {
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('');
      return;
    }

    setIsValidatingPlayer(true);
    try {
      const result = await apiService.validatePlayerCrossCheck(discordId, login);
      
      if (result.isValid && result.player) {
        setFetchedPlayerName(result.player.NickName || '');
        setValidatedOidUser(result.player.oidUser || null);
        setPlayerValidated(true);
        setErrorMessage('');
      } else {
        setFetchedPlayerName('');
        setValidatedOidUser(null);
        setPlayerValidated(false);
        setErrorMessage(result.error || 'Erro na validação');
      }
    } catch (error) {
      console.error('Erro ao validar jogador:', error);
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('Erro de conexão');
    } finally {
      setIsValidatingPlayer(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        discordId: selectedPlayer.discordId || '',
        loginAccount: selectedPlayer.nexonId || ''
      }));
      
      // Limpar estados quando modal abrir com selectedPlayer
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setValidatedOidUser(null);
      setBanHistory([]);
      setShowResults(false);
      
      // Se temos selectedPlayer, validar automaticamente
      if (selectedPlayer.discordId && selectedPlayer.nexonId) {
        validatePlayerCrossCheck(selectedPlayer.discordId, selectedPlayer.nexonId);
      }
    } else if (isOpen) {
      // Limpar tudo quando modal abrir sem selectedPlayer
      setFormData({ discordId: '', loginAccount: '' });
      setFetchedPlayerName('');
      setErrorMessage('');
      setPlayerValidated(false);
      setValidatedOidUser(null);
      setBanHistory([]);
      setShowResults(false);
    }
  }, [selectedPlayer, isOpen]);

  // useEffect com debounce para validação automática quando campos são digitados
  useEffect(() => {
    if (formData.discordId && formData.discordId.trim() !== '' && 
        formData.loginAccount && formData.loginAccount.trim() !== '') {
      
      const timeoutId = setTimeout(() => {
        validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else {
      // Se um dos campos estiver vazio, limpar validação
      setFetchedPlayerName('');
      setValidatedOidUser(null);
      setPlayerValidated(false);
      setErrorMessage('');
    }
  }, [formData.discordId, formData.loginAccount]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar mensagem de erro quando usuário digitar
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se o jogador foi validado antes de buscar histórico
    if (!playerValidated || !fetchedPlayerName || !validatedOidUser) {
      setErrorMessage('Por favor, aguarde a validação do jogador ser concluída.');
      return;
    }
    
    // Validar se ainda está validando
    if (isValidatingPlayer) {
      setErrorMessage('Aguarde a validação ser concluída antes de consultar o histórico.');
      return;
    }
    
    if (isLoading) return; // Prevent double-clicks
    
    setIsLoading(true);
    try {
      // Validação dupla antes de buscar histórico
      if (!playerValidated || !validatedOidUser) {
        try {
          const validationResult = await apiService.validatePlayerCrossCheck(formData.discordId, formData.loginAccount);
          if (!validationResult.isValid || !validationResult.player?.oidUser) {
            setErrorMessage('Jogador não pôde ser validado. Verifique os dados informados.');
            return;
          }
          setValidatedOidUser(validationResult.player.oidUser);
        } catch (error) {
          console.error('Erro na validação dupla:', error);
          setErrorMessage('Erro ao validar jogador. Tente novamente.');
          return;
        }
      }

      // Buscar histórico de ban usando o oidUser validado
      const result = await apiService.getBanHistory(validatedOidUser!);
      
      if (result.success) {
        setBanHistory(result.data || []);
        setShowResults(true);
        setErrorMessage('');
      } else {
        setErrorMessage(result.error || 'Erro ao buscar histórico de bans');
        setBanHistory([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setErrorMessage('Erro de conexão ao buscar histórico de bans');
      setBanHistory([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className={`bg-[#111216] rounded-lg shadow-2xl w-full ${showResults ? 'max-w-6xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            CONSULTAR HISTÓRICO DE BAN
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {!showResults ? (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Discord ID */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Discord ID do usuário alvo
                </label>
                <input
                  type="text"
                  name="discordId"
                  value={formData.discordId}
                  onChange={handleInputChange}
                  placeholder='Ex: 123456789012345678'
                  className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Login da Conta (strNexonID)
                </label>
                <input
                  type="text"
                  name="loginAccount"
                  value={formData.loginAccount}
                  onChange={handleInputChange}
                  placeholder="Digite o strNexonID da conta"
                  className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
                  required
                />
                
                {/* Feedback visual de validação */}
                {isValidatingPlayer && (
                  <p className="mt-2 text-sm text-yellow-400">
                    Validando jogador...
                  </p>
                )}
                {fetchedPlayerName && playerValidated && (
                  <p className="mt-2 text-sm text-green-400">
                    ✓ Jogador validado: {fetchedPlayerName} | oidUser: {validatedOidUser}
                  </p>
                )}
                {errorMessage && (
                  <p className="mt-2 text-sm text-red-400">
                    ✗ {errorMessage}
                  </p>
                )}
              </div>

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
                  disabled={isLoading || !playerValidated}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:cursor-not-allowed text-white text-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  {isLoading ? 'Buscando...' : 'Consultar Histórico de Ban'}
                </button>
              </div>
            </form>
          ) : (
            /* Results Display */
            <div className="space-y-4">
              {/* Results Header */}
              <div className="flex items-center justify-between border-b border-gray-600 pb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Histórico de Bans - {fetchedPlayerName}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Discord: {formData.discordId} | oidUser: {validatedOidUser} | Total: {banHistory.length} registros
                  </p>
                </div>
                <button
                  onClick={() => setShowResults(false)}
                  className="bg-green-500 hover:bg-green-600 text-white text-bold px-4 py-2 rounded-lg transition-colors"
                >
                  Nova Consulta
                </button>
              </div>

              {/* Results Table */}
              {banHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                      <tr>
                        <th className="px-4 py-3">Data/Hora</th>
                        <th className="px-4 py-3">Tipo de Ação</th>
                        <th className="px-4 py-3">Executor</th>
                        <th className="px-4 py-3">Início do Bloqueio</th>
                        <th className="px-4 py-3">Final do Bloqueio</th>
                        <th className="px-4 py-3">Valor Antes</th>
                        <th className="px-4 py-3">Valor Depois</th>
                        <th className="px-4 py-3">Observações</th>
                        <th className="px-4 py-3">Procedimento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banHistory.map((log) => (
                        <tr key={log.LogID} className="border-b border-gray-600 hover:bg-gray-700">
                          <td className="px-4 py-3 text-white">
                            {new Date(log.ActionDate).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-4 py-1 rounded text-xs font-medium ${
                              log.ActionType.toLowerCase().includes('ban') ? 'bg-red-900 text-white' : 
                              log.ActionType.toLowerCase().includes('unban') ? 'bg-green-900 text-green-300' :
                              'bg-gray-700 text-gray-300'
                            }`}>
                              {log.ActionType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-white">{log.ExecutorInfo}</p>
                              <p className="text-xs text-gray-400">ID: {log.ExecutorOidUser}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {log.BlockStartDate ? new Date(log.BlockStartDate).toLocaleString('pt-BR') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {log.BlockEndDate ? new Date(log.BlockEndDate).toLocaleString('pt-BR') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-300">{log.ValueBefore || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-300">{log.ValueAfter || 'N/A'}</td>
                          <td className="px-4 py-3 text-gray-300 max-w-xs truncate" title={log.Notes}>
                            {log.Notes || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{log.SourceProcedure}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-lg">Nenhum registro de ban encontrado para este jogador.</p>
                  <p className="text-gray-500 text-sm mt-2">O jogador {fetchedPlayerName} não possui histórico de bans.</p>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-gray-600">
                <button
                  onClick={onClose}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultBanHistory;