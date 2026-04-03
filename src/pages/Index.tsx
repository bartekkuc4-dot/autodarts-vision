import { useState } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import Scoreboard from "@/components/Scoreboard";
import GameControls from "@/components/GameControls";
import DetectionLog from "@/components/DetectionLog";
import GameSetup, { type GameConfig } from "@/components/GameSetup";
import ManualScorer from "@/components/ManualScorer";

interface Detection {
  id: number;
  segment: string;
  score: number;
  confidence: number;
  timestamp: string;
}

const Index = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
    setDetections([]);
  };

  const handleNewGame = () => {
    setGameConfig(null);
    setDetections([]);
  };

  const handleManualScore = (segment: string, points: number) => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setDetections((prev) => [
      { id: Date.now(), segment, score: points, confidence: 1.0, timestamp: ts },
      ...prev,
    ]);
  };

  if (!gameConfig) {
    return <GameSetup onStart={handleStartGame} />;
  }

  const players = gameConfig.playerNames.map((name, i) => ({
    name,
    score: gameConfig.startingScore,
    throws: [] as number[],
    isActive: i === 0,
  }));

  const modeLabel = gameConfig.mode + (gameConfig.doubleOut ? " Double Out" : "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isConnected={true} />

      <main className="flex-1 p-3 space-y-3 max-w-lg mx-auto w-full">
        <CameraView />
        <ManualScorer onScore={handleManualScore} />
        <Scoreboard players={players} currentRound={1} gameMode={modeLabel} />
        <GameControls
          onUndo={() => {}}
          onNextPlayer={() => {}}
          onNewGame={handleNewGame}
          onSettings={() => {}}
        />
        <DetectionLog detections={detections} />
      </main>
    </div>
  );
};

export default Index;
