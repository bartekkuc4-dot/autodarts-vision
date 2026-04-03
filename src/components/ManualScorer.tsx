import { useState } from "react";
import { Undo2 } from "lucide-react";

interface ManualScorerProps {
  onScore: (segment: string, points: number) => void;
  playerName?: string;
  /** Controlled open state — leave undefined to use internal state */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ManualScorer = ({ onScore, playerName, isOpen: controlledOpen, onOpenChange }: ManualScorerProps) => {
  const [input, setInput] = useState("");
  const [localOpen, setLocalOpen] = useState(false);
  const isOpen = controlledOpen ?? localOpen;
  const setIsOpen = (v: boolean) => { setLocalOpen(v); onOpenChange?.(v); };

  const handleDigit = (d: string) => {
    if (input.length < 3) setInput((prev) => prev + d);
  };

  const handleBackspace = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 0) return;
    onScore(`${val}`, val);
    setInput("");
  };

  return (
    <div className="space-y-3">
      {playerName && (
        <p className="font-display text-sm font-bold uppercase tracking-wider text-primary">
          Twoja kolej, {playerName}!
        </p>
      )}

      <div className="flex items-center gap-2 bg-secondary/60 rounded-full p-1.5 pl-4">
        <input
          type="text"
          inputMode="none"
          readOnly
          value={input}
          placeholder="Wpisz wynik"
          className="flex-1 bg-transparent text-foreground font-display text-base font-semibold outline-none placeholder:text-muted-foreground/50"
        />
        <button
          onClick={handleSubmit}
          disabled={!input}
          className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-display text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40 hover:brightness-110"
        >
          Zatwierdź
        </button>
      </div>

      <div className="grid grid-cols-3 divide-x divide-y divide-border/30 border border-border/30 rounded-lg overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button
            key={n}
            onClick={() => handleDigit(String(n))}
            className="py-4 text-center font-display text-xl font-bold text-foreground hover:bg-secondary/60 active:bg-secondary transition-colors"
          >
            {n}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="py-4 flex items-center justify-center hover:bg-secondary/60 active:bg-secondary transition-colors"
        >
          <Undo2 className="w-5 h-5 text-muted-foreground" />
        </button>
        <button
          onClick={() => handleDigit("0")}
          className="py-4 text-center font-display text-xl font-bold text-foreground hover:bg-secondary/60 active:bg-secondary transition-colors"
        >
          0
        </button>
        <div />
      </div>
    </div>
  );
};

export default ManualScorer;
