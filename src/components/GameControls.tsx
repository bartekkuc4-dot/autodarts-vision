import { RotateCcw, SkipForward, Plus, Settings } from "lucide-react";

interface GameControlsProps {
  onUndo: () => void;
  onNextPlayer: () => void;
  onNewGame: () => void;
  onSettings: () => void;
}

const GameControls = ({ onUndo, onNextPlayer, onNewGame, onSettings }: GameControlsProps) => {
  return (
    <div className="glass-surface rounded-lg p-3">
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onUndo}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Cofnij</span>
        </button>
        <button
          onClick={onNextPlayer}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-primary/15 hover:bg-primary/25 transition-colors"
        >
          <SkipForward className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-primary">Dalej</span>
        </button>
        <button
          onClick={onNewGame}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Nowa</span>
        </button>
        <button
          onClick={onSettings}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Opcje</span>
        </button>
      </div>
    </div>
  );
};

export default GameControls;
