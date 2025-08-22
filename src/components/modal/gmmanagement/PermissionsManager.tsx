import React, { useState, useEffect } from 'react';
import { X, Shield, Check, X as XIcon, RotateCcw, Search } from 'lucide-react';

interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

interface GM {
  id: number;
  discord_id: string;
  nexon_id: string;
  nickname: string;
  role: string;
  is_active: boolean;
  permissions_array: string[];
}

interface PermissionsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedGM: GM | null;
  onPermissionsUpdated: () => void;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  isOpen,
  onClose,
  selectedGM,
  onPermissionsUpdated
}) => {
  const [permissions, setPermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pendingChanges, setPendingChanges] = useState<Record<string, 'grant' | 'deny' | 'reset'>>({});

  // Lista de categorias e permissões (simulada - virá da API)
  const mockPermissions = {
    'Jogadores': [
      { key: 'players.view', name: 'Visualizar Jogadores', description: 'Pode visualizar lista de jogadores', category: 'Jogadores' },
      { key: 'players.search', name: 'Buscar Jogadores', description: 'Pode buscar jogadores por critérios', category: 'Jogadores' },
      { key: 'players.ban', name: 'Banir Jogadores', description: 'Pode aplicar banimentos', category: 'Jogadores' },
      { key: 'players.unban', name: 'Desbanir Jogadores', description: 'Pode remover banimentos', category: 'Jogadores' },
      { key: 'players.kick', name: 'Expulsar Jogadores', description: 'Pode expulsar do servidor', category: 'Jogadores' },
      { key: 'players.nickname.change', name: 'Alterar Nickname', description: 'Pode alterar nicknames', category: 'Jogadores' },
      { key: 'players.email.change', name: 'Alterar Email', description: 'Pode alterar emails', category: 'Jogadores' },
    ],
    'Clãs': [
      { key: 'clans.view', name: 'Visualizar Clãs', description: 'Pode visualizar clãs', category: 'Clãs' },
      { key: 'clans.search', name: 'Buscar Clãs', description: 'Pode buscar clãs', category: 'Clãs' },
      { key: 'clans.delete', name: 'Deletar Clãs', description: 'Pode deletar clãs', category: 'Clãs' },
      { key: 'clans.transfer.leadership', name: 'Transferir Liderança', description: 'Pode transferir liderança', category: 'Clãs' },
    ],
    'Economia': [
      { key: 'economy.cash.send', name: 'Enviar Cash', description: 'Pode enviar cash', category: 'Economia' },
      { key: 'economy.cash.remove', name: 'Remover Cash', description: 'Pode remover cash', category: 'Economia' },
      { key: 'economy.exp.add', name: 'Adicionar EXP', description: 'Pode adicionar experiência', category: 'Economia' },
      { key: 'economy.exp.remove', name: 'Remover EXP', description: 'Pode remover experiência', category: 'Economia' },
    ],
    'Itens': [
      { key: 'items.send', name: 'Enviar Itens', description: 'Pode enviar itens', category: 'Itens' },
      { key: 'items.remove', name: 'Remover Itens', description: 'Pode remover itens', category: 'Itens' },
      { key: 'items.inventory.view', name: 'Ver Inventário', description: 'Pode ver inventários', category: 'Itens' },
    ],
    'Relatórios': [
      { key: 'reports.ban.history', name: 'Histórico de Banimentos', description: 'Pode ver histórico de bans', category: 'Relatórios' },
      { key: 'reports.logs.view', name: 'Ver Logs', description: 'Pode visualizar logs', category: 'Relatórios' },
      { key: 'reports.stats.view', name: 'Ver Estatísticas', description: 'Pode ver estatísticas', category: 'Relatórios' },
    ],
    'Administração': [
      { key: 'admin.gm.manage', name: 'Gerenciar GMs', description: 'Pode gerenciar outros GMs', category: 'Administração' },
      { key: 'admin.permissions.manage', name: 'Gerenciar Permissões', description: 'Pode alterar permissões', category: 'Administração' },
      { key: 'admin.system.config', name: 'Configurar Sistema', description: 'Pode alterar configurações', category: 'Administração' },
    ]
  };

  useEffect(() => {
    if (isOpen) {
      setPermissions(mockPermissions);
      setPendingChanges({});
    }
  }, [isOpen]);

  // Obter status atual de uma permissão
  const getPermissionStatus = (permissionKey: string): 'granted' | 'denied' | 'role_default' => {
    if (!selectedGM) return 'role_default';

    // Verificar mudanças pendentes primeiro
    if (pendingChanges[permissionKey]) {
      if (pendingChanges[permissionKey] === 'reset') return 'role_default';
      return pendingChanges[permissionKey] === 'grant' ? 'granted' : 'denied';
    }

    // Verificar estado atual
    if (selectedGM.permissions_array.includes(permissionKey)) return 'granted';
    if (selectedGM.permissions_array.includes(`-${permissionKey}`)) return 'denied';
    
    return 'role_default';
  };

  // Alterar status da permissão
  const handlePermissionChange = (permissionKey: string, action: 'grant' | 'deny' | 'reset') => {
    setPendingChanges(prev => ({
      ...prev,
      [permissionKey]: action
    }));
  };

  // Salvar todas as alterações
  const handleSaveChanges = async () => {
    if (!selectedGM || Object.keys(pendingChanges).length === 0) return;

    setLoading(true);
    try {
      // Aqui seria a chamada para a API
      for (const [permissionKey, action] of Object.entries(pendingChanges)) {
        console.log(`${action} permission ${permissionKey} for ${selectedGM.nickname}`);
        // await updatePermission(selectedGM.discord_id, permissionKey, action);
      }
      
      setPendingChanges({});
      onPermissionsUpdated();
      alert('Permissões atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      alert('Erro ao salvar permissões');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar permissões
  const getFilteredPermissions = () => {
    let allPermissions: Permission[] = [];
    
    if (selectedCategory === 'all') {
      Object.values(permissions).forEach(categoryPerms => {
        allPermissions = [...allPermissions, ...categoryPerms];
      });
    } else {
      allPermissions = permissions[selectedCategory] || [];
    }

    if (searchTerm) {
      allPermissions = allPermissions.filter(perm =>
        perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perm.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return allPermissions;
  };

  const categories = Object.keys(permissions);
  const filteredPermissions = getFilteredPermissions();
  const pendingChangesCount = Object.keys(pendingChanges).length;

  if (!isOpen || !selectedGM) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-[1000px] h-[700px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-white">
              Gerenciar Permissões - {selectedGM.nickname}
            </h2>
            <p className="text-sm text-gray-400">
              Role atual: <span className="text-blue-400">{selectedGM.role}</span>
              {pendingChangesCount > 0 && (
                <span className="ml-4 text-yellow-400">
                  {pendingChangesCount} alteração(ões) pendente(s)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-700 space-y-4">
          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar permissões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#1d1e24] text-white rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none text-sm"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Legend */}
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-300">Permitido</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-300">Negado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded"></div>
              <span className="text-gray-300">Padrão da Role</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-gray-300">Alteração Pendente</span>
            </div>
          </div>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredPermissions.map((permission) => {
              const status = getPermissionStatus(permission.key);
              const hasPendingChange = pendingChanges[permission.key];

              return (
                <div
                  key={permission.key}
                  className={`p-3 rounded-lg border transition-colors ${
                    hasPendingChange
                      ? 'bg-yellow-900/20 border-yellow-500/50'
                      : 'bg-[#1d1e24] border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="text-white font-medium">{permission.name}</h4>
                        <span className="text-xs text-gray-500 font-mono">{permission.key}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">{permission.description}</p>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {/* Status indicator */}
                      <div
                        className={`w-3 h-3 rounded ${
                          status === 'granted' ? 'bg-green-500' :
                          status === 'denied' ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                        title={
                          status === 'granted' ? 'Permitido' :
                          status === 'denied' ? 'Negado' : 'Padrão da role'
                        }
                      />

                      {/* Action buttons */}
                      <div className="flex border rounded-lg overflow-hidden">
                        <button
                          onClick={() => handlePermissionChange(permission.key, 'grant')}
                          className={`p-1 transition-colors ${
                            status === 'granted' && !hasPendingChange
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-green-600 hover:text-white'
                          }`}
                          title="Permitir"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handlePermissionChange(permission.key, 'deny')}
                          className={`p-1 transition-colors ${
                            status === 'denied' && !hasPendingChange
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white'
                          }`}
                          title="Negar"
                        >
                          <XIcon size={14} />
                        </button>
                        <button
                          onClick={() => handlePermissionChange(permission.key, 'reset')}
                          className={`p-1 transition-colors ${
                            status === 'role_default' && !hasPendingChange
                              ? 'bg-gray-600 text-white'
                              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                          }`}
                          title="Resetar para padrão da role"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPermissions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma permissão encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={loading || pendingChangesCount === 0}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              pendingChangesCount > 0 && !loading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            {loading ? 'Salvando...' : `Salvar${pendingChangesCount > 0 ? ` (${pendingChangesCount})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsManager;