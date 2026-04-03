import { useState } from "react";
import { Target, Users, Play, Plus, Minus, Trophy, Zap, CircleDot, SlidersHorizontal } from "lucide-react";

export interface GameConfig {
  mode: string;
  startingScore: number;
  doubleOut: boolean;
  playerNames: string[];
}

interface GameMode {
  label: string;
  score: number;
  description: string;
  icon: React.ReactNode;
  doubleOut: boolean;
}

const GAME_MODES: GameMode[] = [
  { label: "301", score: 301, description: "Szybka gra", icon: <Zap className="w-5 h-5" />, doubleOut: false },
  { label: "501", score: 501, description: "Klasyk turniejowy", icon: <Trophy className="w-5 h-5" />, doubleOut: true },
  { label: "701", score: 701, description: "Dłuższa rozgrywka", icon: <Target className="w-5 h-5" />, doubleOut: true },
  { label: "Cricket", score: 0, description: "Zamykaj segmenty", icon: <CircleDot className="w-5 h-5" />, doubleOut: false },
];

interface GameSetupProps {
  onStart: (config: GameConfig) => void;
}

const GameSetup = ({ onStart }: GameSetupProps) => {
  const [selectedMode, setSelectedMode] = useState(1); // default 501
  const [doubleOut, setDoubleOut] = useState(true);
  const [playerNames, setPlayerNames] = useState(["Gracz 1", "Gracz 2"]);

  const mode = GAME_MODES[selectedMode];

  const addPlayer = () => {
    if (playerNames.length < 4) {
      setPlayerNames([...playerNames, `Gracz ${playerNames.length + 1}`]);
    }
  };

  const removePlayer = () => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.slice(0, -1));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const handleStart = () => {
    onStart({
      mode: mode.label,
      startingScore: mode.score,
      doubleOut: mode.label === "Cricket" ? false : doubleOut,
      playerNames,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo / Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Target className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-display font-bold text-foreground tracking-wider uppercase">
              AutoDarts <span className="text-primary neon-text-glow">Vision</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">Wybierz tryb gry i rozpocznij rozgrywkę</p>
        </div>

        {/* Game mode selection */}
        <div className="space-y-2">
          <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
            Tryb gry
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GAME_MODES.map((m, i) => (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedMode(i);
                  setDoubleOut(m.doubleOut);
                }}
                className={`relative flex flex-col items-center gap-2 rounded-lg p-4 transition-all ${
                  selectedMode === i
                    ? "score-gradient border-2 border-primary/50 neon-glow"
                    : "glass-surface hover:bg-secondary/60"
                }`}
              >
                <div className={selectedMode === i ? "text-primary" : "text-muted-foreground"}>
                  {m.icon}
                </div>
                <span
                  className={`font-display text-lg font-bold ${
                    selectedMode === i ? "text-primary neon-text-glow" : "text-foreground"
                  }`}
                >
                  {m.label}
                </span>
                <span className="text-[10px] text-muted-foreground font-body">{m.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Double Out toggle (only for X01 modes) */}
        {mode.label !== "Cricket" && (
          <div className="glass-surface rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Double Out</p>
              <p className="text-[10px] text-muted-foreground font-body">Zakończ grę trafiając w podwójne pole</p>
            </div>
            <button
              onClick={() => setDoubleOut(!doubleOut)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                doubleOut ? "bg-primary" : "bg-secondary"
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow transition-transform ${
                  doubleOut ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        )}

        {/* Players */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Gracze ({playerNames.length}/4)
            </label>
            <div className="flex gap-1.5">
              <button
                onClick={removePlayer}
                disabled={playerNames.length <= 1}
                className="glass-surface rounded-full p-1.5 transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={addPlayer}
                disabled={playerNames.length >= 4}
                className="glass-surface rounded-full p-1.5 transition-colors hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {playerNames.map((name, i) => (
              <input
                key={i}
                value={name}
                onChange={(e) => updatePlayerName(i, e.target.value)}
                className="w-full rounded-lg bg-secondary/60 border border-border px-4 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                placeholder={`Gracz ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2.5 rounded-lg bg-primary py-3.5 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 neon-glow"
        >
          <Play className="w-5 h-5" />
          Rozpocznij grę
        </button>
      </div>
    </div>
  );
};

export default GameSetup;
