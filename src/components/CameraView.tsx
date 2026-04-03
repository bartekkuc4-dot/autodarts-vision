import { Camera, Video, VideoOff } from "lucide-react";
import { useState } from "react";

const CameraView = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted/30">
      {/* Camera feed placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
        {isActive ? (
          <>
            {/* Simulated camera grid overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60" />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-primary/10" />
              ))}
            </div>
            {/* Dartboard detection zone */}
            <div className="absolute inset-8 border-2 border-primary/40 rounded-full animate-pulse-neon" />
            <div className="absolute inset-16 border border-primary/20 rounded-full" />
            {/* Status indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 glass-surface rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
              <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Live</span>
            </div>
            <div className="absolute top-4 right-4 glass-surface rounded-full px-3 py-1.5">
              <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Wykrywanie...</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
              <Camera className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground font-body">Kliknij aby uruchomić kamerę</p>
          </>
        )}
      </div>

      {/* Camera toggle button */}
      <button
        onClick={() => setIsActive(!isActive)}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 glass-surface rounded-full px-6 py-2.5 flex items-center gap-2 hover:bg-secondary/80 transition-colors"
      >
        {isActive ? (
          <>
            <VideoOff className="w-4 h-4 text-accent" />
            <span className="text-sm font-display font-semibold text-accent">Zatrzymaj</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4 text-primary" />
            <span className="text-sm font-display font-semibold text-primary">Uruchom kamerę</span>
          </>
        )}
      </button>
    </div>
  );
};

export default CameraView;
