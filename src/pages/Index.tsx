import { useState, useCallback, useRef } from "react";
import Header from "@/components/Header";
import CameraView from "@/components/CameraView";
import Scoreboard from "@/components/Scoreboard";
import GameControls from "@/components/GameControls";
import DetectionLog from "@/components/DetectionLog";
import GameSetup, { type GameConfig } from "@/components/GameSetup";
import ManualScorer from "@/components/ManualScorer";
import WinnerOverlay from "@/components/WinnerOverlay";
import DetectionToast from "@/components/DetectionToast";
import SettingsPanel, {
  DEFAULT_SETTINGS,
  type MotionSettings,
} from "@/components/SettingsPanel";
import { useGameEngine } from "@/hooks/useGameEngine";
import { useAutoDetection, type DetectedDart } from "@/hooks/useAutoDetection";
import { API_BASE } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Detection {
  id:         number;
  segment:    string;
  score:      number;
  confidence: number;
  timestamp:  string;
}

// ─── GameScreen ────────────────────────────────────────────────────────────────
const GameScreen = ({
  config,
  onNewGame,
}: {
  config:    GameConfig;
  onNewGame: () => void;
}) => {
  const { state, addThrow, undo, nextPlayer, resetGame } = useGameEngine(config);
  const [detections,   setDetections]   = useState<Detection[]>([]);
  const [pendingDart,  setPendingDart]  = useState<DetectedDart | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [motionCfg,    setMotionCfg]    = useState<MotionSettings>(DEFAULT_SETTINGS);
  const [isScorerOpen, setIsScorerOpen] = useState(false);

  // Interaction guard — pauses motion detection for 2 s after any UI tap
  const [isInteracting,   setIsInteracting]   = useState(false);
  const interactionTimer  = useRef<ReturnType<typeof setTimeout>>();

  // Feedback ref — stores frame + wrong dart between Popraw click and ManualScorer submit
  const pendingFeedback = useRef<{
    frame:         string;
    predictedDart: DetectedDart;
  } | null>(null);

  const onUIInteraction = useCallback(() => {
    setIsInteracting(true);
    clearTimeout(interactionTimer.current);
    interactionTimer.current = setTimeout(() => setIsInteracting(false), 2_000);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const recordDetection = useCallback(
    (segment: string, points: number, confidence = 1.0) => {
      setDetections((prev) => [
        { id: Date.now(), segment, score: points, confidence, timestamp: now() },
        ...prev,
      ]);
    },
    []
  );

  // ── Manual scoring ────────────────────────────────────────────────────────
  const handleScore = useCallback(
    (segment: string, points: number) => {
      addThrow(segment, points);
      recordDetection(segment, points);

      // If this score is a correction of an auto-detection → send feedback
      if (pendingFeedback.current) {
        const { frame, predictedDart } = pendingFeedback.current;
        pendingFeedback.current = null;

        // Fire-and-forget — don't block the UI
        fetch(`${API_BASE}/feedback`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image:           frame,
            predicted_class: predictedDart.cls,
            correct_class:   segment,
            confidence:      predictedDart.confidence,
            bbox:            predictedDart.bbox,
          }),
        }).catch((err) => console.warn("[Feedback] POST failed:", err));
      }
    },
    [addThrow, recordDetection]
  );

  // ── Undo ──────────────────────────────────────────────────────────────────
  const handleUndo = useCallback(() => {
    undo();
    setDetections((prev) => prev.slice(1));
  }, [undo]);

  // ── Auto-detection callbacks ───────────────────────────────────────────────
  const handleAutoDetected = useCallback(
    (dart: DetectedDart, frame: string) => {
      // Add throw immediately; toast lets user undo within 4 s
      addThrow(dart.cls, dart.score);
      recordDetection(dart.cls, dart.score, dart.confidence);
      setPendingDart(dart);
      // Store frame alongside dart — needed if user clicks Popraw
      pendingFeedback.current = { frame, predictedDart: dart };
    },
    [addThrow, recordDetection]
  );

  const { processFrame, resetBoard } = useAutoDetection({
    onDetected:   handleAutoDetected,
    onBoardReset: () => {/* board state reset is internal to the hook */},
  });

  // Toast acceptance — throw already added, just dismiss
  const handleToastAccept = useCallback(() => setPendingDart(null), []);

  // Toast correction — undo the auto-throw, arm feedback, open ManualScorer
  const handleToastCorrect = useCallback(() => {
    setPendingDart(null);
    undo();
    setDetections((prev) => prev.slice(1));
    // pendingFeedback.current is already set in handleAutoDetected;
    // it will be consumed + cleared when handleScore is called next.
    setIsScorerOpen(true);
  }, [undo]);

  // ── Next player / reset ───────────────────────────────────────────────────
  const handleNextPlayer = useCallback(() => {
    nextPlayer();
    resetBoard();
  }, [nextPlayer, resetBoard]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    resetBoard();
    setDetections([]);
  }, [resetGame, resetBoard]);

  // ── Detection active flag ─────────────────────────────────────────────────
  const isDetectionActive =
    motionCfg.enabled &&
    !isInteracting    &&
    !isScorerOpen     &&
    pendingDart === null;

  // ── Scoreboard data ───────────────────────────────────────────────────────
  const scoreboardPlayers = state.players.map((p, i) => ({
    name:           p.name,
    score:          p.score,
    legsWon:        p.legsWon,
    throws:         p.roundThrows.map((t) => t.points),
    isActive:       i === state.activePlayerIndex,
    totalThrows:    p.totalThrows,
    lastRoundScore: p.lastRoundScore,          // ✅ from engine state, not computed
    totalPoints:    config.startingScore - p.score,
  }));

  const modeLabel = config.mode + (config.doubleOut ? " Double Out" : "");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isConnected={true} />

      <main className="flex-1 p-3 space-y-3 max-w-lg mx-auto w-full">
        {/* Camera — auto-detection wired in */}
        <CameraView
          onFrame={processFrame}
          isDetectionActive={isDetectionActive}
          motionConfig={{
            motionThreshold:     motionCfg.motionThreshold,
            largeMotionRatio:    motionCfg.largeMotionRatio,
          }}
        />

        {/* Bust message */}
        {state.bustMessage && (
          <div className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2.5 text-center">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-accent">
              {state.bustMessage}
            </span>
          </div>
        )}

        {/* Interactive UI — wrapped in interaction guard */}
        <div onPointerDown={onUIInteraction}>
          <ManualScorer
            onScore={handleScore}
            isOpen={isScorerOpen}
            onOpenChange={setIsScorerOpen}
          />
        </div>

        <Scoreboard
          players={scoreboardPlayers}
          currentRound={state.currentRound}
          currentLeg={state.currentLeg}
          totalLegs={state.totalLegs}
          gameMode={modeLabel}
        />

        <div onPointerDown={onUIInteraction}>
          <GameControls
            onUndo={handleUndo}
            onNextPlayer={handleNextPlayer}
            onNewGame={onNewGame}
            onSettings={() => setSettingsOpen(true)}
            onResetBoard={resetBoard}
          />
        </div>

        <DetectionLog detections={detections} />
      </main>

      {/* Auto-detection toast */}
      <DetectionToast
        dart={pendingDart}
        onAccept={handleToastAccept}
        onCorrect={handleToastCorrect}
      />

      {/* Settings panel */}
      {settingsOpen && (
        <SettingsPanel
          settings={motionCfg}
          onChange={setMotionCfg}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Winner overlay */}
      {state.winner && (
        <WinnerOverlay
          winner={state.winner}
          players={state.players}
          startingScore={config.startingScore}
          onNewGame={onNewGame}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
};

// ─── Index (entry) ─────────────────────────────────────────────────────────────
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
