import { useState } from "react";
import { Calculator, X, Delete } from "lucide-react";

const SEGMENTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

type Multiplier = "S" | "D" | "T";

interface ManualScorerProps {
  onScore: (segment: string, points: number) => void;
}

const ManualScorer = ({ onScore }: ManualScorerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [multiplier, setMultiplier] = useState<Multiplier>("S");

  const getLabel = (m: Multiplier) => {
    switch (m) {
      case "S": return "Single";
      case "D": return "Double";
      case "T": return "Triple";
    }
  };

  const handleSegment = (seg: number) => {
    const points = seg * (multiplier === "D" ? 2 : multiplier === "T" ? 3 : 1);
    const label = `${multiplier}${seg}`;
    onScore(label, points);
    setMultiplier("S");
  };

  const handleBull = (double: boolean) => {
    onScore(double ? "D-Bull" : "S-Bull", double ? 50 : 25);
    setMultiplier("S");
  };

  const handleMiss = () => {
    onScore("Miss", 0);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="glass-surface rounded-lg p-3 w-full flex items-center justify-center gap-2 hover:bg-secondary/60 transition-colors"
      >
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
          Kalkulator ręczny
        </span>
      </button>
    );
  }

  return (
    <div className="glass-surface rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
            Kalkulator ręczny
          </span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-secondary transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Multiplier selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {(["S", "D", "T"] as Multiplier[]).map((m) => (
          <button
            key={m}
            onClick={() => setMultiplier(m)}
            className={`py-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all ${
              multiplier === m
                ? m === "T"
                  ? "bg-accent/20 text-accent border border-accent/40"
                  : m === "D"
                    ? "bg-primary/20 text-primary border border-primary/40"
                    : "bg-secondary text-foreground border border-border"
                : "bg-muted/30 text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            {getLabel(m)}
          </button>
        ))}
      </div>

      {/* Number grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {SEGMENTS.map((seg) => {
          const pts = seg * (multiplier === "D" ? 2 : multiplier === "T" ? 3 : 1);
          return (
            <button
              key={seg}
              onClick={() => handleSegment(seg)}
              className="relative flex flex-col items-center justify-center py-2.5 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
            >
              <span className="font-display text-sm font-bold text-foreground">{seg}</span>
              <span className={`text-[9px] font-body tabular-nums ${
                multiplier === "T" ? "text-accent" : multiplier === "D" ? "text-primary" : "text-muted-foreground"
              }`}>
                ={pts}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bull & Miss row */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => handleBull(false)}
          className="flex flex-col items-center py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <span className="font-display text-xs font-bold text-primary">Bull</span>
          <span className="text-[9px] text-muted-foreground font-body">=25</span>
        </button>
        <button
          onClick={() => handleBull(true)}
          className="flex flex-col items-center py-2.5 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
        >
          <span className="font-display text-xs font-bold text-accent">D-Bull</span>
          <span className="text-[9px] text-muted-foreground font-body">=50</span>
        </button>
        <button
          onClick={handleMiss}
          className="flex flex-col items-center justify-center py-2.5 rounded-lg bg-muted/50 hover:bg-secondary transition-colors"
        >
          <Delete className="w-4 h-4 text-muted-foreground" />
          <span className="font-display text-[9px] font-bold text-muted-foreground uppercase">Miss</span>
        </button>
      </div>
    </div>
  );
};

export default ManualScorer;
