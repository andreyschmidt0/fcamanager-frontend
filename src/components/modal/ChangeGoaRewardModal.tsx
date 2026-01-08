import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Save, X } from 'lucide-react';
import apiService from '../../services/api-tauri.service';
import BaseModal from '../common/BaseModal';
import { CancelButton, SubmitButton } from '../common/ActionButton';
import toast from 'react-hot-toast';

interface GoaRankReward {
  RankEmblem: number;
  RankName: string;
  RankEXP: number;
  ProductIDs: string;
}

interface ChangeGoaRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangeGoaRewardModal: React.FC<ChangeGoaRewardModalProps> = ({ isOpen, onClose }) => {
  const [rewards, setRewards] = useState<GoaRankReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRank, setSelectedRank] = useState<GoaRankReward | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editProductIDs, setEditProductIDs] = useState('');
  
  // Search states
  const [isSearchOpen, setIsSearchModalOpen] = useState(false);
  const [inputSearchTerm, setInputSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load rewards
  const loadRewards = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.getGoaRankRewards();
      if (result.success && result.data) {
        setRewards(result.data);
      } else {
        toast.error(result.error || 'Erro ao carregar recompensas GOA');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRewards();
    } else {
      setSelectedRank(null);
      setIsEditing(false);
    }
  }, [isOpen]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(inputSearchTerm), 500);
    return () => clearTimeout(timer);
  }, [inputSearchTerm]);

  useEffect(() => {
    if (isSearchOpen && searchTerm) {
      handleSearch();
    }
  }, [searchTerm, isSearchOpen]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Usar a rota de busca de itens do gachapon que retorna o que precisamos
      const result = await apiService.searchGachaponProducts({ searchTerm });
      if (result.success && result.data) {
        setSearchResults(result.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleEdit = (rank: GoaRankReward) => {
    setSelectedRank(rank);
    setEditProductIDs(rank.ProductIDs || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedRank) return;

    setIsLoading(true);
    try {
      const result = await apiService.updateGoaRankReward(selectedRank.RankEmblem, editProductIDs);
      if (result.success) {
        toast.success('Recompensa GOA atualizada!');
        setIsEditing(false);
        setSelectedRank(null);
        loadRewards();
      } else {
        toast.error(result.error || 'Erro ao atualizar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsLoading(false);
    }
  };

  const addProductID = (productID: number) => {
    const ids = editProductIDs.split(',').map(id => id.trim()).filter(id => id !== '');
    if (!ids.includes(productID.toString())) {
      ids.push(productID.toString());
      setEditProductIDs(ids.join(', '));
      toast.success(`Produto ${productID} adicionado`);
    } else {
      toast.error('Produto já está na lista');
    }
    setIsSearchModalOpen(false);
  };

  const removeProductID = (idToRemove: string) => {
    const ids = editProductIDs.split(',').map(id => id.trim()).filter(id => id !== '' && id !== idToRemove);
    setEditProductIDs(ids.join(', '));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="ALTERAR RECOMPENSA GOA"
      maxWidth="3xl"
    >
      <div className="space-y-6">
        {!isEditing ? (
          /* List View */
          <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#1d1e24]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#111216] text-gray-400 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4 border-b border-gray-700">Rank</th>
                  <th className="p-4 border-b border-gray-700">EXP Requerido</th>
                  <th className="p-4 border-b border-gray-700">ProductIDs</th>
                  <th className="p-4 border-b border-gray-700 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {rewards.map((rank) => (
                  <tr key={rank.RankEmblem} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{rank.RankName}</span>
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded">ID: {rank.RankEmblem}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-sm">
                      {rank.RankEXP.toLocaleString()}
                    </td>
                    <td className="p-4 text-green-400 font-mono text-xs break-all max-w-xs">
                      {rank.ProductIDs || <span className="text-gray-600 italic">Vazio</span>}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleEdit(rank)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {isLoading && rewards.length === 0 && (
              <div className="p-12 text-center text-gray-400">Carregando recompensas...</div>
            )}
          </div>
        ) : (
          /* Edit View */
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-[#1d1e24] p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Editando: {selectedRank?.RankName}</h3>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">ProductIDs (separados por vírgula)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editProductIDs}
                      onChange={(e) => setEditProductIDs(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#111216] text-green-400 font-mono text-sm rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                      placeholder="Ex: 8479, 24744"
                    />
                    <button
                      onClick={() => setIsSearchModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Search size={18} />
                      Buscar Item
                    </button>
                  </div>
                </div>

                {/* Tag list of current IDs */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {editProductIDs.split(',').map(id => id.trim()).filter(id => id !== '').map((id, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 bg-[#111216] border border-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                      {id}
                      <button onClick={() => removeProductID(id)} className="text-red-500 hover:text-red-400 ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <CancelButton onClick={() => setIsEditing(false)}>Voltar</CancelButton>
              <SubmitButton onClick={handleSave} loading={isLoading} icon={Save}>
                Salvar Alterações
              </SubmitButton>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <CancelButton onClick={onClose}>Fechar</CancelButton>
        </div>
      </div>

      {/* Item Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4">
          <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">Buscar Produto para Recompensa</h3>
              <button onClick={() => setIsSearchModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-hidden flex flex-col">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  autoFocus
                  value={inputSearchTerm}
                  onChange={(e) => setInputSearchTerm(e.target.value)}
                  placeholder="Nome do produto ou ProductID..."
                  className="w-full pl-10 pr-4 py-3 bg-[#1d1e24] text-white rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {isSearching ? (
                  <div className="py-12 text-center text-gray-500">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((item, idx) => (
                      <div key={idx} className="bg-[#1d1e24] p-3 rounded-lg border border-gray-700 flex justify-between items-center hover:bg-gray-800 transition-colors">
                        <div>
                          <p className="text-white font-medium">{item.ProductName}</p>
                          <div className="flex gap-3 mt-1 text-xs text-gray-400 font-mono">
                            <span>ProductID: <span className="text-green-400">{item.ProductID}</span></span>
                            <span>ItemNo: {item.ItemNo00}</span>
                            <span>Period: {item.Period}d</span>
                          </div>
                        </div>
                        <button
                          onClick={() => addProductID(item.ProductID)}
                          className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-full transition-colors"
                          title="Adicionar"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="py-12 text-center text-gray-500">Nenhum resultado encontrado</div>
                ) : (
                  <div className="py-12 text-center text-gray-500 italic">Digite algo para buscar</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ChangeGoaRewardModal;
