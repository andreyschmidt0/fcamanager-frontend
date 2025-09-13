import React, { useState, useCallback, useEffect } from 'react';
import ActionFormModal from '../common/ActionFormModal';
import apiService from '../../services/api-tauri.service';
import { useAuth } from '../../hooks/useAuth';
import { usePlayer } from '../../contexts/PlayerContext';

interface MarcaDeBatalhaProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mapeamento das marcas de batalha conforme especificado no prompt
const MARCAS_BATALHA = [
  { id: 3, nome: 'LB7 Games' },
  { id: 5, nome: '1 Troféu' },
  { id: 6, nome: '2 Troféus' },
  { id: 7, nome: '3 Troféus' },
  { id: 8, nome: '4 Troféus' },
  { id: 9, nome: '5 Troféus' },
  { id: 10, nome: '6 Troféus' },
  { id: 11, nome: '7 Troféus' },
  { id: 12, nome: '8 Troféus' },
  { id: 13, nome: '9 Troféus' },
  { id: 14, nome: 'Infinito Troféu' },
  { id: 15, nome: 'Coroa' },
  { id: 16, nome: 'Coroa Sniper' },
  { id: 17, nome: 'Top 1 Kills' },
  { id: 18, nome: 'Top 2 e 3 Kills' },
  { id: 19, nome: 'Headshot' },
  { id: 20, nome: 'Twitch' },
  { id: 21, nome: 'Youtube' },
  { id: 22, nome: 'Top 1 EXP' },
  { id: 23, nome: 'Top 2 EXP' },
  { id: 24, nome: 'Top 3 EXP' }
];

