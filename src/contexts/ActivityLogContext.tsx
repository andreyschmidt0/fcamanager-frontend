import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface ActivityLog {
  id: string;
  timestamp: Date;
  adminName: string;
  action: 'Enviar' | 'Banir' | 'Excluir' | 'Transferir' | 'Alterar';
  target: string;
  details: string;
  justification?: string;
  amount?: number; // Para transferências de cash/exp/etc
  period?: string; // Para banimentos (duração)
  amountType?: 'cash' | 'exp' | 'item'; // Tipo do amount
}

interface ActivityLogContextType {
  activities: ActivityLog[];
  addActivity: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  getActivitiesByPeriod: (period: string) => ActivityLog[];
  clearActivities: () => void;
}

const ActivityLogContext = createContext<ActivityLogContextType | undefined>(undefined);

interface ActivityLogProviderProps {
  children: ReactNode;
}

export const ActivityLogProvider: React.FC<ActivityLogProviderProps> = ({ children }) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const addActivity = (activityData: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLog = {
      ...activityData,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setActivities(prev => [newActivity, ...prev]);
  };

  const getActivitiesByPeriod = (period: string): ActivityLog[] => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'Hoje':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'Esta semana':
        const dayOfWeek = now.getDay();
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Segunda-feira como início da semana
        startDate = new Date(now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'Este mês':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'Este ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return activities;
    }

    return activities.filter(activity => activity.timestamp >= startDate);
  };

  const clearActivities = () => {
    setActivities([]);
  };

  return (
    <ActivityLogContext.Provider
      value={{
        activities,
        addActivity,
        getActivitiesByPeriod,
        clearActivities,
      }}
    >
      {children}
    </ActivityLogContext.Provider>
  );
};

export const useActivityLog = () => {
  const context = useContext(ActivityLogContext);
  if (context === undefined) {
    throw new Error('useActivityLog deve ser usado dentro de um ActivityLogProvider');
  }
  return context;
};

// Helper functions para criar logs específicos
export const createSendCashLog = (adminName: string, target: string, amount: number, justification?: string) => ({
  adminName,
  action: 'Enviar' as const,
  target,
  details: `Enviou ${amount} cash para`,
  justification,
  amount,
  amountType: 'cash' as const,
});

export const createBanLog = (adminName: string, target: string, period: string, justification?: string) => ({
  adminName,
  action: 'Banir' as const,
  target,
  details: `Baniu o jogador`,
  justification,
  period,
});

export const createDeleteLog = (adminName: string, target: string, justification?: string) => ({
  adminName,
  action: 'Excluir' as const,
  target,
  details: `Excluiu o jogador`,
  justification,
});

export const createTransferLog = (adminName: string, target: string, details: string, justification?: string) => ({
  adminName,
  action: 'Transferir' as const,
  target,
  details: `Transferiu ${details}`,
  justification,
});

export const createAlterLog = (adminName: string, target: string, details: string, justification?: string) => ({
  adminName,
  action: 'Alterar' as const,
  target,
  details: `Alterou ${details}`,
  justification,
});

export const createRemoveExpLog = (adminName: string, target: string, amount: number) => ({
  adminName,
  action: 'Enviar' as const,
  target,
  details: `Removeu ${amount} de exp de`,
  amount,
  amountType: 'exp' as const,
});

export const createSendItemLog = (adminName: string, target: string, quantity: number, productId: number) => ({
  adminName,
  action: 'Enviar' as const,
  target,
  productId,
  details: `Enviou ${quantity} ${productId} itens para`,
  amount: quantity,
  amountType: 'item' as const,
});

export const createUnbanLog = (adminName: string, target: string, justification?: string) => ({
  adminName,
  action: 'Alterar' as const,
  target,
  details: `Desbaniu o jogador`,
  justification,
});

export const createChangeNicknameLog = (adminName: string, target: string, newNickname: string, justification?: string) => ({
  adminName,
  action: 'Alterar' as const,
  target,
  details: `Alterou nickname para ${newNickname}`,
  justification,
});

export const createChangeEmailLog = (adminName: string, target: string, newEmail: string, justification?: string) => ({
  adminName,
  action: 'Alterar' as const,
  target,
  details: `Alterou email para ${newEmail}`,
  justification,
});

export const createRemoveClanLog = (adminName: string, target: string, justification?: string) => ({
  adminName,
  action: 'Alterar' as const,
  target,
  details: `Removeu o clan`,
  justification,
});