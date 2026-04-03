import { Trophy, TrendingUp } from "lucide-react";

interface Player {
  name: string;
  score: number;
  legsWon: number;
  throws: number[];
  isActive: boolean;
  totalThrows: number;
  totalPoints: number;
}

interface ScoreboardProps {
  players: Player[];
  currentRound: number;
  currentLeg: number;
  totalLegs: number;
  gameMode: string;
}

const Scoreboard = ({ players, currentRound, currentLeg, totalLegs, gameMode }: ScoreboardProps) => {
  return (
    <div className="glass-surface rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
            {gameMode}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {totalLegs > 1 && (
            <span className="text-xs font-display font-semibold text-primary">
              Leg {currentLeg}/{totalLegs}
            </span>
          )}
          <span className="text-xs font-display font-semibold text-muted-foreground">
            Runda {currentRound}
          </span>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-3">
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-3 transition-all ${
              player.isActive
                ? "score-gradient border border-primary/30 neon-glow"
                : "bg-secondary/50"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`font-display font-bold text-sm uppercase tracking-wide ${
                  player.isActive ? "text-primary neon-text-glow" : "text-secondary-foreground"
                }`}>
                  {player.name}
                </span>
                {totalLegs > 1 && (
                  <span className="text-[10px] font-display font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {player.legsWon}L
                  </span>
                )}
              </div>
              <span className={`font-display font-bold text-3xl tabular-nums ${
                player.isActive ? "text-foreground animate-score-pop" : "text-secondary-foreground"
              }`}>
                {player.score}
              </span>
            </div>

            {/* Last throws */}
            <div className="flex gap-1.5">
              {player.throws.map((t, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded flex items-center justify-center text-xs font-display font-bold ${
                    t >= 50
                      ? "bg-accent/20 text-accent"
                      : t >= 20
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {t}
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - player.throws.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="w-8 h-8 rounded bg-muted/50 border border-border/30"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scoreboard;
