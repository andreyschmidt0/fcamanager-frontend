import React from 'react';
import { Calendar, User, CheckCircle, Clock, XCircle } from 'lucide-react';

interface RequestTimelineProps {
  request: any;
}

const RequestTimeline: React.FC<RequestTimelineProps> = ({ request }) => {
  if (!request) return null;

  const isRejected = request.status === 'rejeitado';

  const steps = [
    {
      id: 1,
      title: 'Solicitação Criada',
      date: request.data_solicitacao,
      user: request.solicitante_nickname,
      status: 'completed',
      icon: Calendar,
      description: `Criado por ${request.solicitante_nickname}`
    },
    {
      id: 2,
      title: 'Validação (Master)',
      date: request.data_aprovacao,
      user: request.aprovador_oiduser ? `OID: ${request.aprovador_oiduser}` : null,
      status: isRejected ? 'rejected' : (request.data_aprovacao ? 'completed' : 'pending'),
      icon: isRejected ? XCircle : (request.data_aprovacao ? CheckCircle : Clock),
      description: isRejected ? `Rejeitado: ${request.motivo_rejeicao}` :
                   (request.data_aprovacao ? 'Aprovado no Test Server' : 'Aguardando aprovação no Test Server')
    },
    {
      id: 3,
      title: 'Envio para Produção',
      date: request.data_envio_producao,
      user: request.executor_producao_oiduser ? `OID: ${request.executor_producao_oiduser}` : null,
      status: request.data_envio_producao ? 'completed' :
              (isRejected ? 'pending' :
              (request.status === 'aguardando_producao' ? 'current' : 'pending')),
      icon: CheckCircle,
      description: isRejected ? 'Processo interrompido' : 'Envio para o servidor de Produção'
    }
  ];

  return (
    <div className="w-full py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
        {/* Linha de conexão (Desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-700 -z-10 transform -translate-y-1/2" />

        {steps.map((step) => {
          let statusColor = 'bg-gray-700 border-gray-600 text-gray-400';
          let iconColor = 'text-gray-400';

          if (step.status === 'completed') {
            statusColor = 'bg-green-900/50 border-green-500 text-white';
            iconColor = 'text-green-400';
          } else if (step.status === 'current') {
            statusColor = 'bg-yellow-900/50 border-yellow-500 text-white';
            iconColor = 'text-yellow-400';
          } else if (step.status === 'rejected') {
            statusColor = 'bg-red-900/50 border-red-500 text-white';
            iconColor = 'text-red-400';
          }

          return (
            <div key={step.id} className="flex flex-col items-center w-full md:w-1/3 relative p-2">
              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mb-3 bg-[#1d1e24] z-10 ${statusColor}`}>
                <step.icon size={20} className={iconColor} />
              </div>

              <div className="text-center">
                <h4 className={`font-bold text-sm mb-1 ${step.status === 'pending' ? 'text-gray-500' : 'text-white'}`}>
                  {step.title}
                </h4>
                {step.date && (
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mb-1">
                    <Clock size={10} />
                    <span>{new Date(step.date).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {step.user && (
                  <div className="flex items-center justify-center gap-1 text-xs text-blue-400 mb-1">
                    <User size={10} />
                    <span>{step.user}</span>
                  </div>
                )}
                {step.description && (
                  <p className="text-[10px] text-gray-500 max-w-[150px] mx-auto leading-tight">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestTimeline;
