import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PlayerInfoProps {
  isOpen: boolean;
  onClose: () => void;
  discordId: string;
  loginAccount: string;
  clanName: string;
  cash: string;
  banhistory: string[];
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ isOpen, onClose, discordId, loginAccount, clanName, cash, banhistory }) => {
  if (!isOpen) return null;

  // Verificação de dados necessários
  if (!discordId || !loginAccount) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111216] rounded-lg shadow-2xl p-6">
          <div className="text-white text-center">
            <p>Dados do player indisponíveis</p>
            <button
              onClick={onClose}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            INFORMAÇÕES DO PLAYER
          </h2>
          <button
            onClick={onClose}
            className="ml-auto mr-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Player Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Discord ID
              </label>
              <p className="text-white bg-[#1d1e24] px-3 py-2 rounded-lg">{discordId || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Login da Conta
              </label>
              <p className="text-white bg-[#1d1e24] px-3 py-2 rounded-lg">{loginAccount || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome do Clã
              </label>
              <p className="text-white bg-[#1d1e24] px-3 py-2 rounded-lg">{clanName || 'Sem Clan'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Cash
              </label>
              <p className="text-white bg-[#1d1e24] px-3 py-2 rounded-lg">{cash || '0'}</p>
            </div>
          </div>

          {/* Ban History Section */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Histórico de Banimentos</h3>
            <div className="bg-[#1d1e24] rounded-lg p-4 max-h-40 overflow-y-auto">
              {banhistory && banhistory.length > 0 ? (
                <ul className="space-y-2">
                  {banhistory.map((ban, index) => (
                    <li key={index} className="text-gray-300 text-sm border-b border-gray-600 pb-2 last:border-b-0">
                      {ban || 'Banimento sem descrição'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-sm">Nenhum banimento registrado</p>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;