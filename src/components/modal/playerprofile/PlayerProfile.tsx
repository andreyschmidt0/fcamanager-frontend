import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PlayerProfileData {
  strDiscordID: string;
  strNexonID: string;
  oiduser: number;
  NickName: string;
  UsedNX: number;
  NXGradeName: string;
  NickNameColor: number;
  ColorEndDate: string;
  SuperRoomMaster: number;
  AgreeCnt: number;
  DisagreeCnt: number;
  KickedCnt: number;
  GradeName: string;
  PlayRoundCnt: number;
  WinCnt: number;
  LoseCnt: number;
  Forfeited: number;
  Assist: number;
  NutShotCnt: number;
  NutShotDeadCnt: number;
  FirstKill: number;
  DoubleKillCnt: number;
  MultiKillCnt: number;
  UltraKillCnt: number;
  FantasticKillCnt: number;
  UnbelievableCnt: number;
  UnbelievablePlusCnt: number;
  RevengeCnt: number;
  KillsStreak: number;
  MostKills: number;
  Money: number;
  EXP: number;
  KillCnt: number;
  DeadCnt: number;
  HeadshotCnt: number;
  nr_MarcaBatalha: number;
  ClanWin: number;
  ClanDraw: number;
  ClanLose: number;
  ClanKill: number;
  ClanDead: number;
  HQPoint: number;
  SQPoint: number;
  SaveBullionNum: number;
  BombsPlanted: number;
  BombsExploded: number;
  BombsDefused: number;
  CaptureFlag: number;
  RecoverFlag: number;
  SpyHunt_KillCnt: number;
  SpyHunt_DeadCnt: number;
  SpyHunt_Uploading: number;
  QRT_KillCnt: number;
  QRT_DeathCnt: number;
  QRT_HumanWin: number;
  QRT_InfectKillCnt: number;
  QRT_InfectDeathCnt: number;
  QRT_InfectWin: number;
  QRT_PlayNum: number;
  CoopKill: number;
  CoopDead: number;
  CoopHeadShot: number;
  CoopCombo: number;
  CoopSuccess: number;
  CoopPlayNum: number;
  CoopInfectKillCnt: number;
  CoopInfectDeadCnt: number;
  CoopInfectHeadshotCnt: number;
  CoopInfectComboCnt: number;
  CoopInfectPlaynumCnt: number;
  CoopInfectSuccessCnt: number;
  CoopMineShaftKillCnt: number;
  CoopMineShaftDeadCnt: number;
  CoopMineShaftHeadshotCnt: number;
  CoopMineShaftComboCnt: number;
  CoopMineShaftPlaynumCnt: number;
  CoopMineShaftSuccessCnt: number;
  CoopDesertFoxKillCnt: number;
  CoopDesertFoxDeadCnt: number;
  CoopDesertFoxHeadshotCnt: number;
  CoopDesertFoxComboCnt: number;
  CoopDesertFoxPlaynumCnt: number;
  CoopDesertFoxSuccessCnt: number;
  CoopNemexisKillCnt: number;
  CoopNemexisDeadCnt: number;
  CoopNemexisHeadshotCnt: number;
  CoopNemexisComboCnt: number;
  CoopNemexisPlaynumCnt: number;
  CoopNemexisSuccessCnt: number;
  CoopLabsKillCnt: number;
  CoopLabsDeadCnt: number;
  CoopLabsHeadshotCnt: number;
  CoopLabsComboCnt: number;
  CoopLabsPlaynumCnt: number;
  CoopLabsSuccessCnt: number;
  CoopInfectedShipKillCnt: number;
  CoopInfectedShipDeadCnt: number;
  CoopInfectedShipHeadShotCnt: number;
  CoopInfectedShipComboCnt: number;
  CoopInfectedShipPlayNumCnt: number;
  CoopInfectedShipSuccessCnt: number;
  CoopNewCabinFever2KillCnt: number;
  CoopNewCabinFever2DeadCnt: number;
  CoopNewCabinFever2HeadShotCnt: number;
  CoopNewCabinFever2ComboCnt: number;
  CoopNewCabinFever2PlayNumCnt: number;
  CoopNewCabinFever2SuccessCnt: number;
}

