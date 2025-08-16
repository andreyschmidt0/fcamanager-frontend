export interface MockUser {
    id: string;
    username: string;
    password: string;
    email: string;
    role: 'admin' | 'moderator' | 'user';
    isActive: boolean;
    createdAt: Date;
    lastLogin?: Date;
    profile: {
        nickname: string;
        clanName?: string;
        nexonID: string;
        discordID?: string;
    };
}

export const mockUsers: MockUser[] = [
    {
        id: '1',
        username: 'admin',
        password: 'admin123',
        email: 'admin@fcamanager.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        lastLogin: new Date(),
        profile: {
            nickname: 'AdminFCA',
            clanName: 'FCA-Staff',
            nexonID: 'ADM001',
            discordID: 'admin#1234'
        }
    },
    {
        id: '2',
        username: 'moderator',
        password: 'mod123',
        email: 'mod@fcamanager.com',
        role: 'moderator',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date(),
        profile: {
            nickname: 'ModeratorFCA',
            clanName: 'FCA-Staff',
            nexonID: 'MOD001',
            discordID: 'moderator#5678'
        }
    },
    {
        id: '3',
        username: 'testuser',
        password: 'test123',
        email: 'test@fcamanager.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-02-01'),
        profile: {
            nickname: 'TestPlayer',
            clanName: 'TestClan',
            nexonID: 'TEST001'
        }
    },
    {
        id: '4',
        username: 'player1',
        password: 'player123',
        email: 'player1@example.com',
        role: 'user',
        isActive: true,
        createdAt: new Date('2024-02-10'),
        profile: {
            nickname: 'WarriorCA',
            clanName: 'EliteSquad',
            nexonID: 'WAR001',
            discordID: 'warrior#9999'
        }
    },
    {
        id: '5',
        username: 'inactiveuser',
        password: 'inactive123',
        email: 'inactive@example.com',
        role: 'user',
        isActive: false,
        createdAt: new Date('2024-01-20'),
        profile: {
            nickname: 'InactivePlayer',
            nexonID: 'INA001'
        }
    }
];

export const findUserByCredentials = (username: string, password: string): MockUser | null => {
    return mockUsers.find(user => 
        user.username === username && 
        user.password === password && 
        user.isActive
    ) || null;
};

export const findUserById = (id: string): MockUser | null => {
    return mockUsers.find(user => user.id === id) || null;
};

export const findUserByUsername = (username: string): MockUser | null => {
    return mockUsers.find(user => user.username === username) || null;
};

export const isValidCredentials = (username: string, password: string): boolean => {
    return findUserByCredentials(username, password) !== null;
};