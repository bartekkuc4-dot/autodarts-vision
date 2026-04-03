/** DetectionToast
 * ---------------
 * Appears for TOAST_DURATION_MS after each auto-detection.
 * User can accept (OK) or reject (Popraw → undo + open ManualScorer).
 * Auto-accepts on timeout — shown as a progress bar draining to zero.
 */

import { useEffect, useRef } from "react";
import { Check, X, Target } from "lucide-react";
import type { DetectedDart } from "@/hooks/useAutoDetection";

const TOAST_DURATION_MS = 4_000;

interface DetectionToastProps {
  dart:      DetectedDart | null;
  onAccept:  () => void;
  onCorrect: () => void;
}

const DetectionToast = ({ dart, onAccept, onCorrect }: DetectionToastProps) => {
  const barRef      = useRef<HTMLDivElement>(null);
  const startRef    = useRef<number>(0);
  const rafRef      = useRef<number>(0);
  const acceptedRef = useRef(false);

  useEffect(() => {
    if (!dart) return;

    acceptedRef.current = false;
    startRef.current    = performance.now();

    const animate = (now: number) => {
      const elapsed  = now - startRef.current;
      const progress = Math.max(0, 1 - elapsed / TOAST_DURATION_MS);

      if (barRef.current) {
        barRef.current.style.width = `${progress * 100}%`;
      }

      if (progress > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else if (!acceptedRef.current) {
        acceptedRef.current = true;
        onAccept();
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [dart, onAccept]);

  if (!dart) return null;

  const handleAccept = () => {
    acceptedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onAccept();
  };

  const handleCorrect = () => {
    acceptedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onCorrect();
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-72 overflow-hidden rounded-2xl border border-primary/20 shadow-2xl bg-card/95 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-200">
      {/* Content */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Target className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground">
            Auto-wykryto
          </span>
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="font-display text-3xl font-black tracking-tight text-foreground">
            {dart.cls}
          </span>
          <span className="font-display text-xl font-bold text-primary">
            {dart.score} pkt
          </span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground self-center">
            {dart.confidence.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex border-t border-border/60">
        <button
          id="detection-toast-correct"
          onClick={handleCorrect}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-display font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Popraw
        </button>

        <div className="w-px bg-border/60" />

        <button
          id="detection-toast-ok"
          onClick={handleAccept}
          className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-display font-bold uppercase tracking-wider text-primary hover:bg-primary/10 transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          OK
        </button>
      </div>

      {/* Countdown progress bar */}
      <div
        ref={barRef}
        className="h-0.5 bg-primary transition-none"
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default DetectionToast;
