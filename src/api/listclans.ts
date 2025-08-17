import axios from 'axios';

export interface Clans {
    DiscordID_Lider: string;
    oidUser_Lider: number;
    Lider: string;
    nm_clan: string;
    qt_membros: number;
    oidGuild: number;
}

const listClans = async (clanname: string = '', page: number = 1): Promise<Clans[]> => {
    try {
        const params = new URLSearchParams({
            page: page.toString()
        });
        
        if (clanname.trim()) {
            params.append('clanname', clanname.trim());
        }
        
        const response = await axios.get(`https://game-stats-e908.onrender.com/api/clans?${params}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar clans:', error);
        throw error;
    }
};

export default listClans;