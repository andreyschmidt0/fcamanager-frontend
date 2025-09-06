import React from 'react';
import { X } from 'lucide-react';

interface BanLogEntry {
  BanLogID: number;
  MacAddress: string;
  strDiscordID: string;
  BlockStartDate: string;
  BlockEndDate: string;
  Motivo: string;
  MacAddressBanned: string;
  LogDate: string;
  ClansDeleted: number;
  AccountsBanned: number;
  DeletedClanNames: string | null;
  Status: string;
  ExecutorNickName: string;
  UnbannedByGM_oidUser: number | null;
  UnbanDate: string | null;
}

interface ConsultBanHistoryResultProps {
  isOpen: boolean;
  onClose: () => void;
  banHistory: BanLogEntry[];
  playerName: string;
  formData: {
    discordId: string;
  };
  validatedOidUser: number | null;
  onNewConsultation: () => void;
}

const ConsultBanHistoryResult: React.FC<ConsultBanHistoryResultProps> = ({ 
  isOpen, 
  onClose, 
  banHistory, 
  playerName,
  formData,
  validatedOidUser,
  onNewConsultation
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            HISTÓRICO DE BAN - {playerName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Results Header */}
          <div className="flex items-center justify-between border-b border-gray-600 pb-4 flex-shrink-0">
            <div>
              <h3 className="text-xl font-semibold text-white">
                Histórico de Bans - {playerName}
              </h3>
              <p className="text-gray-400 text-sm">
                Discord: {formData.discordId} | oidUser: {validatedOidUser} | Total: {banHistory.length} registros
              </p>
            </div>
            <button
              onClick={onNewConsultation}
              className="bg-green-500 hover:bg-green-600 text-white text-bold px-4 py-2 rounded-lg transition-colors"
            >
              Nova Consulta
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {banHistory.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                <h3 className="text-2xl font-semibold mb-3">
                  Nenhum registro de ban encontrado
                </h3>
                <p className="text-lg">
                  O jogador {playerName} não possui histórico de bans.
                </p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto flex-1 mt-4 custom-scrollbar">
                {banHistory.map((log) => (
                  <div
                    key={log.BanLogID}
                    className={`bg-[#1d1e24] rounded-lg p-3 border-l-4 ${
                      log.Status.toLowerCase() === 'banido' ? 'border-l-red-500' : 
                      log.UnbanDate ? 'border-l-green-500' :
                      'border-l-blue-500'
                    } hover:bg-[#252631] transition-colors`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-9 gap-3 text-sm items-center">
                      {/* Data e Status */}
                      <div className="md:col-span-2">
                        <p className="text-white font-medium text-base leading-tight">
                          {new Date(log.LogDate).toLocaleString('pt-BR')}
                        </p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                          log.Status.toLowerCase() === 'banido' ? 'bg-red-900 text-white' : 
                          log.UnbanDate ? 'bg-green-900 text-green-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {log.Status}
                        </span>
                      </div>
                      
                      {/* MAC Banido */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">MAC Banido:</span>
                        <p className={`font-medium text-sm ${
                          log.MacAddressBanned?.toLowerCase() === 's' ? 'text-red-400' : 'text-green-400'
                        }`}>
                          {log.MacAddressBanned?.toLowerCase() === 's' ? 'Sim' : 'Não'}
                        </p>
                      </div>
                      
                      {/* Executor */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Executor:</span>
                        <p className="text-white font-medium">{log.ExecutorNickName || 'N/A'}</p>
                      </div>
                      
                      {/* MAC Address */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">MAC:</span>
                        <p className="text-white text-xs">
                          {log.MacAddress || 'N/A'}
                        </p>
                      </div>
                      
                      {/* Início do Ban */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Início:</span>
                        <p className="text-white text-xs">
                          {log.BlockStartDate ? new Date(log.BlockStartDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>

                      {/* Final do Ban */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Final:</span>
                        <p className="text-white text-xs">
                          {log.BlockEndDate ? new Date(log.BlockEndDate).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                      </div>

                      {/* Motivo */}
                      <div className="text-center">
                        <span className="text-xs text-gray-400">Motivo:</span>
                        <p className="text-white text-xs truncate" title={log.Motivo}>
                          {log.Motivo || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-600 flex-shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium text-lg"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultBanHistoryResult;