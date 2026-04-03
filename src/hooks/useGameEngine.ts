import { useCallback, useState } from "react";
import type { GameConfig } from "@/components/GameSetup";

export interface ThrowData {
  segment: string;
  points: number;
}

export interface RoundHistoryEntry {
  leg: number;
  round: number;
  playerName: string;
  throws: ThrowData[];
  totalPoints: number;
  bust: boolean;
}

export interface PlayerState {
  name: string;
  score: number;
  legsWon: number;
  roundThrows: ThrowData[];
  totalThrows: number;
  rounds: number;
}

export interface GameState {
  players: PlayerState[];
  activePlayerIndex: number;
  currentRound: number;
  currentLeg: number;
  totalLegs: number;
  winner: string | null;
  legWinner: string | null;
  config: GameConfig;
  lastAction: "throw" | "undo" | "next" | "leg_won" | null;
  bustMessage: string | null;
  roundHistory: RoundHistoryEntry[];
}

export function useGameEngine(config: GameConfig) {
  const [state, setState] = useState<GameState>(() => initState(config));

  const addThrow = useCallback(
    (segment: string, points: number) => {
      setState((prev) => {
        if (prev.winner) return prev;

        const player = prev.players[prev.activePlayerIndex];
        const newScore = player.score - points;
        const isDouble = segment.startsWith("D");

        // Bust
        if (
          newScore < 0 ||
          newScore === 1 ||
          (newScore === 0 && prev.config.doubleOut && !isDouble)
        ) {
          const bustEntry: RoundHistoryEntry = {
            leg: prev.currentLeg,
            round: prev.currentRound,
            playerName: player.name,
            throws: [...player.roundThrows, { segment, points }],
            totalPoints: player.roundThrows.reduce((s, t) => s + t.points, 0) + points,
            bust: true,
          };

          const revertedPlayer: PlayerState = {
            ...player,
            score: player.score + player.roundThrows.reduce((s, t) => s + t.points, 0),
            roundThrows: [],
          };

          const players = [...prev.players];
          players[prev.activePlayerIndex] = revertedPlayer;

          const nextIdx = (prev.activePlayerIndex + 1) % players.length;
          const nextRound = nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;

          return {
            ...prev,
            players,
            activePlayerIndex: nextIdx,
            currentRound: nextRound,
            lastAction: "throw",
            bustMessage: `BUST! ${player.name} wraca do ${revertedPlayer.score}`,
            legWinner: null,
            roundHistory: [...prev.roundHistory, bustEntry],
          };
        }

        // Valid throw
        const updatedPlayer: PlayerState = {
          ...player,
          score: newScore,
          roundThrows: [...player.roundThrows, { segment, points }],
          totalThrows: player.totalThrows + 1,
        };

        const players = [...prev.players];
        players[prev.activePlayerIndex] = updatedPlayer;

        // Leg won
        if (newScore === 0) {
          const legEntry: RoundHistoryEntry = {
            leg: prev.currentLeg, round: prev.currentRound,
            playerName: player.name, throws: updatedPlayer.roundThrows,
            totalPoints: updatedPlayer.roundThrows.reduce((s, t) => s + t.points, 0), bust: false,
          };
          const legPlayer = { ...updatedPlayer, legsWon: updatedPlayer.legsWon + 1, roundThrows: [] };
          players[prev.activePlayerIndex] = legPlayer;
          const newHistory = [...prev.roundHistory, legEntry];

          if (legPlayer.legsWon >= prev.totalLegs) {
            return { ...prev, players, winner: legPlayer.name, legWinner: legPlayer.name, lastAction: "leg_won", bustMessage: null, roundHistory: newHistory };
          }

          const resetPlayers = players.map((p) => ({ ...p, score: prev.config.startingScore, roundThrows: [] }));
          return { ...prev, players: resetPlayers, activePlayerIndex: 0, currentRound: 1, currentLeg: prev.currentLeg + 1, legWinner: legPlayer.name, lastAction: "leg_won", bustMessage: null, winner: null, roundHistory: newHistory };
        }

        // Auto-advance after 3 throws
        if (updatedPlayer.roundThrows.length >= 3) {
          const roundEntry: RoundHistoryEntry = {
            leg: prev.currentLeg, round: prev.currentRound,
            playerName: player.name, throws: updatedPlayer.roundThrows,
            totalPoints: updatedPlayer.roundThrows.reduce((s, t) => s + t.points, 0), bust: false,
          };
          const finalPlayer = { ...updatedPlayer, roundThrows: [], rounds: updatedPlayer.rounds + 1 };
          players[prev.activePlayerIndex] = finalPlayer;
          const nextIdx = (prev.activePlayerIndex + 1) % players.length;
          const nextRound = nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;

          return { ...prev, players, activePlayerIndex: nextIdx, currentRound: nextRound, lastAction: "throw", bustMessage: null, legWinner: null, roundHistory: [...prev.roundHistory, roundEntry] };
        }

        return { ...prev, players, lastAction: "throw", bustMessage: null, legWinner: null };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;
      const player = prev.players[prev.activePlayerIndex];
      if (player.roundThrows.length === 0) return prev;

      const lastThrow = player.roundThrows[player.roundThrows.length - 1];
      const updatedPlayer: PlayerState = {
        ...player,
        score: player.score + lastThrow.points,
        roundThrows: player.roundThrows.slice(0, -1),
        totalThrows: player.totalThrows - 1,
      };

      const players = [...prev.players];
      players[prev.activePlayerIndex] = updatedPlayer;

      return { ...prev, players, lastAction: "undo", bustMessage: null, legWinner: null };
    });
  }, []);

  const nextPlayer = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const player = prev.players[prev.activePlayerIndex];
      const roundEntry: RoundHistoryEntry = {
        leg: prev.currentLeg, round: prev.currentRound,
        playerName: player.name, throws: [...player.roundThrows],
        totalPoints: player.roundThrows.reduce((s, t) => s + t.points, 0), bust: false,
      };
      const finalPlayer = { ...player, roundThrows: [], rounds: player.rounds + 1 };
      const players = [...prev.players];
      players[prev.activePlayerIndex] = finalPlayer;

      const nextIdx = (prev.activePlayerIndex + 1) % players.length;
      const nextRound = nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;

      return {
        ...prev,
        players,
        activePlayerIndex: nextIdx,
        currentRound: nextRound,
        lastAction: "next",
        bustMessage: null,
        legWinner: null,
        roundHistory: player.roundThrows.length > 0 ? [...prev.roundHistory, roundEntry] : prev.roundHistory,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setState(initState(config));
  }, [config]);

  return { state, addThrow, undo, nextPlayer, resetGame };
}

function initState(config: GameConfig): GameState {
  return {
    players: config.playerNames.map((name) => ({
      name,
      score: config.startingScore,
      legsWon: 0,
      roundThrows: [],
      totalThrows: 0,
      rounds: 0,
    })),
    activePlayerIndex: 0,
    currentRound: 1,
    currentLeg: 1,
    totalLegs: config.legs,
    winner: null,
    legWinner: null,
    config,
    lastAction: null,
    bustMessage: null,
    roundHistory: [],
  };
}