interface PlayerProfileProps {
  isOpen: boolean;
  onClose: () => void;
  nickname: string;
  isBanned?: boolean;
  login?: string;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({ isOpen, onClose, nickname, isBanned = false, login }) => {
  const [playerData, setPlayerData] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = async (identifier: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3000/api/users/profile/${encodeURIComponent(identifier)}`);
      
      if (!response.ok) {
        throw new Error('Jogador não encontrado');
      }
      
      const data = await response.json();
      setPlayerData(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setError('Erro ao carregar informações do jogador');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Esta é a parte importante. Você define qual parâmetro usar aqui.
    let identifierToFetch = '';

    if (nickname) {
      identifierToFetch = nickname;
    } else if (login) {
      identifierToFetch = login;
    }

    if (isOpen && identifierToFetch) {
      fetchPlayerData(identifierToFetch);
    }
  }, [isOpen, nickname, login]); // O useEffect reage a mudanças nessas props

  if (!isOpen) return null;

  const StatCard: React.FC<{ title: string; value: number | string; highlight?: boolean }> = ({ title, value, highlight = false }) => (
    <div className="bg-[#1d1e24] rounded-lg p-3">
      <p className="text-sm text-gray-400 mb-1">{title}</p>
      <p className="text-base font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value || 'N/A'}
      </p>
    </div>
  );

  const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">{title}</h3>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-[#111216] rounded-lg border-2 border-black w-full h-full max-w-[90vw] max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{nickname}</h2>
              {isBanned && (
                <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold animate-pulse">
                  🚫 BANIDO
                </span>
              )}
            </div>
            <p className="text-gray-400">Perfil Completo do Jogador</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-red-400 text-center">
                <p className="text-xl mb-2">❌ Erro</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {playerData && (
            <div className="space-y-8">
              {/* Informações Básicas */}
              <section>
                <SectionTitle title="📊 Informações Básicas" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <StatCard title="Discord ID" value={playerData.strDiscordID} />
                  <StatCard title="Nexon ID" value={playerData.strNexonID} />
                  <StatCard title="OID User" value={playerData.oiduser} />
                  <StatCard title="Rank" value={playerData.GradeName} highlight />
                  <StatCard title="NX Rank" value={playerData.NXGradeName} highlight />
                  <StatCard title="Super Room Master" value={playerData.SuperRoomMaster} />
                </div>
              </section>

              {/* Recursos */}
              <section>
                <SectionTitle title="💰 Recursos" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard title="Money" value={playerData.Money} highlight />
                  <StatCard title="EXP" value={playerData.EXP} highlight />
                  <StatCard title="NX Usado" value={playerData.UsedNX} />
                  <StatCard title="Marca de Batalha" value={playerData.nr_MarcaBatalha} />
                </div>
              </section>

              {/* Estatísticas Gerais */}
              <section>
                <SectionTitle title="🎯 Estatísticas Gerais" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas Jogadas" value={playerData.PlayRoundCnt} highlight />
                  <StatCard title="Vitórias" value={playerData.WinCnt} highlight />
                  <StatCard title="Derrotas" value={playerData.LoseCnt} />
                  <StatCard title="Forfeit" value={playerData.Forfeited} />
                  <StatCard title="Kills" value={playerData.KillCnt} highlight />
                  <StatCard title="Deaths" value={playerData.DeadCnt} />
                  <StatCard title="Headshots" value={playerData.HeadshotCnt} highlight />
                  <StatCard title="Assistências" value={playerData.Assist} />
                  <StatCard title="First Kills" value={playerData.FirstKill} />
                  <StatCard title="K/D Ratio" value={(playerData.KillCnt / Math.max(playerData.DeadCnt, 1)).toFixed(2)} highlight />
                  <StatCard title="Win Rate %" value={((playerData.WinCnt / Math.max(playerData.PlayRoundCnt, 1)) * 100).toFixed(1)} highlight />
                  <StatCard title="HS Rate %" value={((playerData.HeadshotCnt / Math.max(playerData.KillCnt, 1)) * 100).toFixed(1)} highlight />
                </div>
              </section>

              {/* Kills Especiais */}
              <section>
                <SectionTitle title="💀 Kills Especiais" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <StatCard title="Double Kills" value={playerData.DoubleKillCnt} />
                  <StatCard title="Multi Kills" value={playerData.MultiKillCnt} />
                  <StatCard title="Ultra Kills" value={playerData.UltraKillCnt} />
                  <StatCard title="Fantastic Kills" value={playerData.FantasticKillCnt} />
                  <StatCard title="Unbelievable" value={playerData.UnbelievableCnt} />
                  <StatCard title="Unbelievable+" value={playerData.UnbelievablePlusCnt} />
                  <StatCard title="Revenge" value={playerData.RevengeCnt} />
                  <StatCard title="Kill Streak" value={playerData.KillsStreak} />
                  <StatCard title="Most Kills" value={playerData.MostKills} highlight />
                  <StatCard title="Nut Shots" value={playerData.NutShotCnt} />
                  <StatCard title="Nut Shot Deaths" value={playerData.NutShotDeadCnt} />
                </div>
              </section>

              {/* Clã */}
              <section>
                <SectionTitle title="🏴 Estatísticas de Clã" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  <StatCard title="Vitórias" value={playerData.ClanWin} highlight />
                  <StatCard title="Empates" value={playerData.ClanDraw} />
                  <StatCard title="Derrotas" value={playerData.ClanLose} />
                  <StatCard title="Kills" value={playerData.ClanKill} />
                  <StatCard title="Deaths" value={playerData.ClanDead} />
                </div>
              </section>

              {/* Buscar e Destruir */}
              <section>
                <SectionTitle title="💣 Buscar e Destruir" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard title="Bombas Plantadas" value={playerData.BombsPlanted} />
                  <StatCard title="Bombas Explodidas" value={playerData.BombsExploded} />
                  <StatCard title="Bombas Desarmadas" value={playerData.BombsDefused} />
                </div>
              </section>

              {/* Capturar a Bandeira */}
              <section>
                <SectionTitle title="🚩 Capturar a Bandeira" />
                <div className="grid grid-cols-2 gap-4">
                  <StatCard title="Bandeiras Capturadas" value={playerData.CaptureFlag} />
                  <StatCard title="Bandeiras Recuperadas" value={playerData.RecoverFlag} />
                </div>
              </section>

              {/* Spy Hunt */}
              <section>
                <SectionTitle title="🕵️ Spy Hunt" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard title="Kills" value={playerData.SpyHunt_KillCnt} />
                  <StatCard title="Deaths" value={playerData.SpyHunt_DeadCnt} />
                  <StatCard title="Uploads" value={playerData.SpyHunt_Uploading} />
                </div>
              </section>

              {/* Quarentena */}
              <section>
                <SectionTitle title="🧟 Quarentena" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <StatCard title="Partidas" value={playerData.QRT_PlayNum} />
                  <StatCard title="Human Kills" value={playerData.QRT_KillCnt} />
                  <StatCard title="Human Deaths" value={playerData.QRT_DeathCnt} />
                  <StatCard title="Human Wins" value={playerData.QRT_HumanWin} />
                  <StatCard title="Infected Kills" value={playerData.QRT_InfectKillCnt} />
                  <StatCard title="Infected Deaths" value={playerData.QRT_InfectDeathCnt} />
                  <StatCard title="Infected Wins" value={playerData.QRT_InfectWin} />
                </div>
              </section>

              {/* Desert Thunder */}
              <section>
                <SectionTitle title="🏜️ Desert Thunder" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopPlayNum} />
                  <StatCard title="Vitórias" value={playerData.CoopSuccess} />
                  <StatCard title="Kills" value={playerData.CoopKill} />
                  <StatCard title="Deaths" value={playerData.CoopDead} />
                  <StatCard title="Headshots" value={playerData.CoopHeadShot} />
                  <StatCard title="Combos" value={playerData.CoopCombo} />
                </div>
              </section>

              {/* Cabin Fever */}
              <section>
                <SectionTitle title="🏚️ Cabin Fever" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopInfectPlaynumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopInfectSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopInfectKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopInfectDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopInfectHeadshotCnt} />
                  <StatCard title="Combos" value={playerData.CoopInfectComboCnt} />
                </div>
              </section>

              {/* Black Lung */}
              <section>
                <SectionTitle title="⛏️ Black Lung" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopMineShaftPlaynumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopMineShaftSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopMineShaftKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopMineShaftDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopMineShaftHeadshotCnt} />
                  <StatCard title="Combos" value={playerData.CoopMineShaftComboCnt} />
                </div>
              </section>

              {/* Desert Fox */}
              <section>
                <SectionTitle title="🦊 Desert Fox" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopDesertFoxPlaynumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopDesertFoxSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopDesertFoxKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopDesertFoxDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopDesertFoxHeadshotCnt} />
                  <StatCard title="Combos" value={playerData.CoopDesertFoxComboCnt} />
                </div>
              </section>

              {/* Nemexis HQ */}
              <section>
                <SectionTitle title="🏢 Nemexis HQ" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopNemexisPlaynumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopNemexisSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopNemexisKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopNemexisDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopNemexisHeadshotCnt} />
                  <StatCard title="Combos" value={playerData.CoopNemexisComboCnt} />
                </div>
              </section>

              {/* Nemexis Labs */}
              <section>
                <SectionTitle title="🧪 Nemexis Labs" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopLabsPlaynumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopLabsSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopLabsKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopLabsDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopLabsHeadshotCnt} />
                  <StatCard title="Combos" value={playerData.CoopLabsComboCnt} />
                </div>
              </section>

              {/* Dead Water */}
              <section>
                <SectionTitle title="🚢 Dead Water" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopInfectedShipPlayNumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopInfectedShipSuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopInfectedShipKillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopInfectedShipDeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopInfectedShipHeadShotCnt} />
                  <StatCard title="Combos" value={playerData.CoopInfectedShipComboCnt} />
                </div>
              </section>

              {/* Outpost 31 */}
              <section>
                <SectionTitle title="🛡️ Outpost 31" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard title="Partidas" value={playerData.CoopNewCabinFever2PlayNumCnt} />
                  <StatCard title="Vitórias" value={playerData.CoopNewCabinFever2SuccessCnt} />
                  <StatCard title="Kills" value={playerData.CoopNewCabinFever2KillCnt} />
                  <StatCard title="Deaths" value={playerData.CoopNewCabinFever2DeadCnt} />
                  <StatCard title="Headshots" value={playerData.CoopNewCabinFever2HeadShotCnt} />
                  <StatCard title="Combos" value={playerData.CoopNewCabinFever2ComboCnt} />
                </div>
              </section>

              {/* Outros */}
              <section>
                <SectionTitle title="📈 Outros" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <StatCard title="Agrees" value={playerData.AgreeCnt} />
                  <StatCard title="Disagrees" value={playerData.DisagreeCnt} />
                  <StatCard title="Kicked" value={playerData.KickedCnt} />
                  <StatCard title="HQ Points" value={playerData.HQPoint} />
                  <StatCard title="SQ Points" value={playerData.SQPoint} />
                  <StatCard title="Bullion Saved" value={playerData.SaveBullionNum} />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;