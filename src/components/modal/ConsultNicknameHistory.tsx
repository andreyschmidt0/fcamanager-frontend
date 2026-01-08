import React, { useState, useEffect } from 'react';
import BaseModal from '../common/BaseModal';
import { CancelButton } from '../common/ActionButton';
import apiTauriService from '../../services/api-tauri.service';
import toast from 'react-hot-toast';

interface NicknameHistory {
  Ordem: number;
  Nickname: string;
  RegDate: string;
}

interface ConsultNicknameHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  targetOidUser: number;
  currentNickname: string;
}

const ConsultNicknameHistory: React.FC<ConsultNicknameHistoryProps> = ({
  isOpen,
  onClose,
  targetOidUser,
  currentNickname
}) => {
  const [history, setHistory] = useState<NicknameHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';

    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Carregar histórico quando o modal abrir
  useEffect(() => {
    if (isOpen && targetOidUser) {
      loadHistory();
    }
  }, [isOpen, targetOidUser]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const result = await apiTauriService.getNicknameHistory(targetOidUser);
      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        toast.error(result.error || 'Erro ao carregar histórico de nicknames');
        setHistory([]);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico de nicknames:', error);
      toast.error('Erro ao carregar histórico de nicknames');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="HISTÓRICO DE NICKNAMES"
      maxWidth="2xl"
    >
      <div className="flex flex-col h-[60vh]">
        <div className="mb-4">
           <p className="text-gray-400 text-sm">
             Histórico para oidUser: <span className="text-white font-mono">{targetOidUser}</span> ({currentNickname})
           </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Carregando histórico...</p>
            </div>
          </div>
        ) : (
          /* History List */
          <div className="flex-1 overflow-hidden flex flex-col">
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                <p className="text-lg">Nenhum histórico encontrado.</p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 custom-scrollbar bg-[#16171d] rounded-lg border border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#1d1e24] sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-gray-400 font-medium text-sm border-b border-gray-700 w-16 text-center">#</th>
                      <th className="p-3 text-gray-400 font-medium text-sm border-b border-gray-700">Nickname</th>
                      <th className="p-3 text-gray-400 font-medium text-sm border-b border-gray-700 text-right">Data de Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {history.map((item) => (
                      <tr key={item.Ordem} className="hover:bg-[#1f2026] transition-colors">
                        <td className="p-3 text-gray-500 text-sm text-center font-mono">{item.Ordem}</td>
                        <td className="p-3 text-white text-sm font-medium">{item.Nickname}</td>
                        <td className="p-3 text-gray-400 text-sm text-right font-mono">{formatDate(item.RegDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 mt-2">
           <CancelButton onClick={onClose}>
             Fechar
           </CancelButton>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConsultNicknameHistory;