import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useClan } from '../../contexts/ClanContext';
import ConfirmationModal from './confirm/confirmmodal';
import { useAuth } from '../../hooks/useAuth';
import apiService from '../../services/api-tauri.service';

interface removeclanProps {
  isOpen: boolean;
  onClose: () => void;
}

const removeclan: React.FC<removeclanProps> = ({ isOpen, onClose }) => {
  const { selectedClan } = useClan();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    oidGuild: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fetchedClanName, setFetchedClanName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (selectedClan && isOpen) {
      setFormData(prev => ({
        ...prev,
        oidGuild: selectedClan.oidGuild?.toString() || ''
      }));
      setFetchedClanName(''); // Limpar nome buscado pois temos o selectedClan
      setErrorMessage(''); // Limpar mensagem de erro
      
      // Validar o clã selecionado automaticamente
      if (selectedClan.oidGuild) {
        fetchClanNameById(selectedClan.oidGuild.toString());
      }
    }
  }, [selectedClan, isOpen]);

  // Função para buscar nome do clã por ID
  const fetchClanNameById = async (clanId: string) => {
    if (!clanId || clanId.trim() === '') {
      setFetchedClanName('');
      return;
    }

    try {
      const clan = await apiService.getClanById(clanId);
      if (clan) {
        setFetchedClanName(clan.strName || '');
        setErrorMessage(''); // Limpar erro se existir
      } else {
        setFetchedClanName('');
        setErrorMessage('Clã não encontrado com este ID. Verifique o ID informado.');
      }
    } catch (error) {
      console.error('Erro ao buscar nome do clã:', error);
      setFetchedClanName('');
      setErrorMessage('Erro de conexão');
    }
  };

  // Buscar nome do clã quando o ID é digitado diretamente (sem selectedClan)
  useEffect(() => {
    if (!selectedClan && formData.oidGuild && formData.oidGuild.trim() !== '') {
      const timeoutId = setTimeout(() => {
        fetchClanNameById(formData.oidGuild);
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    } else if (!selectedClan && (!formData.oidGuild || formData.oidGuild.trim() === '')) {
      // Limpar apenas quando não há selectedClan E o campo está vazio
      setFetchedClanName('');
      setErrorMessage('');
    }
  }, [formData.oidGuild, selectedClan]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar se temos um clã válido antes de mostrar confirmação
    if (!selectedClan && (!fetchedClanName || fetchedClanName.trim() === '')) {
      setErrorMessage('Por favor, insira um ID de clã válido.');
      return;
    }
    
    setShowConfirmation(true);
  };

const handleConfirmAction = async () => {
  
  // Validar se o clã existe antes de prosseguir
  if (!selectedClan && (!fetchedClanName || fetchedClanName.trim() === '')) {
    try {
      const clan = await apiService.getClanById(formData.oidGuild);
      if (!clan || !clan.strName) {
        setErrorMessage('Clã não encontrado com este ID. Verifique o ID informado.');
        setShowConfirmation(false);
        return;
      }
    } catch (error) {
      console.error('Erro ao validar clã:', error);
      setErrorMessage('Erro ao validar clã. Tente novamente.');
      setShowConfirmation(false);
      return;
    }
  }

  const adminName = user?.profile?.nickname || user?.username || 'Admin';
  
  // Usar selectedClan primeiro, depois fetchedClanName, e por último fallback
  const clanName = selectedClan?.strName || fetchedClanName || 'Clã desconhecido';

  try {
    // Registra a atividade no banco de dados via API
    const dbLogData = {
      adminDiscordId: user?.profile?.discordId || 'system',
      adminNickname: adminName,
      targetDiscordId: selectedClan?.oidGuild?.toString() || formData.oidGuild,
      targetNickname: clanName,
      action: 'remove_clan',
      old_value: `${formData.oidGuild}|${clanName}`, // ID|Nome do clã
      new_value: 'Excluído',
      details: `Removeu o clã ${clanName}`,
      notes: `Clã removido via ID: ${formData.oidGuild}`
    };

    await apiService.createLog(dbLogData);
  } catch (error) {
    console.error('Falha ao salvar log de remoção de clã no banco de dados:', error);
  }

  setShowConfirmation(false);
  onClose();
};

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative flex items-center h-20 border-b border-gray-600">
          <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-bold text-white font-neofara tracking-wider">
            REMOVER CLÃ
          </h2>
          <button
            onClick={onClose}
            className="ml-[465px] text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              ID do Clã
            </label>
            <input
              type="text"
              name="oidGuild"
              value={formData.oidGuild}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
            {fetchedClanName && (
              <p className="mt-2 text-sm text-green-400">
                Clã encontrado: {fetchedClanName}
              </p>
            )}
            {errorMessage && (
              <p className="mt-2 text-sm text-red-400">
                {errorMessage}
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Remover Clã
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelConfirmation}
        title="Confirmar Ação"
        description={`Tem certeza que deseja remover o clã com ID: ${formData.oidGuild}?`}
        confirmActionText="Sim, Remover"
        cancelActionText="Cancelar"
      />
    </div>
  );
};

export default removeclan;