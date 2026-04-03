import { Trophy, PartyPopper, RotateCcw } from "lucide-react";

interface WinnerOverlayProps {
  winner: string;
  onNewGame: () => void;
  onPlayAgain: () => void;
}

const WinnerOverlay = ({ winner, onNewGame, onPlayAgain }: WinnerOverlayProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-6 p-8 text-center">
        <PartyPopper className="h-16 w-16 text-primary animate-bounce" />
        <div className="space-y-2">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-foreground">
            Zwycięzca!
          </h2>
          <p className="font-display text-4xl font-bold text-primary neon-text-glow">
            {winner}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 neon-glow"
          >
            <RotateCcw className="h-4 w-4" />
            Zagraj ponownie
          </button>
          <button
            onClick={onNewGame}
            className="glass-surface flex items-center gap-2 rounded-lg px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary"
          >
            <Trophy className="h-4 w-4" />
            Nowa gra
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerOverlay;
