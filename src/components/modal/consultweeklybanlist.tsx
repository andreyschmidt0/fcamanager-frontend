import React from 'react';
import BaseModal from '../common/BaseModal';
import BanListComponent from '../banlist/BanListComponent';

interface ConsultWeeklyBanListProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConsultWeeklyBanList: React.FC<ConsultWeeklyBanListProps> = ({ isOpen, onClose }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Consultar Lista de Banimentos Semanal" maxWidth="2xl">
      <BanListComponent />
    </BaseModal>
  );
};

export default ConsultWeeklyBanList;
