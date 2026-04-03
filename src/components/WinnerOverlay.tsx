import { useEffect, useRef, useCallback } from "react";
import { Trophy, RotateCcw, Target, Flame, Crosshair, TrendingUp } from "lucide-react";
import type { PlayerState } from "@/hooks/useGameEngine";

interface WinnerOverlayProps {
  winner: string;
  players: PlayerState[];
  startingScore: number;
  onNewGame: () => void;
  onPlayAgain: () => void;
}

// ── Confetti canvas ──────────────────────────────────────
function useConfetti(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = [
      "hsl(145, 80%, 46%)",
      "hsl(0, 72%, 51%)",
      "hsl(45, 100%, 60%)",
      "hsl(200, 80%, 55%)",
      "hsl(280, 70%, 55%)",
      "hsl(30, 90%, 55%)",
    ];

    interface Particle {
      x: number;
      y: number;
      w: number;
      h: number;
      color: string;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const COUNT = 150;

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -window.innerHeight,
        w: 4 + Math.random() * 6,
        h: 8 + Math.random() * 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        opacity: 0.8 + Math.random() * 0.2,
      });
    }

    const loop = () => {
      if (!running) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.rotSpeed;
        p.vy += 0.02;
        p.opacity -= 0.001;

        if (p.y > window.innerHeight + 20) {
          p.y = -20;
          p.x = Math.random() * window.innerWidth;
          p.vy = 1.5 + Math.random() * 3;
          p.opacity = 0.8 + Math.random() * 0.2;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

// ── Stats helpers ────────────────────────────────────────
function getStats(player: PlayerState, startingScore: number) {
  const totalPoints = startingScore - player.score;
  const avg3 = player.totalThrows > 0 ? (totalPoints / player.totalThrows) * 3 : 0;

  return {
    totalPoints,
    totalThrows: player.totalThrows,
    rounds: player.rounds,
    avgPerRound: avg3,
  };
}

// ── Component ────────────────────────────────────────────
const WinnerOverlay = ({ winner, players, startingScore, onNewGame, onPlayAgain }: WinnerOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useConfetti(canvasRef);

  const winnerPlayer = players.find((p) => p.name === winner);
  const stats = winnerPlayer ? getStats(winnerPlayer, startingScore) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Confetti */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />

      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/85 backdrop-blur-lg" />

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-6 px-6 text-center animate-in zoom-in-90 fade-in duration-500">
        {/* Trophy icon */}
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20 neon-glow">
            <Trophy className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-ping" />
        </div>

        {/* Winner name */}
        <div className="space-y-1">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Zwycięzca
          </p>
          <h2 className="font-display text-4xl font-bold text-primary neon-text-glow">
            {winner}
          </h2>
        </div>

        {/* Stats grid */}
        {stats && (
          <div className="grid w-full grid-cols-2 gap-2">
            <StatCard
              icon={<Crosshair className="h-4 w-4 text-primary" />}
              label="Rzuty"
              value={String(stats.totalThrows)}
            />
            <StatCard
              icon={<Target className="h-4 w-4 text-primary" />}
              label="Rundy"
              value={String(stats.rounds)}
            />
            <StatCard
              icon={<TrendingUp className="h-4 w-4 text-primary" />}
              label="Śr. / 3 rzuty"
              value={stats.avgPerRound.toFixed(1)}
            />
            <StatCard
              icon={<Flame className="h-4 w-4 text-accent" />}
              label="Suma pkt"
              value={String(stats.totalPoints)}
            />
          </div>
        )}

        {/* All players ranking */}
        {players.length > 1 && (
          <div className="w-full space-y-1.5">
            <p className="text-[10px] font-display font-bold uppercase tracking-wider text-muted-foreground">
              Ranking
            </p>
            {[...players]
              .sort((a, b) => a.score - b.score)
              .map((p, i) => (
                <div
                  key={p.name}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                    p.name === winner
                      ? "score-gradient border border-primary/30"
                      : "bg-secondary/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display text-xs font-bold text-muted-foreground">
                      #{i + 1}
                    </span>
                    <span
                      className={`font-display text-sm font-bold ${
                        p.name === winner ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {p.name}
                    </span>
                  </div>
                  <span className="font-display text-sm font-bold tabular-nums text-muted-foreground">
                    {p.score} pkt
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex w-full gap-2">
          <button
            onClick={onPlayAgain}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 font-display text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:brightness-110 neon-glow"
          >
            <RotateCcw className="h-4 w-4" />
            Jeszcze raz
          </button>
          <button
            onClick={onNewGame}
            className="glass-surface flex flex-1 items-center justify-center gap-2 rounded-lg py-3 font-display text-sm font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary"
          >
            Nowa gra
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Stat card ────────────────────────────────────────────
const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="glass-surface flex flex-col items-center gap-1 rounded-lg py-3">
    {icon}
    <span className="font-display text-lg font-bold tabular-nums text-foreground">{value}</span>
    <span className="text-[9px] font-display font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
  </div>
);

export default WinnerOverlay;
