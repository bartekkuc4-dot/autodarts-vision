import { useCallback, useState } from "react";
import type { GameConfig } from "@/components/GameSetup";

export interface PlayerState {
  name: string;
  score: number;
  roundThrows: { segment: string; points: number }[];
  totalThrows: number;
  rounds: number;
}

export interface GameState {
  players: PlayerState[];
  activePlayerIndex: number;
  currentRound: number;
  winner: string | null;
  config: GameConfig;
  lastAction: "throw" | "undo" | "next" | null;
  bustMessage: string | null;
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

        // Bust: score goes below 0, or exactly 1 (can't finish), or
        // double-out required but finished on non-double
        if (
          newScore < 0 ||
          newScore === 1 ||
          (newScore === 0 && prev.config.doubleOut && !isDouble)
        ) {
          // Bust — revert entire round, move to next player
          const revertedPlayer: PlayerState = {
            ...player,
            score: player.score + player.roundThrows.reduce((s, t) => s + t.points, 0),
            roundThrows: [],
            totalThrows: player.totalThrows,
            rounds: player.rounds,
          };

          const players = [...prev.players];
          players[prev.activePlayerIndex] = revertedPlayer;

          const nextIdx = (prev.activePlayerIndex + 1) % players.length;
          const nextRound =
            nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;

          return {
            ...prev,
            players,
            activePlayerIndex: nextIdx,
            currentRound: nextRound,
            lastAction: "throw",
            bustMessage: `BUST! ${player.name} wraca do ${revertedPlayer.score}`,
          };
        }

        // Valid throw
        const updatedPlayer: PlayerState = {
          ...player,
          score: newScore,
          roundThrows: [...player.roundThrows, { segment, points }],
          totalThrows: player.totalThrows + 1,
          rounds: player.rounds,
        };

        const players = [...prev.players];
        players[prev.activePlayerIndex] = updatedPlayer;

        // Winner check
        if (newScore === 0) {
          return {
            ...prev,
            players,
            winner: updatedPlayer.name,
            lastAction: "throw",
            bustMessage: null,
          };
        }

        // Auto-advance after 3 throws
        if (updatedPlayer.roundThrows.length >= 3) {
          const finalPlayer = { ...updatedPlayer, roundThrows: [], rounds: updatedPlayer.rounds + 1 };
          players[prev.activePlayerIndex] = finalPlayer;
          const nextIdx = (prev.activePlayerIndex + 1) % players.length;
          const nextRound =
            nextIdx === 0 ? prev.currentRound + 1 : prev.currentRound;

          return {
            ...prev,
            players,
            activePlayerIndex: nextIdx,
            currentRound: nextRound,
            lastAction: "throw",
            bustMessage: null,
          };
        }

        return { ...prev, players, lastAction: "throw", bustMessage: null };
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

      return { ...prev, players, lastAction: "undo", bustMessage: null };
    });
  }, []);

  const nextPlayer = useCallback(() => {
    setState((prev) => {
      if (prev.winner) return prev;

      const player = prev.players[prev.activePlayerIndex];
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
      roundThrows: [],
      totalThrows: 0,
      rounds: 0,
    })),
    activePlayerIndex: 0,
    currentRound: 1,
    winner: null,
    config,
    lastAction: null,
    bustMessage: null,
  };
}
