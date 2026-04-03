/**
 * useMotionDetection
 * ------------------
 * Detects dart-throw events via frame differencing on a low-res canvas sample.
 *
 * State machine:
 *   IDLE ──► MOTION ──► STABILIZED ──► COOLDOWN ──► IDLE
 *
 * Three layers filter out hand-pulling events before a capture is triggered:
 *   Layer 1 – motion duration limit  (> MAX_MOTION_DURATION_MS → hand)
 *   Layer 2 – changed-pixel area     (> LARGE_MOTION_RATIO  → hand)
 *   Layer 3 – post-capture verify    handled in useAutoDetection (fewer darts = pulling)
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Configurable thresholds ────────────────────────────────────────────────
const SAMPLE_INTERVAL_MS      = 150;   // how often to sample (ms)
const STABLE_FRAMES_NEEDED    = 4;     // consecutive calm frames before capture
const COOLDOWN_MS             = 4_000; // pause after capture (ms)
const PIXEL_CHANGED_THRESHOLD = 10;    // per-pixel avg diff to count as "changed"
const SAMPLE_W                = 160;
const SAMPLE_H                = 120;

export interface MotionConfig {
  motionThreshold:  number;  // avg pixel diff → start MOTION  (default 15)
  settleThreshold:  number;  // avg pixel diff → settling       (default 8)
  largeMotionRatio: number;  // fraction of frame changed → hand (default 0.35)
  maxMotionDurationMs: number; // ms in MOTION before treating as hand (default 1500)
}

export const DEFAULT_MOTION_CONFIG: MotionConfig = {
  motionThreshold:     15,
  settleThreshold:     8,
  largeMotionRatio:    0.35,
  maxMotionDurationMs: 1_500,
};

export type MotionState = "idle" | "motion" | "cooldown";

interface UseMotionDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Master switch: when false the hook immediately returns to idle */
  isActive: boolean;
  /** Called with a full-resolution JPEG base64 when a dart stabilises */
  onFrame: (base64: string) => void;
  config?: Partial<MotionConfig>;
}

export function useMotionDetection({
  videoRef,
  isActive,
  onFrame,
  config,
}: UseMotionDetectionOptions) {
  const cfg = { ...DEFAULT_MOTION_CONFIG, ...config };

  const [motionState, setMotionState] = useState<MotionState>("idle");

  // Use refs for values accessed inside the setInterval closure
  const stateRef       = useRef<MotionState>("idle");
  const prevPixelsRef  = useRef<Uint8ClampedArray | null>(null);
  const stableCountRef = useRef(0);
  const motionStartRef = useRef<number | null>(null);

  const transition = useCallback((next: MotionState) => {
    stateRef.current = next;
    setMotionState(next);
  }, []);

  const captureFullRes = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement("canvas");
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [videoRef]);

  useEffect(() => {
    if (!isActive) {
      transition("idle");
      prevPixelsRef.current  = null;
      stableCountRef.current = 0;
      motionStartRef.current = null;
      return;
    }

    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width  = SAMPLE_W;
    sampleCanvas.height = SAMPLE_H;
    const ctx = sampleCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const tick = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (stateRef.current === "cooldown") return;

      // Draw downscaled frame and read pixels
      ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
      const { data: pixels } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);

      if (!prevPixelsRef.current) {
        prevPixelsRef.current = new Uint8ClampedArray(pixels);
        return;
      }

      // ── Compute per-frame stats ───────────────────────────────────────────
      let totalDiff    = 0;
      let changedCount = 0;
      const pixelCount = SAMPLE_W * SAMPLE_H;

      for (let i = 0; i < pixels.length; i += 4) {
        const diff =
          (Math.abs(pixels[i]     - prevPixelsRef.current[i])     +
           Math.abs(pixels[i + 1] - prevPixelsRef.current[i + 1]) +
           Math.abs(pixels[i + 2] - prevPixelsRef.current[i + 2])) / 3;
        totalDiff += diff;
        if (diff > PIXEL_CHANGED_THRESHOLD) changedCount++;
      }

      const avgDiff        = totalDiff / pixelCount;
      const changedRatio   = changedCount / pixelCount;
      prevPixelsRef.current = new Uint8ClampedArray(pixels);

      // ── State machine ─────────────────────────────────────────────────────
      if (stateRef.current === "idle") {
        if (avgDiff > cfg.motionThreshold) {
          transition("motion");
          stableCountRef.current = 0;
          motionStartRef.current = Date.now();
        }
        return;
      }

      if (stateRef.current === "motion") {
        const elapsed = Date.now() - (motionStartRef.current ?? Date.now());

        // Layer 1: motion lasted too long → hand reaching in
        if (elapsed > cfg.maxMotionDurationMs) {
          transition("idle");
          prevPixelsRef.current  = null;
          stableCountRef.current = 0;
          motionStartRef.current = null;
          return;
        }

        // Layer 2: too large an area changed → hand, not dart
        if (changedRatio > cfg.largeMotionRatio) {
          transition("idle");
          prevPixelsRef.current  = null;
          stableCountRef.current = 0;
          motionStartRef.current = null;
          return;
        }

        // Settling check
        if (avgDiff < cfg.settleThreshold) {
          stableCountRef.current++;
          if (stableCountRef.current >= STABLE_FRAMES_NEEDED) {
            // Dart has stabilised — capture and enter cooldown
            transition("cooldown");
            stableCountRef.current = 0;
            motionStartRef.current = null;

            const base64 = captureFullRes();
            if (base64) onFrame(base64);

            setTimeout(() => {
              transition("idle");
              prevPixelsRef.current = null;
            }, COOLDOWN_MS);
          }
        } else {
          stableCountRef.current = 0;
        }
      }
    };

    const interval = setInterval(tick, SAMPLE_INTERVAL_MS);
    return () => clearInterval(interval);

    // cfg values are primitives — spreading them into deps array is fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isActive,
    videoRef,
    onFrame,
    captureFullRes,
    transition,
    cfg.motionThreshold,
    cfg.settleThreshold,
    cfg.largeMotionRatio,
    cfg.maxMotionDurationMs,
  ]);

  return { motionState };
}
