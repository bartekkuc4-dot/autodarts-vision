import { useState } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import Scoreboard from "@/components/Scoreboard";
import GameControls from "@/components/GameControls";
import DetectionLog from "@/components/DetectionLog";

const MOCK_PLAYERS = [
  { name: "Gracz 1", score: 301, throws: [20, 57, 18], isActive: true },
  { name: "Gracz 2", score: 395, throws: [5], isActive: false },
];

const MOCK_DETECTIONS = [
  { id: 1, segment: "T20", score: 60, confidence: 0.94, timestamp: "12:04" },
  { id: 2, segment: "S19", score: 19, confidence: 0.87, timestamp: "12:03" },
  { id: 3, segment: "D16", score: 32, confidence: 0.91, timestamp: "12:02" },
];

const Index = () => {
  const [players] = useState(MOCK_PLAYERS);
  const [detections] = useState(MOCK_DETECTIONS);

  const handleUndo = () => {};
  const handleNextPlayer = () => {};
  const handleNewGame = () => {};
  const handleSettings = () => {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isConnected={true} />

      <main className="flex-1 p-3 space-y-3 max-w-lg mx-auto w-full">
        <CameraView />
        <Scoreboard players={players} currentRound={3} gameMode="501 Double Out" />
        <GameControls
          onUndo={handleUndo}
          onNextPlayer={handleNextPlayer}
          onNewGame={handleNewGame}
          onSettings={handleSettings}
        />
        <DetectionLog detections={detections} />
      </main>
    </div>
  );
};

export default Index;
