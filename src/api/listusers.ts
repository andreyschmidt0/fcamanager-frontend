import axios from 'axios';

export interface User {
    strDiscordID: string;
    NickName: string;
    ClanName: string | null;
    strNexonID: string;
}

const listUsers = async (nickname: string = '', page: number = 1): Promise<User[]> => {
    try {
        const params = new URLSearchParams({
            page: page.toString()
        });
        
        if (nickname.trim()) {
            params.append('nickname', nickname.trim());
        }
        
        const response = await axios.get(`https://game-stats-e908.onrender.com/api/users?${params}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
    }
};

export default listUsers;