import { useState, useCallback } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import Scoreboard from "@/components/Scoreboard";
import GameControls from "@/components/GameControls";
import DetectionLog from "@/components/DetectionLog";
import GameSetup, { type GameConfig } from "@/components/GameSetup";
import ManualScorer from "@/components/ManualScorer";
import WinnerOverlay from "@/components/WinnerOverlay";
import { useGameEngine } from "@/hooks/useGameEngine";

interface Detection {
  id: number;
  segment: string;
  score: number;
  confidence: number;
  timestamp: string;
}

const GameScreen = ({
  config,
  onNewGame,
}: {
  config: GameConfig;
  onNewGame: () => void;
}) => {
  const { state, addThrow, undo, nextPlayer, resetGame } = useGameEngine(config);
  const [detections, setDetections] = useState<Detection[]>([]);

  const handleScore = useCallback(
    (segment: string, points: number) => {
      addThrow(segment, points);
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      setDetections((prev) => [
        { id: Date.now(), segment, score: points, confidence: 1.0, timestamp: ts },
        ...prev,
      ]);
    },
    [addThrow]
  );

  const handleUndo = useCallback(() => {
    undo();
    setDetections((prev) => prev.slice(1));
  }, [undo]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setDetections([]);
  }, [resetGame]);

  const scoreboardPlayers = state.players.map((p, i) => ({
    name: p.name,
    score: p.score,
    throws: p.roundThrows.map((t) => t.points),
    isActive: i === state.activePlayerIndex,
  }));

  const modeLabel = config.mode + (config.doubleOut ? " Double Out" : "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isConnected={true} />

      <main className="flex-1 p-3 space-y-3 max-w-lg mx-auto w-full">
        <CameraView />

        {/* Bust message */}
        {state.bustMessage && (
          <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-center">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-accent">
              {state.bustMessage}
            </span>
          </div>
        )}

        <ManualScorer onScore={handleScore} />
        <Scoreboard
          players={scoreboardPlayers}
          currentRound={state.currentRound}
          gameMode={modeLabel}
        />
        <GameControls
          onUndo={handleUndo}
          onNextPlayer={nextPlayer}
          onNewGame={onNewGame}
          onSettings={() => {}}
        />
        <DetectionLog detections={detections} />
      </main>

      {state.winner && (
        <WinnerOverlay
          winner={state.winner}
          onNewGame={onNewGame}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

const Index = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);

  if (!gameConfig) {
    return <GameSetup onStart={setGameConfig} />;
  }

  return (
    <GameScreen
      key={JSON.stringify(gameConfig)}
      config={gameConfig}
      onNewGame={() => setGameConfig(null)}
    />
  );
};

export default Index;
