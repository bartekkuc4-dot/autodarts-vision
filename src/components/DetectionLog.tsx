import { Crosshair, Clock } from "lucide-react";

interface Detection {
  id: number;
  segment: string;
  score: number;
  confidence: number;
  timestamp: string;
}

interface DetectionLogProps {
  detections: Detection[];
}

const DetectionLog = ({ detections }: DetectionLogProps) => {
  return (
    <div className="glass-surface rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary" />
        <span className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
          Detekcje
        </span>
      </div>

      <div className="space-y-1.5 max-h-36 overflow-y-auto">
        {detections.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Brak wykrytych rzutów
          </p>
        ) : (
          detections.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  d.score >= 50 ? "bg-accent" : d.score >= 20 ? "bg-primary" : "bg-muted-foreground"
                }`} />
                <span className="text-xs font-display font-semibold text-foreground">
                  {d.segment}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({(d.confidence * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-bold text-primary">
                  +{d.score}
                </span>
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{d.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DetectionLog;
