import { RotateCcw, SkipForward, Plus, Settings, RefreshCw } from "lucide-react";

interface GameControlsProps {
  onUndo:        () => void;
  onNextPlayer:  () => void;
  onNewGame:     () => void;
  onSettings:    () => void;
  onResetBoard?: () => void;
}

const GameControls = ({
  onUndo,
  onNextPlayer,
  onNewGame,
  onSettings,
  onResetBoard,
}: GameControlsProps) => {
  return (
    <div className="glass-surface rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-4 gap-2">
        <button
          id="ctrl-undo"
          onClick={onUndo}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <RotateCcw className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Cofnij</span>
        </button>
        <button
          id="ctrl-next"
          onClick={onNextPlayer}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-primary/15 hover:bg-primary/25 transition-colors"
        >
          <SkipForward className="w-5 h-5 text-primary" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-primary">Dalej</span>
        </button>
        <button
          id="ctrl-new-game"
          onClick={onNewGame}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <Plus className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Nowa</span>
        </button>
        <button
          id="ctrl-settings"
          onClick={onSettings}
          className="flex flex-col items-center gap-1.5 py-3 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">Opcje</span>
        </button>
      </div>

      {/* Reset board — only renders when auto-detection is wired */}
      {onResetBoard && (
        <button
          id="ctrl-reset-board"
          onClick={onResetBoard}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-border/60 hover:bg-secondary/60 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
            Resetuj tablicę (wyjęto lotki)
          </span>
        </button>
      )}
    </div>
  );
};

export default GameControls;
