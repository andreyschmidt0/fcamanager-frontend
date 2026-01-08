import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Eye, Check, X, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import apiService from '../services/api-tauri.service';
import EditRejectedGachaponBox from './modal/editrejectedgachaponbox';
import RequestTimeline from './common/RequestTimeline';

interface PendingRequest {
  id: number;
  solicitante_oiduser: number;
  solicitante_nickname: string;
  solicitante_discord: string;
  tipo_caixa: string;
  gachapon_itemno: number;
  gachapon_name: string;
  config_json: string;
  status: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  motivo_rejeicao?: string;
}

const AtividadesPendentes: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [showAllInserts, setShowAllInserts] = useState(false);

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('ESTE_MES');
  const [selectedStatus, setSelectedStatus] = useState('TODOS');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Filter options
  const periods = [
    { value: 'HOJE', label: 'Hoje' },
    { value: 'ONTEM', label: 'Ontem' },
    { value: 'ULTIMOS_7_DIAS', label: 'Últimos 7 dias' },
    { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 dias' },
    { value: 'ESTA_SEMANA', label: 'Esta semana' },
    { value: 'ESTE_MES', label: 'Este mês' },
    { value: 'ESTE_ANO', label: 'Este ano' }
  ];

  const statuses = [
    { value: 'TODOS', label: 'Todos Status' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'aguardando_producao', label: 'Aguardando Produção' },
    { value: 'aprovado', label: 'Aprovadas' },
    { value: 'rejeitado', label: 'Rejeitadas' },
    { value: 'revertido', label: 'Revertidas' }
  ];

  // Verificar se é Master (oidUser = 2)
  const isMaster = user?.id === 2;

  // Ref para detectar cliques fora dos dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowPeriodDropdown(false);
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dropdown toggle handlers - Ensures only one dropdown is open at a time
  const handleTogglePeriodDropdown = () => {
    setShowPeriodDropdown((prev) => {
      if (!prev) setShowStatusDropdown(false);
      return !prev;
    });
  };

  const handleToggleStatusDropdown = () => {
    setShowStatusDropdown((prev) => {
      if (!prev) setShowPeriodDropdown(false);
      return !prev;
    });
  };

  useEffect(() => {
    // Aguardar user carregar antes de fazer qualquer fetch
    if (!user) return;

    if (isMaster) {
      fetchRequests();
    } else {
      fetchMyRequests();
    }
  }, [isMaster, user]);

  // Refetch quando os filtros mudarem (apenas para não-Master)
  useEffect(() => {
    if (!isMaster && user) {
      const timeout = setTimeout(() => {
        fetchMyRequests();
      }, 300); // Debounce de 300ms

      return () => clearTimeout(timeout);
    }
  }, [selectedPeriod, selectedStatus]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.getPendingGachaponRequests();
      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        console.error('[AtividadesPendentes] Erro na resposta:', result.error);
        setError(result.error || 'Erro ao carregar solicitações');
      }
    } catch (err) {
      console.error('[AtividadesPendentes] Erro ao carregar:', err);
      setError('Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setIsLoading(true);
    setError('');

    try {

      const result = await apiService.getMyGachaponRequests(
        selectedStatus === 'TODOS' ? undefined : selectedStatus,
        selectedPeriod
      );


      if (result.success && result.data) {
        setRequests(result.data);
      } else {
        console.error('[AtividadesPendentes] Erro na resposta:', result.error);
        setError(result.error || 'Erro ao carregar suas solicitações');
      }
    } catch (err) {
      console.error('[AtividadesPendentes] Erro ao carregar:', err);
      setError('Erro ao carregar suas solicitações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowApproveModal = (request: PendingRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest) return;

    try {
      const result = await apiService.approveGachaponRequest(selectedRequest.id);

      if (result.success) {
        setShowApproveModal(false);
        setSelectedRequest(null);
        setShowAllInserts(false);
        fetchRequests(); // Recarregar lista
      } else {
        setError(result.error || 'Erro ao aprovar');
      }
    } catch (err) {
      setError('Erro ao aprovar');
      console.error(err);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      setError('Motivo de rejeição é obrigatório');
      return;
    }

    try {
      const result = await apiService.rejectGachaponRequest(selectedRequest.id, rejectReason);

      if (result.success) {
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedRequest(null);
        fetchRequests(); // Recarregar lista
      } else {
        setError(result.error || 'Erro ao rejeitar');
      }
    } catch (err) {
      setError('Erro ao rejeitar');
      console.error(err);
    }
  };

  const handleShowDetails = (request: PendingRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleShowRejectModal = (request: PendingRequest) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  if (!isMaster) {
    // Requests já vêm filtrados do backend
    const pendingRequests = requests.filter(r => r.status === 'pendente');
    const approvedRequests = requests.filter(r => r.status === 'aprovado');
    const rejectedRequests = requests.filter(r => r.status === 'rejeitado');

    return (
      <div className="bg-[#1d1e24] rounded-lg border border-black flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-black flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-neofara font-medium">MINHAS SOLICITAÇÕES</h2>
            <div ref={dropdownRef} className="flex items-center gap-3">
              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={handleToggleStatusDropdown}
                  className="flex items-center border border-black gap-2 bg-[#111216] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className="hidden sm:inline">
                    {statuses.find(s => s.value === selectedStatus)?.label || selectedStatus}
                  </span>
                  <span className="sm:hidden">
                    Status
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-[#111216] rounded-lg shadow-lg z-10">
                    {statuses.map((status) => (
                      <button
                        key={status.value}
                        onClick={() => {
                          setSelectedStatus(status.value);
                          setShowStatusDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Period Filter */}
              <div className="relative">
                <button
                  onClick={handleTogglePeriodDropdown}
                  className="flex items-center border border-black gap-2 bg-[#111216] px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-gray-700 transition-colors"
                >
                  <span className="hidden sm:inline">
                    {periods.find(p => p.value === selectedPeriod)?.label || selectedPeriod}
                  </span>
                  <span className="sm:hidden">
                    {selectedPeriod === 'ESTA_SEMANA'
                      ? 'Semana'
                      : selectedPeriod === 'ESTE_MES'
                      ? 'Mês'
                      : selectedPeriod === 'ESTE_ANO'
                      ? 'Ano'
                      : selectedPeriod === 'HOJE'
                      ? 'Hoje'
                      : '7 dias'}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                  />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-[#111216] rounded-lg shadow-lg z-10">
                    {periods.map((period) => (
                      <button
                        key={period.value}
                        onClick={() => {
                          setSelectedPeriod(period.value);
                          setShowPeriodDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchMyRequests}
                disabled={isLoading}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title="Atualizar solicitações"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <p className="text-yellow-400">{pendingRequests.length} aguardando aprovação</p>
            <p className="text-green-400">{approvedRequests.length} aprovadas</p>
            <p className="text-red-400">{rejectedRequests.length} rejeitadas</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 p-4 overflow-hidden">
          <div className="h-full overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                <p className="text-sm">Carregando...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm">Você ainda não tem solicitações de caixas</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar space-y-4">
                {/* Solicitações Rejeitadas */}
                {rejectedRequests.length > 0 && (
                  <div>
                    <h3 className="text-red-400 font-semibold text-sm mb-2">REJEITADAS ({rejectedRequests.length})</h3>
                    <div className="space-y-2">
                    {rejectedRequests.map((request) => {
                      let config;
                      let parseError = false;
                      try {
                        config = JSON.parse(request.config_json);
                      } catch (err) {
                        parseError = true;
                      }

                      if (parseError) {
                        return (
                          <div key={request.id} className="bg-red-900/20 border border-red-500 p-4 rounded-lg space-y-2">
                            <p className="text-red-400 font-bold">ERRO DE DADOS (JSON Corrompido)</p>
                            <p className="text-white text-sm">ID: {request.id} | {request.gachapon_name}</p>
                            <p className="text-xs text-gray-400">Esta solicitação contém dados inválidos e não pode ser exibida ou editada.</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={request.id}
                          className="bg-[#111216] border border-black p-4 rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">{request.gachapon_name}</p>
                              <p className="text-sm text-gray-400">
                                GachaponItemNo: {request.gachapon_itemno} | Tipo: {request.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Data: {new Date(request.data_solicitacao).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          {/* Motivo da Rejeição */}
                          <div className="bg-red-950 border border-red-600 p-3 rounded">
                            <p className="text-red-300 font-semibold text-xs mb-1">MOTIVO DA REJEIÇÃO:</p>
                            <p className="text-red-200 text-sm">{request.motivo_rejeicao}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">{config.items.length} itens configurados</span>
                              <span className="text-gray-600">|</span>
                              <span className={config.totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}>
                                Total: {(config.totalPercentage / 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowEditModal(true);
                                }}
                                className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                <Edit size={16} />
                                EDITAR
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowDetailsModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
                              >
                                DETALHES
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}

                {/* Solicitações Pendentes */}
                {pendingRequests.length > 0 && (
                  <div>
                    <h3 className="text-yellow-400 font-semibold text-sm mb-2">AGUARDANDO APROVAÇÃO ({pendingRequests.length})</h3>
                    <div className="space-y-2">
                    {pendingRequests.map((request) => {
                      let config;
                      let parseError = false;
                      try {
                        config = JSON.parse(request.config_json);
                      } catch (err) {
                        parseError = true;
                      }

                      if (parseError) {
                        return (
                          <div key={request.id} className="bg-red-900/20 border border-red-500 p-4 rounded-lg space-y-2">
                            <p className="text-red-400 font-bold">ERRO DE DADOS (JSON Corrompido)</p>
                            <p className="text-white text-sm">ID: {request.id} | {request.gachapon_name}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={request.id}
                          className="bg-[#111216] border border-black p-4 rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">{request.gachapon_name}</p>
                              <p className="text-sm text-gray-400">
                                GachaponItemNo: {request.gachapon_itemno} | Tipo: {request.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Data: {new Date(request.data_solicitacao).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{config.items.length} itens configurados</span>
                            <span className="text-gray-600">|</span>
                            <span className={config.totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}>
                              Total: {(config.totalPercentage / 100).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}

                {/* Solicitações Aprovadas */}
                {approvedRequests.length > 0 && (
                  <div>
                    <h3 className="text-green-400 font-semibold text-sm mb-2">APROVADAS ({approvedRequests.length})</h3>
                    <div className="space-y-2">
                    {approvedRequests.map((request) => {
                      let config;
                      let parseError = false;
                      try {
                        config = JSON.parse(request.config_json);
                      } catch (err) {
                        parseError = true;
                      }

                      if (parseError) {
                        return (
                          <div key={request.id} className="bg-red-900/20 border border-red-500 p-4 rounded-lg space-y-2">
                            <p className="text-red-400 font-bold">ERRO DE DADOS (JSON Corrompido)</p>
                            <p className="text-white text-sm">ID: {request.id} | {request.gachapon_name}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={request.id}
                          className="bg-green-900/20 border border-green-600 p-4 rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-white font-medium">{request.gachapon_name}</p>
                              <p className="text-sm text-gray-400">
                                GachaponItemNo: {request.gachapon_itemno} | Tipo: {request.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Solicitada: {new Date(request.data_solicitacao).toLocaleString('pt-BR')}
                              </p>
                              {request.data_aprovacao && (
                                <p className="text-xs text-green-400 mt-1">
                                  Aprovada: {new Date(request.data_aprovacao).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-400">{config.items.length} itens configurados</span>
                              <span className="text-gray-600">|</span>
                              <span className={config.totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}>
                                Total: {(config.totalPercentage / 100).toFixed(2)}%
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailsModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded text-sm font-medium transition-colors"
                            >
                              DETALHES
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de Detalhes */}
        {showDetailsModal && selectedRequest && (() => {
          let config;
          try {
            config = JSON.parse(selectedRequest.config_json);
          } catch (err) {
            return null;
          }

          return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-[#111216] z-10 flex items-center justify-between p-6 border-b border-gray">
                  <div>
                    <h3 className="text-2xl font-bold text-white">Detalhes da Solicitação</h3>
                    <p className="text-sm text-gray-400 mt-1">{selectedRequest.gachapon_name}</p>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                  {/* Timeline */}
                  <RequestTimeline request={selectedRequest} />

                  {/* Info da Caixa */}
                  <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                    <h4 className="text-white font-bold mb-3">Informações da Caixa</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Nome:</span>
                        <p className="text-white font-medium">{selectedRequest.gachapon_name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">ItemNo:</span>
                        <p className="text-white font-medium">{selectedRequest.gachapon_itemno}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Tipo:</span>
                        <p className="text-white font-medium">
                          {selectedRequest.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Total de Itens:</span>
                        <p className="text-white font-medium">{config.items.length}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Porcentagem Total:</span>
                        <p className={config.totalPercentage === 10000 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                          {(config.totalPercentage / 100).toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Status:</span>
                        <p className={
                          selectedRequest.status === 'pendente' ? 'text-yellow-400 font-bold' :
                          selectedRequest.status === 'aprovado' ? 'text-green-400 font-bold' :
                          'text-red-400 font-bold'
                        }>
                          {selectedRequest.status === 'pendente' ? 'AGUARDANDO' :
                           selectedRequest.status === 'aprovado' ? 'APROVADA' : 'REJEITADA'}
                        </p>
                      </div>
                    </div>

                    {/* Contagens adicionais */}
                    <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">Quantidade de Itens Distintos:</span>
                        <p className="text-white font-medium">
                          {(() => {
                            const isItemBox = selectedRequest.tipo_caixa === 'item';
                            const uniqueItems = new Set();
                            config.items.forEach((item: any) => {
                              if (isItemBox) {
                                uniqueItems.add(item.itemNo);
                              } else {
                                // Para caixas de produto, contar ItemNo00 distintos
                                if (item.itemNo00) {
                                  uniqueItems.add(item.itemNo00);
                                }
                              }
                            });
                            return uniqueItems.size;
                          })()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400">Itens por Período:</span>
                        <div className="text-white font-medium space-y-1">
                          {(() => {
                            // Agrupa por período e soma as porcentagens
                            const periodData: { [key: number]: { count: number; totalPercentage: number } } = {};

                            config.items.forEach((item: any) => {
                              const period = item.period || 0;
                              const itemPercentage = item.percentage || 0; // Já está em base 10000 (100% = 10000)

                              if (!periodData[period]) {
                                periodData[period] = { count: 0, totalPercentage: 0 };
                              }

                              periodData[period].count++;
                              periodData[period].totalPercentage += itemPercentage;
                            });

                            return Object.entries(periodData)
                              .sort(([a], [b]) => Number(a) - Number(b))
                              .map(([period, data]) => {
                                // Converter de base 10000 para porcentagem real (10000 = 100%)
                                const realPercentage = (data.totalPercentage / 100).toFixed(2);
                                return (
                                  <p key={period} className="text-xs">
                                    {period} dia(s): {data.count} <span className="text-gray-400">({realPercentage}%)</span>
                                  </p>
                                );
                              });
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Motivo da rejeição se houver */}
                    {selectedRequest.status === 'rejeitado' && selectedRequest.motivo_rejeicao && (
                      <div className="mt-4 bg-red-950 border border-red-600 p-3 rounded">
                        <p className="text-red-300 font-semibold text-xs mb-1">MOTIVO DA REJEIÇÃO:</p>
                        <p className="text-red-200 text-sm">{selectedRequest.motivo_rejeicao}</p>
                      </div>
                    )}
                  </div>

                  {/* Comparação ANTES vs DEPOIS - Mostra apenas as mudanças */}
                  {config.previousConfig && config.previousConfig.length > 0 && (() => {
                    const oldItems = config.previousConfig;
                    const newItems = config.items;

                    // Função para criar chave única do item
                    const getItemKey = (item: any) =>
                      `${selectedRequest.tipo_caixa === 'item' ? item.itemNo : item.productID}_${item.period}_${item.consumeType}`;

                    // Mapear itens antigos e novos
                    const oldItemsMap = new Map(oldItems.map((item: any) => [getItemKey(item), item]));
                    const newItemsMap = new Map(newItems.map((item: any) => [getItemKey(item), item]));

                    // Detectar mudanças
                    const removed = oldItems.filter((item: any) => !newItemsMap.has(getItemKey(item)));
                    const added = newItems.filter((item: any) => !oldItemsMap.has(getItemKey(item)));
                    const modified = newItems.filter((newItem: any) => {
                      const key = getItemKey(newItem);
                      const oldItem = oldItemsMap.get(key) as any;
                      return oldItem && oldItem.percentage !== newItem.percentage;
                    });

                    const hasChanges = removed.length > 0 || added.length > 0 || modified.length > 0;

                    if (!hasChanges) {
                      return (
                        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 text-center">
                          <p className="text-blue-400 font-medium">Nenhuma alteração detectada</p>
                          <p className="text-sm text-gray-400 mt-1">A configuração permanece a mesma</p>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                        <h4 className="text-white font-bold mb-3">Alterações Detectadas</h4>
                        <div className="space-y-3">
                          {/* Itens Removidos */}
                          {removed.length > 0 && (
                            <div className="bg-[#111216] border border-black p-3 rounded">
                              <h5 className="text-red-400 font-bold text-sm mb-2">Removidos ({removed.length})</h5>
                              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {removed.map((item: any, index: number) => (
                                  <div key={index} className="bg-[#1d1e24] p-2 rounded border border-black text-xs">
                                    <p className="text-white font-medium">{item.name}</p>
                                    <div className="flex items-center justify-between mt-1 text-gray-400">
                                      <span>{item.period}d • CT:{item.consumeType}</span>
                                      <span className="text-red-400 font-bold">{(item.percentage / 100).toFixed(2)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Itens Adicionados */}
                          {added.length > 0 && (
                            <div className="bg-[#111216] border border-black p-3 rounded">
                              <h5 className="text-green-400 font-bold text-sm mb-2">Adicionados ({added.length})</h5>
                              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                                {added.map((item: any, index: number) => (
                                  <div key={index} className="bg-[#1d1e24] p-2 rounded border border-black text-xs">
                                    <p className="text-white font-medium">{item.name}</p>
                                    <div className="flex items-center justify-between mt-1 text-gray-400">
                                      <span>{item.period}d • CT:{item.consumeType}</span>
                                      <span className="text-green-400 font-bold">{(item.percentage / 100).toFixed(2)}%</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Porcentagens Modificadas */}
                          {modified.length > 0 && (
                            <div className="bg-yellow-900/30 border border-yellow-600 p-3 rounded">
                              <h5 className="text-yellow-400 font-bold text-sm mb-2">📝 Porcentagem Alterada ({modified.length})</h5>
                              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                {modified.map((newItem: any, index: number) => {
                                  const oldItem = oldItemsMap.get(getItemKey(newItem)) as any;
                                  return (
                                    <div key={index} className="bg-black/30 p-2 rounded border border-yellow-800 text-xs">
                                      <p className="text-white font-medium">{newItem.name}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-gray-400">{newItem.period}d • CT:{newItem.consumeType}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-red-400 line-through">{(oldItem.percentage / 100).toFixed(2)}%</span>
                                          <span className="text-gray-500">→</span>
                                          <span className="text-green-400 font-bold">{(newItem.percentage / 100).toFixed(2)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Lista de Itens Detalhada */}
                  <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                    <h4 className="text-white font-bold mb-3">Nova Configuração - Detalhes ({config.items.length})</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {config.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="bg-[#111216] p-3 rounded border border-black hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-white font-medium">{item.name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>{selectedRequest.tipo_caixa === 'item' ? `Item #${item.itemNo}` : `Produto #${item.productID}`}</span>
                                <span>•</span>
                                <span>{item.period} dia(s)</span>
                                <span>•</span>
                                <span>ConsumeType: {item.consumeType}</span>
                                {item.broadcast && (
                                  <>
                                    <span>•</span>
                                    <span className="text-yellow-400">📢 Broadcast</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-white font-bold text-lg">
                                {(item.percentage / 100).toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-[#111216] p-6 border-t border-gray-600 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-medium transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Modal de Edição de Solicitação Rejeitada */}
        {showEditModal && selectedRequest && (
          <EditRejectedGachaponBox
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedRequest(null);
            }}
            request={selectedRequest}
            onSuccess={() => {
              fetchMyRequests();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1d1e24] rounded-lg border border-black flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-black flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-neofara font-medium">SOLICITAÇÕES PENDENTES</h2>
          <div className="flex items-center gap-2">
            {/* Filtros */}
            <div className="relative">
              <button
                onClick={handleToggleStatusDropdown}
                className="flex items-center border border-black gap-2 bg-[#111216] px-3 py-1.5 rounded-lg text-xs hover:bg-gray-700 transition-colors"
              >
                {statuses.find(s => s.value === selectedStatus)?.label || selectedStatus}
                <ChevronDown size={16} className={showStatusDropdown ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {showStatusDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#111216] border border-black rounded-lg shadow-lg z-50">
                  {statuses.map((status) => (
                    <button
                      key={status.value}
                      onClick={() => {
                        setSelectedStatus(status.value);
                        setShowStatusDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Atualizar solicitações"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {requests.length} solicitação(ões)
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-4 overflow-hidden">
        <div className="h-full overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
              <p className="text-sm">Carregando...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (() => {
            // Filtrar requests baseado no selectedStatus
            const filteredRequests = selectedStatus === 'TODOS'
              ? requests
              : requests.filter(r => r.status === selectedStatus);

            return filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm">Nenhuma solicitação encontrada</p>
              </div>
            ) : (
              <div className="h-full overflow-y-auto custom-scrollbar space-y-3">
                {filteredRequests.map((request) => {
                let config;
                let parseError = false;
                try {
                  config = JSON.parse(request.config_json);
                } catch (err) {
                  parseError = true;
                }

                if (parseError) {
                  return (
                    <div key={request.id} className="bg-red-900/20 border border-red-500 p-4 rounded-lg space-y-2">
                      <p className="text-red-400 font-bold">ERRO DE DADOS (JSON Corrompido)</p>
                      <p className="text-white text-sm">ID: {request.id} | {request.gachapon_name}</p>
                      <p className="text-xs text-gray-400">Esta solicitação contém dados inválidos e não pode ser exibida ou aprovada.</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={request.id}
                    className="bg-[#111216] p-4 rounded-lg space-y-3 hover:bg-[#252631] transition-colors border border-gray-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">{request.gachapon_name}</p>
                          {request.status === 'aguardando_producao' && (
                            <span className="px-2 py-0.5 text-xs bg-purple-600/30 border border-purple-500 text-purple-300 rounded">
                              Aguardando Produção
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          GachaponItemNo: {request.gachapon_itemno} | Tipo: {request.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Solicitante: {request.solicitante_nickname} ({request.solicitante_discord})
                        </p>
                        <p className="text-xs text-gray-500">
                          Data: {new Date(request.data_solicitacao).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">{config.items.length} itens configurados</span>
                      <span className="text-gray-600">|</span>
                      <span className={config.totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}>
                        Total: {(config.totalPercentage / 100).toFixed(2)}%
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShowDetails(request)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        Ver Detalhes
                      </button>

                      {/* Botões baseados no status */}
                      {request.status === 'pendente' && (
                        <>
                          <button
                            onClick={() => handleShowApproveModal(request)}
                            className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Check size={16} />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleShowRejectModal(request)}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <X size={16} />
                            Rejeitar
                          </button>
                        </>
                      )}

                      {request.status === 'aguardando_producao' && (
                        <>
                          <button
                            onClick={async () => {
                              if (confirm('Enviar alterações para PRODUÇÃO? Esta ação não pode ser desfeita automaticamente.')) {
                                const result = await apiService.sendGachaponToProduction(request.id);
                                if (result.success) {
                                  fetchRequests();
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            Enviar p/ Produção
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('Reverter alterações para o estado original?')) {
                                const result = await apiService.revertGachaponChanges(request.id);
                                if (result.success) {
                                  fetchRequests();
                                }
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            ↩️ Reverter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (() => {
        const config = JSON.parse(selectedRequest.config_json);
        const previousConfig = config.previousConfig || [];
        const newItems = config.items || [];
        const isItemBox = selectedRequest.tipo_caixa === 'item';

        // Função para criar chave única do item (ItemNo/ProductID + Period + ConsumeType)
        const getItemKey = (item: any) => {
          const idField = isItemBox ? item.itemNo : item.productID;
          return `${idField}_${item.period}_${item.consumeType}`;
        };

        // Função para comparar itens
        const compareConfigs = () => {
          const results: any[] = [];
          const processedKeys = new Set();

          // Mapear configuração antiga por chave
          const oldItemsMap = new Map(previousConfig.map((item: any) => [getItemKey(item), item]));

          // Verificar itens novos e modificados
          newItems.forEach((newItem: any) => {
            const key = getItemKey(newItem);
            processedKeys.add(key);

            const oldItem = oldItemsMap.get(key) as any;

            if (!oldItem) {
              // Item adicionado (nova combinação de ItemNo + Period + ConsumeType)
              results.push({ type: 'added', item: newItem, oldItem: null });
            } else {
              // Verificar se foi modificado (apenas percentage e broadcast podem mudar)
              const changes: string[] = [];
              if (oldItem.percentage !== newItem.percentage) changes.push('percentage');
              if (oldItem.broadcast !== newItem.broadcast) changes.push('broadcast');

              if (changes.length > 0) {
                results.push({ type: 'modified', item: newItem, oldItem, changes });
              } else {
                results.push({ type: 'unchanged', item: newItem, oldItem });
              }
            }
          });

          // Verificar itens removidos
          previousConfig.forEach((oldItem: any) => {
            const key = getItemKey(oldItem);
            if (!processedKeys.has(key)) {
              results.push({ type: 'removed', item: null, oldItem });
            }
          });

          return results;
        };

        const diff = compareConfigs();
        const added = diff.filter(d => d.type === 'added');
        const removed = diff.filter(d => d.type === 'removed');
        const modified = diff.filter(d => d.type === 'modified');
        const unchanged = diff.filter(d => d.type === 'unchanged');

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="sticky top-0 bg-[#111216] z-10 flex items-center justify-between p-6 border-b border-gray-600">
                <h3 className="text-2xl font-bold text-white">Detalhes da Solicitação</h3>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Timeline */}
                <RequestTimeline request={selectedRequest} />

                <div className="bg-[#1d1e24] p-4 rounded-lg">
                  <p className="text-white font-medium mb-2">{selectedRequest.gachapon_name}</p>
                  <p className="text-sm text-gray-400">GachaponItemNo: {selectedRequest.gachapon_itemno}</p>
                  <p className="text-sm text-gray-400">
                    Tipo: {selectedRequest.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                  </p>
                  <p className="text-sm text-gray-400">Solicitante: {selectedRequest.solicitante_nickname}</p>
                  <p className="text-sm text-gray-400">
                    Data: {new Date(selectedRequest.data_solicitacao).toLocaleString('pt-BR')}
                  </p>

                  {/* Contagens adicionais */}
                  <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                    <p className="text-sm text-gray-400">
                      Quantidade de Itens Distintos: <span className="text-white font-medium">
                        {(() => {
                          const uniqueItems = new Set();
                          config.items.forEach((item: any) => {
                            if (isItemBox) {
                              uniqueItems.add(item.itemNo);
                            } else {
                              // Para caixas de produto, contar todos os ProductIDs distintos
                              if (item.productID) {
                                uniqueItems.add(item.productID);
                              }
                            }
                          });
                          return uniqueItems.size;
                        })()}
                      </span>
                    </p>
                    <div className="text-sm text-gray-400">
                      {(() => {
                        // Agrupa por período e soma as porcentagens
                        const periodData: { [key: number]: { count: number; totalPercentage: number } } = {};

                        config.items.forEach((item: any) => {
                          const period = item.period || 0;
                          const itemPercentage = item.percentage || 0; // Já está em base 10000 (100% = 10000)

                          if (!periodData[period]) {
                            periodData[period] = { count: 0, totalPercentage: 0 };
                          }

                          periodData[period].count++;
                          periodData[period].totalPercentage += itemPercentage;
                        });

                        return Object.entries(periodData)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([period, data]) => {
                            // Converter de base 10000 para porcentagem real (10000 = 100%)
                            const realPercentage = (data.totalPercentage / 100).toFixed(2);
                            return (
                              <p key={period}>
                                Quantidade de Itens por {period} Dia(s): <span className="text-white font-medium">{data.count}</span> <span className="text-gray-500">({realPercentage}%)</span>
                              </p>
                            );
                          });
                      })()}
                    </div>
                  </div>
                </div>

                {/* Resumo de mudanças */}
                <div className="bg-[#1d1e24] p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-3">Resumo de Mudanças</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-green-900/30 border border-green-600 p-2 rounded">
                      <p className="text-green-400 font-medium">{added.length} Adicionados</p>
                    </div>
                    <div className="bg-red-900/30 border border-red-600 p-2 rounded">
                      <p className="text-red-400 font-medium">{removed.length} Removidos</p>
                    </div>
                    <div className="bg-yellow-900/30 border border-yellow-600 p-2 rounded">
                      <p className="text-yellow-400 font-medium">{modified.length} Modificados</p>
                    </div>
                    <div className="bg-gray-700/30 border border-gray-600 p-2 rounded">
                      <p className="text-gray-400 font-medium">{unchanged.length} Inalterados</p>
                    </div>
                  </div>
                </div>

                {/* Itens Adicionados */}
                {added.length > 0 && (
                  <details className="bg-[#1d1e24] p-3 rounded-lg">
                    <summary className="text-green-400 cursor-pointer font-semibold text-lg">
                      Itens Adicionados ({added.length})
                    </summary>
                    <div className="space-y-2 mt-3">
                      {added.map((d, index) => (
                        <div key={index} className="bg-green-900/20 border border-green-600 p-3 rounded-lg">
                          <p className="text-white font-medium">{d.item.name}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-300">
                            <p>{isItemBox ? `ItemNo: ${d.item.itemNo}` : `ProductID: ${d.item.productID}`}</p>
                            <p>Percentage: {d.item.percentageDisplay}%</p>
                            <p>Period: {d.item.period} dias</p>
                            <p>ConsumeType: {d.item.consumeType}</p>
                            <p>Broadcast: {d.item.broadcast ? 'Sim' : 'Não'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Itens Removidos */}
                {removed.length > 0 && (
                  <details className="bg-[#1d1e24] p-3 rounded-lg">
                    <summary className="text-red-400 cursor-pointer font-semibold text-lg">
                      ✗ Itens Removidos ({removed.length})
                    </summary>
                    <div className="space-y-2 mt-3">
                      {removed.map((d, index) => (
                        <div key={index} className="bg-red-900/20 border border-red-600 p-3 rounded-lg">
                          <p className="text-white font-medium line-through">{d.oldItem.name}</p>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-300">
                            <p>{isItemBox ? `ItemNo: ${d.oldItem.itemNo}` : `ProductID: ${d.oldItem.productID}`}</p>
                            <p>Percentage: {(d.oldItem.percentage / 100).toFixed(2)}%</p>
                            <p>Period: {d.oldItem.period} dias</p>
                            <p>ConsumeType: {d.oldItem.consumeType}</p>
                            <p>Broadcast: {d.oldItem.broadcast ? 'Sim' : 'Não'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Itens Modificados */}
                {modified.length > 0 && (
                  <details className="bg-[#1d1e24] p-3 rounded-lg">
                    <summary className="text-yellow-400 cursor-pointer font-semibold text-lg">
                      Itens Modificados ({modified.length})
                    </summary>
                    <div className="space-y-2 mt-3">
                      {modified.map((d, index) => (
                        <div key={index} className="bg-yellow-900/20 border border-yellow-600 p-3 rounded-lg">
                          <p className="text-white font-medium">{d.item.name}</p>
                          <div className="grid grid-cols-1 gap-2 mt-2 text-sm">
                            {d.changes.includes('percentage') && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Percentage:</span>
                                <span className="text-red-400 line-through">{(d.oldItem.percentage / 100).toFixed(2)}%</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-green-400 font-medium">{d.item.percentageDisplay}%</span>
                              </div>
                            )}
                            {d.changes.includes('period') && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Period:</span>
                                <span className="text-red-400 line-through">{d.oldItem.period} dias</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-green-400 font-medium">{d.item.period} dias</span>
                              </div>
                            )}
                            {d.changes.includes('broadcast') && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">Broadcast:</span>
                                <span className="text-red-400 line-through">{d.oldItem.broadcast ? 'Sim' : 'Não'}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-green-400 font-medium">{d.item.broadcast ? 'Sim' : 'Não'}</span>
                              </div>
                            )}
                            {!d.changes.includes('percentage') && (
                              <span className="text-gray-400 text-xs">Percentage: {d.item.percentageDisplay}%</span>
                            )}
                            {!d.changes.includes('period') && (
                              <span className="text-gray-400 text-xs">Period: {d.item.period} dias</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Itens Inalterados (colapsado por padrão) */}
                {unchanged.length > 0 && (
                  <details className="bg-[#1d1e24] p-3 rounded-lg">
                    <summary className="text-gray-400 cursor-pointer font-medium">
                      Itens Inalterados ({unchanged.length})
                    </summary>
                    <div className="space-y-2 mt-3">
                      {unchanged.map((d, index) => (
                        <div key={index} className="bg-[#252631] p-2 rounded text-sm text-gray-400">
                          <p>{d.item.name} - {d.item.percentageDisplay}%</p>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>

              <div className="flex gap-3 p-6 border-t border-gray-600">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedRequest(null);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (() => {
        let config;
        try {
          config = JSON.parse(selectedRequest.config_json);
        } catch (err) {
          return null;
        }

        const tableName = selectedRequest.tipo_caixa === 'item'
          ? 'CBT_ItemInfo_GachaponInfo_Item'
          : 'CBT_ItemInfo_GachaponInfo_Product';

        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="sticky top-0 bg-[#111216] z-10 flex items-center justify-between p-6 border-b border-gray-600">
                <div>
                  <h3 className="text-2xl font-bold text-white">Confirmar Aprovação</h3>
                </div>
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                    setShowAllInserts(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                {/* Informações da Caixa */}
                <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                  <h4 className="text-lg font-bold text-white mb-3">Informações da Caixa</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Nome:</span>
                      <span className="text-white ml-2 font-medium">{selectedRequest.gachapon_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">GachaponItemNo:</span>
                      <span className="text-white ml-2 font-medium">{selectedRequest.gachapon_itemno}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Tipo:</span>
                      <span className="text-white ml-2 font-medium">
                        {selectedRequest.tipo_caixa === 'item' ? 'Caixa de Itens' : 'Caixa de Produtos'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total de Itens:</span>
                      <span className="text-white ml-2 font-medium">{config.items.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Soma de %:</span>
                      <span className={`ml-2 font-medium ${config.totalPercentage === 10000 ? 'text-green-400' : 'text-red-400'}`}>
                        {(config.totalPercentage / 100).toFixed(2)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Solicitante:</span>
                      <span className="text-white ml-2 font-medium">{selectedRequest.solicitante_nickname}</span>
                    </div>
                  </div>
                </div>

                {/* Preview da Transação SQL */}
                <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                  <h4 className="text-lg font-bold text-yellow-400 mb-3">As seguintes transações serão realizadas!</h4>
                  <div className="space-y-3 text-xs font-mono">
                    <div className="bg-black/40 p-3 rounded border border-black">
                      <p className="text-red-400 font-bold mb-1">1. DELETE (Remover configuração antiga)</p>
                      <code className="text-gray-300">
                        DELETE FROM {tableName}<br />
                        WHERE GachaponItemNo = {selectedRequest.gachapon_itemno}
                      </code>
                    </div>

                    <div className="bg-black/40 p-3 rounded border border-black">
                      <p className="text-green-400 font-bold mb-1">2. INSERT (Inserir {config.items.length} novo(s) item(ns))</p>
                      <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        {(showAllInserts ? config.items : config.items.slice(0, 3)).map((item: any, index: number) => (
                          <div key={index} className="text-gray-300 mb-2 pb-2 border-b border-gray-700 last:border-0">
                            INSERT INTO {tableName}<br />
                            VALUES ({selectedRequest.gachapon_itemno}, {item.percentage}, {item.itemNo || item.productID}, {item.consumeType}, {item.period}, {item.broadcast ? 1 : 0})
                          </div>
                        ))}
                      </div>
                      {config.items.length > 3 && (
                        <button
                          onClick={() => setShowAllInserts(!showAllInserts)}
                          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#1d1e24] hover:bg-[#252631] border border-black text-gray-300 rounded transition-colors text-sm font-medium"
                        >
                          {showAllInserts ? (
                            <>
                              <ChevronUp size={16} />
                              Ocultar {config.items.length - 3} INSERTs
                            </>
                          ) : (
                            <>
                              <ChevronDown size={16} />
                              Mostrar mais {config.items.length - 3} INSERTs
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="bg-black/40 p-3 rounded border border-black">
                      <p className="text-blue-400 font-bold mb-1">3. UPDATE (Marcar solicitação como aprovada)</p>
                      <code className="text-gray-300">
                        UPDATE BST_GachaponRequests<br />
                        SET status = 'aprovado', aprovador_oiduser = {user?.id}, data_aprovacao = GETDATE()<br />
                        WHERE id = {selectedRequest.id}
                      </code>
                    </div>

                    <div className="bg-black/40 p-3 rounded border border-black">
                      <p className="text-purple-400 font-bold mb-1">4. LOG (Registrar no audit log)</p>
                      <code className="text-gray-300">
                        INSERT INTO BST_AdminActionLog<br />
                        (ExecutorOidUser, SourceProcedure, ActionType, TargetInfo, Notes)
                      </code>
                    </div>
                  </div>
                </div>

                {/* Lista de Itens Configurados */}
                <div className="bg-[#1d1e24] p-4 rounded-lg border border-black">
                  <h4 className="text-lg font-bold text-white mb-3">Itens que serão configurados ({config.items.length})</h4>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                    {config.items.map((item: any, index: number) => (
                      <div key={index} className="bg-black/40 p-3 rounded flex justify-between items-center">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-xs text-gray-400">
                            {selectedRequest.tipo_caixa === 'item' ? `ItemNo: ${item.itemNo}` : `ProductID: ${item.productID}`}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-green-400">{(item.percentage / 100).toFixed(2)}%</p>
                          <p className="text-gray-400 text-xs">{item.period === 999 ? 'Permanente' : `${item.period} dias`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-[#111216] flex gap-3 p-6 border-t border-gray-600">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setSelectedRequest(null);
                    setShowAllInserts(false);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmApprove}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Confirmar Aprovação e Executar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111216] rounded-lg shadow-2xl w-full max-w-lg">
            <div className="sticky top-0 bg-[#111216] z-10 flex items-center justify-between p-6 border-b border-gray-600">
              <h3 className="text-2xl font-bold text-white">Rejeitar Solicitação</h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-white">Caixa: {selectedRequest.gachapon_name}</p>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Motivo da Rejeição</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  placeholder="Digite o motivo..."
                  className="w-full px-3 py-2 bg-[#1d1e24] text-white rounded-lg focus:border-red-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-600">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Solicitação Rejeitada */}
      {showEditModal && selectedRequest && (
        <EditRejectedGachaponBox
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
          onSuccess={() => {
            if (isMaster) {
              fetchRequests();
            } else {
              fetchMyRequests();
            }
          }}
        />
      )}
    </div>
  );
};

export default AtividadesPendentes;