// Componente movido para fora para evitar re-criação
const MarcaDeBatalhaFormFields = ({ formData, onInputChange }: any) => (
  <>
    {/* Ação */}
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        Ação
      </label>
      <select
        name="acao"
        value={formData.acao}
        onChange={onInputChange}
        className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
        required
      >
        <option value="">Selecione uma ação</option>
        <option value="A">Ativar Marca de Batalha</option>
        <option value="D">Desativar Marca de Batalha</option>
      </select>
    </div>

    {/* Mostrar campos condicionalmente baseado na ação */}
    {formData.acao === 'A' && (
      <>
        {/* Login do jogador (para ativar) */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Login do Jogador (strNexonID)
          </label>
          <input
            type="text"
            name="targetNexonId"
            placeholder="Ex: schmidt"
            value={formData.targetNexonId}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Marca de Batalha */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Marca de Batalha
          </label>
          <select
            name="marcaID"
            value={formData.marcaID}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            required
          >
            <option value="">Selecione uma marca</option>
            {MARCAS_BATALHA.map((marca) => (
              <option key={marca.id} value={marca.id}>
                {marca.nome}
              </option>
            ))}
          </select>
        </div>
      </>
    )}

    {formData.acao === 'D' && (
      <>
        {/* Tipo de desativação */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Tipo de Desativação
          </label>
          <select
            name="tipoDesativacao"
            value={formData.tipoDesativacao}
            onChange={onInputChange}
            className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
            required
          >
            <option value="">Selecione o tipo</option>
            <option value="usuario">Desativar para jogador específico</option>
            <option value="marca">Desativar todos com uma marca específica</option>
          </select>
        </div>

        {/* Login do jogador (para desativar usuário específico) */}
        {formData.tipoDesativacao === 'usuario' && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Login do Jogador (strNexonID)
            </label>
            <input
              type="text"
              name="targetNexonId"
              placeholder="Ex: schmidt"
              value={formData.targetNexonId}
              onChange={onInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>
        )}

        {/* Marca de Batalha (para desativar por marca) */}
        {formData.tipoDesativacao === 'marca' && (
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Marca de Batalha para Desativar
            </label>
            <select
              name="marcaID"
              value={formData.marcaID}
              onChange={onInputChange}
              className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-green-500 focus:outline-none transition-colors"
              required
            >
              <option value="">Selecione uma marca</option>
              {MARCAS_BATALHA.map((marca) => (
                <option key={marca.id} value={marca.id}>
                  {marca.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </>
    )}
  </>
);

const MarcaDeBatalha: React.FC<MarcaDeBatalhaProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { selectedPlayer } = usePlayer();
  const [formData, setFormData] = useState({
    acao: '',
    targetNexonId: '',
    marcaID: '',
    tipoDesativacao: '',
  });

  // Preencher automaticamente o login quando um player � selecionado
  useEffect(() => {
    if (selectedPlayer && isOpen) {
      setFormData(prev => ({
        ...prev,
        targetNexonId: selectedPlayer.nexonId || ''
      }));
    }
  }, [selectedPlayer, isOpen]);

  const handleMarcaDeBatalhaAction = async () => {
    const requestData: any = {
      acao: formData.acao
    };

    if (formData.acao === 'A') {
      // Para ativar: precisa do usu�rio e marca
      requestData.targetNexonId = formData.targetNexonId;
      requestData.marcaID = parseInt(formData.marcaID);
    } else if (formData.acao === 'D') {
      // Para desativar: depende do tipo
      if (formData.tipoDesativacao === 'usuario') {
        requestData.targetNexonId = formData.targetNexonId;
      } else if (formData.tipoDesativacao === 'marca') {
        requestData.marcaID = parseInt(formData.marcaID);
      }
    }

    const result = await apiService.setUserMarcaBatalha(requestData);

    if (!result.success) {
      throw new Error(result.error || 'Erro ao gerenciar marca de batalha');
    }
    
    return result;
  };

  const customValidation = useCallback(() => {
    if (!formData.acao) return false;

    if (formData.acao === 'A') {
      // Para ativar: precisa do usu�rio e marca
      if (!formData.targetNexonId.trim() || !formData.marcaID) return false;
    } else if (formData.acao === 'D') {
      // Para desativar: precisa do tipo de desativação
      if (!formData.tipoDesativacao) return false;
      
      if (formData.tipoDesativacao === 'usuario' && !formData.targetNexonId.trim()) {
        return false;
      } else if (formData.tipoDesativacao === 'marca' && !formData.marcaID) {
        return false;
      }
    }
    
    return true;
  }, [formData]);

  const getConfirmDescription = useCallback(() => {
    if (formData.acao === 'A') {
      const marcaNome = MARCAS_BATALHA.find(m => m.id.toString() === formData.marcaID)?.nome || '';
      return `Tem certeza que deseja ATIVAR a marca de batalha "${marcaNome}" para o jogador ${formData.targetNexonId}?`;
    } else if (formData.acao === 'D') {
      if (formData.tipoDesativacao === 'usuario') {
        return `Tem certeza que deseja DESATIVAR a marca de batalha do jogador ${formData.targetNexonId}?`;
      } else if (formData.tipoDesativacao === 'marca') {
        const marcaNome = MARCAS_BATALHA.find(m => m.id.toString() === formData.marcaID)?.nome || '';
        return `Tem certeza que deseja DESATIVAR a marca de batalha "${marcaNome}" de TODOS os jogadores que a possuem?`;
      }
    }
    return '';
  }, [formData]);

  return (
    <ActionFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="GERENCIAR MARCA DE BATALHA"
      confirmTitle="Confirmar Ação"
      confirmDescription={getConfirmDescription()}
      confirmActionText={formData.acao === 'A' ? 'Sim, Ativar Marca' : 'Sim, Desativar Marca'}
      action={handleMarcaDeBatalhaAction}
      formData={formData}
      onFormDataChange={setFormData}
      requiresPlayerValidation={false}
      showPlayerFields={false}
      customValidation={customValidation}
      customValidationMessage="Por favor, preencha todos os campos corretamente."
    >
      <MarcaDeBatalhaFormFields />
    </ActionFormModal>
  );
};

export default MarcaDeBatalha;