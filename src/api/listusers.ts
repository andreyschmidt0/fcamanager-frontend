import axios from 'axios';

export interface User {
    strDiscordID: string;
    strNexonID: string;
    NickName: string;
    clanName: string | null;
    BanVigente: string;
    DataFimBan: string | null;
}

const listUsers = async (nickname: string = ''): Promise<User[]> => {
    try {
        const response = await axios.get(`https://game-stats-e908.onrender.com/api/ranking?nickname=${nickname}`);
        
        // Se a resposta for um array, retorna diretamente
        if (Array.isArray(response.data)) {
            return response.data;
        }
        
        // Se for um objeto único, transforma em array
        return [response.data];
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        throw error;
    }
};

// Nova função para buscar por Discord ID
const listUsersByDiscordId = async (discordId: string = ''): Promise<User[]> => {
    try {
        const response = await axios.get(`https://game-stats-e908.onrender.com/api/users?discordid=${discordId}`);
        
        // A API de users sempre retorna array
        return response.data || [];
    } catch (error) {
        console.error('Erro ao buscar usuários por Discord ID:', error);
        throw error;
    }
};

export { listUsersByDiscordId };

export default listUsers;