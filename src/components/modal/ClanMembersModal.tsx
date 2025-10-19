import React, { useState, useEffect } from 'react';
import { X, Users, Crown, Shield, User } from 'lucide-react';
import apiTauriService from '../../services/api-tauri.service';
import toast from 'react-hot-toast';

interface ClanMember {
  oidUser: number;
  nickname: string;
  CodeMemberType: number;
  CodeMemberGroup: number;
  dateCreated: string;
  role: 'leader' | 'admin' | 'member';
  roleOrder: number;
}

interface ClanMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  clanName: string;
  oidGuild: number;
}

const ClanMembersModal: React.FC<ClanMembersModalProps> = ({
  isOpen,
  onClose,
  clanName,
  oidGuild
}) => {
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<ClanMember[]>([]);

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

  // Carregar membros quando o modal abrir
  useEffect(() => {
    if (isOpen && oidGuild) {
      loadClanMembers();
    }
  }, [isOpen, oidGuild]);

  // Filtrar membros quando o termo de busca mudar
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(members);
    } else {
      const filtered = members.filter(member =>
        member.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.oidUser.toString().includes(searchTerm)
      );
      setFilteredMembers(filtered);
    }
  }, [searchTerm, members]);

  const loadClanMembers = async () => {
    setIsLoading(true);
    try {
      const result = await apiTauriService.getClanMembers(oidGuild.toString());
      setMembers(result);
      setFilteredMembers(result);

      if (result.length === 0) {
        toast.error('Nenhum membro encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar membros do clã:', error);
      toast.error('Erro ao carregar membros do clã');
      setMembers([]);
      setFilteredMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'leader':
        return <Crown size={16} className="text-yellow-400" />;
      case 'admin':
        return <Shield size={16} className="text-blue-400" />;
      default:
        return <User size={16} className="text-gray-400" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'leader':
        return 'Líder';
      case 'admin':
        return 'Admin';
      default:
        return 'Membro';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'leader':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'admin':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 w-[80%] text-center -translate-x-1/2 text-2xl font-bold text-white font-neofara tracking-wider">
            MEMBROS - {clanName.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nickname ou oidUser..."
                className="w-full px-4 py-2 bg-[#1d1e24] text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={18} />
              <span className="font-medium">
                {filteredMembers.length} / {members.length} membros
              </span>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Carregando membros...</p>
              </div>
            </div>
          ) : (
            /* Members List */
            <div className="flex-1 overflow-hidden flex flex-col">
              {filteredMembers.length === 0 ? (
                <div className="text-center py-16 text-gray-400 flex-1 flex flex-col justify-center">
                  <Users size={64} className="mx-auto mb-4 text-gray-600" />
                  <h3 className="text-2xl font-semibold mb-3">
                    {members.length === 0 ? 'Nenhum membro encontrado' : 'Nenhum membro corresponde à busca'}
                  </h3>
                  <p className="text-lg">
                    {members.length === 0
                      ? 'O clã está vazio.'
                      : 'Tente ajustar o termo de busca.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.oidUser}
                      className={`bg-[#1d1e24] rounded-lg p-4 border-l-4 ${
                        member.role === 'leader'
                          ? 'border-l-yellow-500'
                          : member.role === 'admin'
                          ? 'border-l-blue-500'
                          : 'border-l-gray-500'
                      } hover:bg-[#252631] transition-colors`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        {/* Role Icon + Nickname */}
                        <div className="md:col-span-5 flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a2b32]">
                            {getRoleIcon(member.role)}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-semibold text-lg leading-tight">
                              {member.nickname || 'Desconhecido'}
                            </p>
                            <p className="text-xs text-gray-500">
                              oidUser: {member.oidUser}
                            </p>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <div className="md:col-span-3 flex justify-center">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(
                              member.role
                            )}`}
                          >
                            {getRoleIcon(member.role)}
                            {getRoleName(member.role)}
                          </span>
                        </div>

                        {/* Date Joined */}
                        <div className="md:col-span-4 text-center">
                          <span className="text-xs text-gray-400 block mb-1">
                            Data de entrada:
                          </span>
                          <p className="text-white text-sm font-mono">
                            {formatDate(member.dateCreated)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-600 flex-shrink-0">
            <button
              type="button"
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

export default ClanMembersModal;
