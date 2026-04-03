/**
 * useAutoDetection
 * ----------------
 * Orchestrates the full auto-detection pipeline:
 *   1. Receives a base64 frame (from useMotionDetection via CameraView)
 *   2. POSTs it to the backend /predict endpoint
 *   3. Runs IoU-based spatial tracking to identify the *new* dart
 *   4. Calls onDetected(dart) with the result
 *
 * Spatial tracker algorithm:
 *   - Compare each new detection against prevDarts[] via IoU
 *   - Darts with maxIoU < IOU_THRESHOLD are candidates for "new"
 *   - If no candidate found (darts very close) → pick dart with lowest maxIoU
 *   - If fewer darts detected than before → pulling event → resetBoard()
 */

import { useCallback, useRef } from "react";
import { API_BASE } from "@/lib/api";

const IOU_THRESHOLD = 0.4;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DetectedDart {
  cls:        string;   // "T20", "D5", "B" …
  score:      number;
  confidence: number;
  bbox:       BBox;
}

interface UseAutoDetectionOptions {
  onDetected:    (dart: DetectedDart, frame: string) => void;
  onBoardReset?: () => void;
}

// ─── IoU helper ───────────────────────────────────────────────────────────────

function iou(a: BBox, b: BBox): number {
  const ix1 = Math.max(a.x1, b.x1);
  const iy1 = Math.max(a.y1, b.y1);
  const ix2 = Math.min(a.x2, b.x2);
  const iy2 = Math.min(a.y2, b.y2);
  if (ix2 <= ix1 || iy2 <= iy1) return 0;
  const inter = (ix2 - ix1) * (iy2 - iy1);
  const aArea = (a.x2 - a.x1) * (a.y2 - a.y1);
  const bArea = (b.x2 - b.x1) * (b.y2 - b.y1);
  return inter / (aArea + bArea - inter);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAutoDetection({
  onDetected,
  onBoardReset,
}: UseAutoDetectionOptions) {
  /** Darts we know are already on the board before the latest throw */
  const prevDartsRef = useRef<DetectedDart[]>([]);

  /** Clear board state (e.g. after player pulls darts, changes turn, new game) */
  const resetBoard = useCallback(() => {
    prevDartsRef.current = [];
    onBoardReset?.();
  }, [onBoardReset]);

  /** Process a captured frame: call API then run spatial tracker */
  const processFrame = useCallback(
    async (base64: string) => {
      let currentDarts: DetectedDart[];

      try {
        const res = await fetch(`${API_BASE}/predict`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ image: base64 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        currentDarts = (json.data.predictions as any[]).map((p) => ({
          cls:        p.class        as string,
          score:      p.score        as number,
          confidence: p.confidence   as number,
          bbox:       p.bbox         as BBox,
        }));
      } catch (err) {
        console.error("[AutoDetection] API error:", err);
        return;
      }

      const prev = prevDartsRef.current;

      // ── Layer 3: fewer darts → player pulled them out ─────────────────────
      if (currentDarts.length < prev.length) {
        prevDartsRef.current = currentDarts;
        onBoardReset?.();
        return;
      }

      // Nothing detected at all
      if (currentDarts.length === 0) return;

      // ── Spatial tracker ────────────────────────────────────────────────────
      const withIoU = currentDarts.map((dart) => {
        const maxIou =
          prev.length === 0
            ? 0
            : Math.max(...prev.map((p) => iou(dart.bbox, p.bbox)));
        return { dart, maxIou };
      });

      // Genuine new darts: low IoU with every previous dart
      const genuinelyNew = withIoU.filter((d) => d.maxIou < IOU_THRESHOLD);

      let selected: DetectedDart | null = null;

      if (genuinelyNew.length > 0) {
        // Pick highest-confidence among truly new
        selected = genuinelyNew.reduce((best, d) =>
          d.dart.confidence > best.dart.confidence ? d : best
        ).dart;
      } else if (prev.length > 0) {
        // Fallback: darts very close together — pick the one least matching prev
        selected = withIoU.reduce((best, d) =>
          d.maxIou < best.maxIou ? d : best
        ).dart;
      } else {
        // First dart on board ever
        selected = withIoU.reduce((best, d) =>
          d.dart.confidence > best.dart.confidence ? d : best
        ).dart;
      }

      prevDartsRef.current = currentDarts;

      if (selected) {
        onDetected(selected, base64);
      }
    },
    [onDetected, onBoardReset]
  );

  return { processFrame, resetBoard };
}
