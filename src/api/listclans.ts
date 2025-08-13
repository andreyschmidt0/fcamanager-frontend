import axios from 'axios';

export interface Clan {
    DiscordID_Lider: string;
    oidUser_Lider: number;
    Lider: string;
    nm_clan: string;
    qt_membros: number;
}

const listClans = async (nickname: string = '', page: number = 1): Promise<Clan[]> => {
    try {
        const params = new URLSearchParams({
            page: page.toString()
        });
        
        if (nickname.trim()) {
            params.append('nickname', nickname.trim());
        }
        
        const response = await axios.get(`https://game-stats-e908.onrender.com/api/clans?${params}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar clans:', error);
        throw error;
    }
};

export default listClans;