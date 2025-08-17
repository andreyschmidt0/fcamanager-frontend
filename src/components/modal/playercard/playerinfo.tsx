import react from 'react';
import { useState } from 'react';

interface PlayerInfoProps {
  discordId: string;
  loginAccount: string;
  clanName: string;
  cash: string;
  banhistory: string[];
}




const [playerInfo, setPlayerInfo] = useState<PlayerInfoProps | null>(null);
const PlayerInfo: React.FC = () => {
    return (
        <div className="player-info">
            {playerInfo ? (
                <div>
                    <h2>Player Information</h2>
                    <p><strong>Discord ID:</strong> {playerInfo.discordId}</p>
                    <p><strong>Login Account:</strong> {playerInfo.loginAccount}</p>
                    <p><strong>Clan Name:</strong> {playerInfo.clanName}</p>
                    <p><strong>Cash:</strong> {playerInfo.cash}</p>
                    <h3>Ban History</h3>
                    <ul>
                        {playerInfo.banhistory.map((ban, index) => (
                            <li key={index}>{ban}</li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p>No player information available.</p>
            )}
        </div>
    );

}


export default PlayerInfo;