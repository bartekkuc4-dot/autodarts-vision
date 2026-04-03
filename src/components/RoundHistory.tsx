import { useState } from "react";
import { History, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { RoundHistoryEntry } from "@/hooks/useGameEngine";

interface RoundHistoryProps {
  history: RoundHistoryEntry[];
  playerNames: string[];
}

const RoundHistory = ({ history, playerNames }: RoundHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterPlayer, setFilterPlayer] = useState<string | null>(null);

  const filtered = filterPlayer
    ? history.filter((e) => e.playerName === filterPlayer)
    : history;

  // Group by leg → round
  const grouped = filtered.reduce<Record<string, RoundHistoryEntry[]>>((acc, entry) => {
    const key = `L${entry.leg}-R${entry.round}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);

  if (history.length === 0) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="glass-surface rounded-lg p-3 w-full flex items-center justify-center gap-2 hover:bg-secondary/60 transition-colors"
      >
        <History className="w-4 h-4 text-primary" />
        <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
          Historia rund ({history.length})
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="glass-surface rounded-lg p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
            Historia rund
          </span>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-secondary transition-colors">
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Player filter */}
      {playerNames.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterPlayer(null)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
              !filterPlayer ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground hover:bg-secondary/60"
            }`}
          >
            Wszyscy
          </button>
          {playerNames.map((name) => (
            <button
              key={name}
              onClick={() => setFilterPlayer(filterPlayer === name ? null : name)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-display font-bold uppercase tracking-wider transition-colors ${
                filterPlayer === name ? "bg-primary/20 text-primary border border-primary/40" : "bg-muted/30 text-muted-foreground hover:bg-secondary/60"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Rounds list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {groupKeys.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Brak historii</p>
        ) : (
          [...groupKeys].reverse().map((key) => {
            const entries = grouped[key];
            const first = entries[0];
            return (
              <div key={key} className="space-y-1">
                {/* Round header */}
                <div className="flex items-center gap-1.5 px-1">
                  {first.leg > 1 && (
                    <span className="text-[9px] font-display font-bold text-primary uppercase">L{first.leg}</span>
                  )}
                  <span className="text-[9px] font-display font-bold text-muted-foreground uppercase">R{first.round}</span>
                </div>

                {entries.map((entry, idx) => (
                  <div
                    key={`${key}-${idx}`}
                    className={`flex items-center justify-between py-1.5 px-2.5 rounded ${
                      entry.bust ? "bg-accent/5 border border-accent/20" : "bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-display font-semibold text-foreground min-w-[60px]">
                        {entry.playerName}
                      </span>
                      <div className="flex gap-1">
                        {entry.throws.map((t, ti) => (
                          <span
                            key={ti}
                            className={`text-[10px] font-display font-bold px-1.5 py-0.5 rounded ${
                              t.points >= 50
                                ? "bg-accent/15 text-accent"
                                : t.points >= 20
                                ? "bg-primary/10 text-primary"
                                : "bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {t.segment}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {entry.bust && <AlertTriangle className="w-3 h-3 text-accent" />}
                      <span
                        className={`text-xs font-display font-bold tabular-nums ${
                          entry.bust ? "text-accent line-through" : "text-primary"
                        }`}
                      >
                        {entry.totalPoints}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RoundHistory;
