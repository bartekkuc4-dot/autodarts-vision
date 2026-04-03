import { useState } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import Scoreboard from "@/components/Scoreboard";
import GameControls from "@/components/GameControls";
import DetectionLog from "@/components/DetectionLog";
import GameSetup, { type GameConfig } from "@/components/GameSetup";

const MOCK_DETECTIONS = [
  { id: 1, segment: "T20", score: 60, confidence: 0.94, timestamp: "12:04" },
  { id: 2, segment: "S19", score: 19, confidence: 0.87, timestamp: "12:03" },
  { id: 3, segment: "D16", score: 32, confidence: 0.91, timestamp: "12:02" },
];

const Index = () => {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [detections] = useState(MOCK_DETECTIONS);

  const handleStartGame = (config: GameConfig) => {
    setGameConfig(config);
  };

  const handleNewGame = () => {
    setGameConfig(null);
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
