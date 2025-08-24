import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Shield, UserCheck, UserX, Eye, EyeOff, Settings, Search, Filter } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

interface GM {
  id: number;
  discord_id: string;
  nexon_id: string;
  nickname: string;
  role: 'MASTER' | 'USER';
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface GMManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const GMManagement: React.FC<GMManagementProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [gms, setGms] = useState<GM[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGM, setSelectedGM] = useState<GM | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [currentUserDiscordId, setCurrentUserDiscordId] = useState<string>('');
  const [tempRole, setTempRole] = useState<keyof typeof roles | null>(null);
  const [tempNotes, setTempNotes] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Cache para adminDiscordId
  const adminDiscordIdCache = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Definir apenas 2 níveis: Master e Usuário
  const roles = {
    MASTER: {
      name: 'Master',
      color: 'bg-red-600',
      description: 'Acesso total ao sistema - pode gerenciar outros GMs'
    },
    USER: {
      name: 'Usuário GM',
      color: 'bg-green-600', 
      description: 'GM padrão com acesso às funcionalidades básicas'
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchGMs();
    }
  }, [isOpen]);

  // Função auxiliar para buscar Discord ID do usuário logado com cache
  const getAdminDiscordId = useCallback(async () => {
    if (adminDiscordIdCache.current) {
      return adminDiscordIdCache.current;
    }
    
    const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/users/profile/${encodeURIComponent(user?.profile?.nickname || '')}`);
    if (!profileResponse.ok) {
      // Verificar se a resposta é HTML (erro 429) ou JSON
      const contentType = profileResponse.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Muitas tentativas. Aguarde um momento e tente novamente.');
      }
      throw new Error('Erro ao obter perfil do administrador');
    }
    
    const profileData = await profileResponse.json();
    adminDiscordIdCache.current = profileData.strDiscordID;
    return profileData.strDiscordID;
  }, [user?.profile?.nickname]);

  const fetchGMs = async () => {
    setLoading(true);
    try {
      const discordId = await getAdminDiscordId();
      setCurrentUserDiscordId(discordId); // Armazenar o Discord ID do usuário logado
      
      // Usar a nova API de GM Management
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/gm-management/list`);
      if (!response.ok) {
        throw new Error('Erro ao buscar GMs');
      }
      
      const data = await response.json();
      if (data.success) {
        setGms(data.gms);
      } else {
        throw new Error('Erro na resposta da API');
      }
    } catch (error) {
      console.error('Erro ao buscar GMs:', error);
      alert(`Erro ao buscar GMs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setGms([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGMs = gms.filter(gm => {
    const matchesSearch = gm.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gm.nexon_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gm.discord_id.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || gm.role === roleFilter;
    const matchesStatus = showInactive || gm.is_active;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = async (gm: GM, newRole: keyof typeof roles) => {
    try {
      const adminDiscordId = await getAdminDiscordId();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/gm-management/role?discordId=${encodeURIComponent(adminDiscordId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetDiscordId: gm.discord_id,
          newRole: newRole,
          notes: `Role alterada para ${roles[newRole].name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar GM localmente
        setGms(prevGMs => 
          prevGMs.map(g => 
            g.discord_id === gm.discord_id 
              ? { ...g, role: newRole }
              : g
          )
        );
        alert(`Role de ${gm.nickname} atualizada para ${roles[newRole].name}`);
      } else {
        throw new Error(data.error || 'Erro ao atualizar role');
      }
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleToggleStatus = async (gm: GM) => {
    try {
      const newStatus = !gm.is_active;
      const adminDiscordId = await getAdminDiscordId();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/gm-management/status?discordId=${encodeURIComponent(adminDiscordId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetDiscordId: gm.discord_id,
          isActive: newStatus,
          notes: `GM ${newStatus ? 'ativado' : 'desativado'} manualmente`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar GM localmente
        setGms(prevGMs => 
          prevGMs.map(g => 
            g.discord_id === gm.discord_id 
              ? { ...g, is_active: newStatus }
              : g
          )
        );
        alert(`${gm.nickname} ${newStatus ? 'ativado' : 'desativado'} com sucesso`);
      } else {
        throw new Error(data.error || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleUpdateNotes = async (gm: GM, notes: string) => {
    try {
      const adminDiscordId = await getAdminDiscordId();

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/gm-management/notes?discordId=${encodeURIComponent(adminDiscordId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetDiscordId: gm.discord_id,
          notes: notes
        }),
      });

      // Verificar se a resposta é JSON válida
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('text/html')) {
          throw new Error('Muitas tentativas. Aguarde um momento e tente novamente.');
        }
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Atualizar GM localmente
        setGms(prevGMs => 
          prevGMs.map(g => 
            g.discord_id === gm.discord_id 
              ? { ...g, notes: notes }
              : g
          )
        );
        // Também atualizar o selectedGM se for o mesmo
        if (selectedGM?.discord_id === gm.discord_id) {
          setSelectedGM({ ...selectedGM, notes: notes });
        }
      } else {
        throw new Error(data.error || 'Erro ao atualizar notas');
      }
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
      alert(`Erro ao atualizar notas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Função debounced para notas (não usado mais no onChange)
  const debouncedUpdateNotes = useCallback((gm: GM, notes: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      handleUpdateNotes(gm, notes);
    }, 1000);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-[1200px] h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600 px-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" size={28} />
            <h2 className="text-2xl font-bold text-white font-neofara tracking-wider">
              GERENCIAMENTO DE GMs
            </h2>
          </div>
          <button
            onClick={onClose}
            className="absolute right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-700 space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nickname, Nexon ID ou Discord ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[#1d1e24] text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">Todas as Roles</option>
                {Object.entries(roles).map(([key, role]) => (
                  <option key={key} value={key}>{role.name}</option>
                ))}
              </select>
            </div>

            {/* Show Inactive Toggle */}
            <label className="flex items-center gap-2 text-white cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Mostrar Inativos</span>
            </label>

          </div>

          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <span className="text-gray-300 text-lg">Total: <span className="text-white text-md">{gms.length}</span></span>
            <span className="text-gray-300 text-lg">Ativos: <span className="text-white text-md">{gms.filter(gm => gm.is_active).length}</span></span>
            <span className="text-gray-300 text-lg">Masters: <span className="text-white text-md">{gms.filter(gm => gm.role === 'MASTER').length}</span></span>
            <span className="text-gray-300 text-lg">Usuários: <span className="text-white text-md">{gms.filter(gm => gm.role === 'USER').length}</span></span>
          </div>
        </div>

        {/* GM List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredGMs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Shield size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Nenhum GM encontrado</p>
              <p className="text-sm">Ajuste os filtros ou adicione novos GMs</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredGMs.map((gm) => (
                <div
                  key={gm.id}
                  className={`rounded-lg p-4 border transition-colors ${
                    gm.is_active
                      ? 'bg-[#1d1e24] border-gray-600 hover:border-gray-500'
                      : 'bg-gray-900/50 border-gray-700 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${roles[gm.role].color}`}>
                        <span className="text-white font-bold text-sm">
                          {gm.nickname.substring(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-white font-medium text-lg">{gm.nickname}</h3>
   
                          {!gm.is_active && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                              INATIVO
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>Nexon ID: <span className="text-gray-300">{gm.nexon_id}</span></p>
                          <p>Discord: <span className="text-gray-300">{gm.discord_id}</span></p>
                          <p>Criado em: <span className="text-gray-300">{new Date(gm.created_at).toLocaleDateString('pt-BR')}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedGM(gm);
                          setTempRole(gm.role);
                          setTempNotes(gm.notes || '');
                          setHasUnsavedChanges(false);
                          setShowPermissionModal(true);
                        }}
                        className="p-2 bg-green-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Gerenciar Permissões"
                      >
                        <Settings size={16} />
                      </button>
                      
                      {/* Esconder botão de ativar/desativar se for o próprio usuário e for MASTER */}
                      {!(gm.discord_id === currentUserDiscordId && gm.role === 'MASTER') && (
                        <button
                          onClick={() => handleToggleStatus(gm)}
                          className={`p-2 rounded-lg transition-colors ${
                            gm.is_active
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={gm.is_active ? 'Desativar' : 'Ativar'}
                        >
                          {gm.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Role Info */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Nível de Acesso:</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${roles[gm.role].color} text-white`}>
                        {roles[gm.role].name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {roles[gm.role].description}
                      </span>
                    </div>
                  </div>

                  {gm.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-400">Notas: <span className="text-gray-300">{gm.notes}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Permission Modal */}
        {showPermissionModal && selectedGM && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-[#111216] rounded-lg w-[600px] h-[700px] overflow-y-auto">
              {/* Modal content for permissions would go here */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Gerenciar Permissões - {selectedGM.nickname}
                    </h3>
                    {hasUnsavedChanges && (
                      <p className="text-yellow-500 text-sm mt-1">• Há alterações não salvas</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (confirm('Há alterações não salvas. Deseja descartar as mudanças?')) {
                          setShowPermissionModal(false);
                          setTempRole(null);
                          setTempNotes('');
                          setHasUnsavedChanges(false);
                        }
                      } else {
                        setShowPermissionModal(false);
                      }
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Role Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Nível de Acesso</label>
                  <select
                    value={tempRole || selectedGM.role}
                    onChange={(e) => {
                      const newRole = e.target.value as keyof typeof roles;
                      setTempRole(newRole);
                      setHasUnsavedChanges(true);
                    }}
                    className={`w-full bg-[#1d1e24] text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none ${
                      tempRole && tempRole !== selectedGM.role ? 'border-2 border-yellow-500' : ''
                    }`}
                    disabled={selectedGM.discord_id === currentUserDiscordId && selectedGM.role === 'MASTER'}
                  >
                    {Object.entries(roles).map(([key, role]) => (
                      <option key={key} value={key}>{role.name} - {role.description}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedGM.discord_id === currentUserDiscordId && selectedGM.role === 'MASTER' 
                      ? 'Masters não podem alterar seu próprio nível de acesso'
                      : 'Apenas Masters podem alterar níveis de acesso. Clique em "Salvar" para confirmar as mudanças.'
                    }
                  </p>
                </div>

                {/* Role Description */}
                <div className="mb-6 p-3 bg-[#1d1e24] rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-2">Descrição do Nível:</h4>
                  <p className="text-sm text-gray-300">{roles[tempRole || selectedGM.role].description}</p>
                  
                  <div className="mt-3">
                    <h5 className="text-xs font-medium text-white mb-1">Permissões:</h5>
                    <ul className="text-xs text-gray-300 space-y-1">
                      {(tempRole || selectedGM.role) === 'MASTER' ? (
                        <>
                          <li>• Gerenciar todos os usuários GM</li>
                          <li>• Alterar níveis de acesso</li>
                          <li>• Visualizar logs completos do sistema</li>
                          <li>• Todas as funcionalidades administrativas</li>
                        </>
                      ) : (
                        <>
                          <li>• Gerenciar jogadores (ban, unban, etc.)</li>
                          <li>• Gerenciar clãs</li>
                          <li>• Enviar itens e cash</li>
                          <li>• Funcionalidades básicas de GM</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-white mb-2">Notas Administrativas</label>
                  <textarea
                    value={tempNotes || selectedGM.notes || ''}
                    onChange={(e) => {
                      setTempNotes(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Adicionar notas sobre este GM..."
                    className={`w-full bg-[#1d1e24] text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none resize-none ${
                      tempNotes !== '' && tempNotes !== selectedGM.notes ? 'border-2 border-yellow-500' : ''
                    }`}
                    rows={3}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    As alterações serão salvas apenas quando você clicar em "Salvar".
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        if (confirm('Há alterações não salvas. Deseja descartar as mudanças?')) {
                          setShowPermissionModal(false);
                          setTempRole(null);
                          setTempNotes('');
                          setHasUnsavedChanges(false);
                        }
                      } else {
                        setShowPermissionModal(false);
                      }
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      if (selectedGM && hasUnsavedChanges) {
                        try {
                          const originalGM = gms.find(g => g.discord_id === selectedGM.discord_id);
                          let success = true;
                          
                          // Se houve alteração de role, salvar
                          if (tempRole && tempRole !== selectedGM.role) {
                            await handleUpdateRole(selectedGM, tempRole);
                          }
                          
                          // Se houve alteração de notas, salvar
                          if (tempNotes !== '' && tempNotes !== selectedGM.notes) {
                            await handleUpdateNotes(selectedGM, tempNotes);
                          }
                          
                          if (success) {
                            alert('Alterações salvas com sucesso!');
                            setShowPermissionModal(false);
                            setTempRole(null);
                            setTempNotes('');
                            setHasUnsavedChanges(false);
                          }
                        } catch (error) {
                          console.error('Erro ao salvar:', error);
                        }
                      } else if (!hasUnsavedChanges) {
                        setShowPermissionModal(false);
                      }
                    }}
                    className={`flex-1 py-2 rounded-lg transition-colors ${
                      hasUnsavedChanges 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!hasUnsavedChanges}
                  >
                    {hasUnsavedChanges ? 'Salvar Alterações' : 'Nenhuma Alteração'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GMManagement;