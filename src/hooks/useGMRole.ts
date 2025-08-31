import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiService from '../services/api-tauri.service';

export const useGMRole = () => {
  const { user } = useAuth();
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGMRole = async () => {
      if (!user?.profile?.nickname) {
        setIsMaster(false);
        setLoading(false);
        return;
      }

      try {
        // Buscar informações do usuário no sistema GM
        const profileData = await apiService.getPlayerProfile(user.profile.nickname);
        if (!profileData) {
          setIsMaster(false);
          setLoading(false);
          return;
        }
        const discordId = profileData.strDiscordID;
        
        if (!discordId) {
          setIsMaster(false);
          setLoading(false);
          return;
        }

        // Verificar o role no banco PostgreSQL
        const gmData = await apiService.getGMUser(discordId);
        setIsMaster(gmData.success && gmData.gm?.role === 'MASTER');
      } catch (error) {
        console.error('Erro ao verificar role do GM:', error);
        setIsMaster(false);
      } finally {
        setLoading(false);
      }
    };

    checkGMRole();
  }, [user]);

  return { isMaster, loading };
};