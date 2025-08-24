import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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
        const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/users/profile/${encodeURIComponent(user.profile.nickname)}`);
        if (!profileResponse.ok) {
          setIsMaster(false);
          setLoading(false);
          return;
        }
        
        const profileData = await profileResponse.json();
        const discordId = profileData.strDiscordID;
        
        if (!discordId) {
          setIsMaster(false);
          setLoading(false);
          return;
        }

        // Verificar o role no SQLite
        const gmResponse = await fetch(`${import.meta.env.VITE_API_URL || 'https://fcamanager-backend.onrender.com/api'}/gm-management/user/${encodeURIComponent(discordId)}`);
        if (gmResponse.ok) {
          const gmData = await gmResponse.json();
          setIsMaster(gmData.success && gmData.gm?.role === 'MASTER');
        } else {
          setIsMaster(false);
        }
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