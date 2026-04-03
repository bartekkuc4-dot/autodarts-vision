import { Camera, Video, VideoOff } from "lucide-react";
import { useState, useRef, useCallback } from "react";

const CameraView = () => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Nie udało się uruchomić kamery. Sprawdź uprawnienia.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
  }, []);

  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted/30">
      {/* Live video element (always mounted, hidden when inactive) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
      />

      {isActive && (
        <>
          {/* Grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/60 pointer-events-none" />
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-primary/10" />
            ))}
          </div>
          {/* Dartboard detection zone */}
          <div className="absolute inset-8 border-2 border-primary/40 rounded-full animate-pulse-neon pointer-events-none" />
          <div className="absolute inset-16 border border-primary/20 rounded-full pointer-events-none" />
          {/* Status */}
          <div className="absolute top-4 left-4 flex items-center gap-2 glass-surface rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse-neon" />
            <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">Live</span>
          </div>
          <div className="absolute top-4 right-4 glass-surface rounded-full px-3 py-1.5">
            <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Wykrywanie...</span>
          </div>
        </>
      )}

      {!isActive && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <Camera className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-body">Kliknij aby uruchomić kamerę</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
            <VideoOff className="w-10 h-10 text-destructive" />
          </div>
          <p className="text-sm text-destructive text-center font-body">{error}</p>
        </div>
      )}

      {/* Camera toggle button */}
      <button
        onClick={isActive ? stopCamera : startCamera}
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
