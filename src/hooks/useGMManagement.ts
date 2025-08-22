import { useState } from 'react';

export const useGMManagement = () => {
  const [isGMManagementOpen, setIsGMManagementOpen] = useState(false);

  const openGMManagement = () => setIsGMManagementOpen(true);
  const closeGMManagement = () => setIsGMManagementOpen(false);

  return {
    isGMManagementOpen,
    openGMManagement,
    closeGMManagement,
  };
};