import { useState } from "react";
import { X, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import {
  isSfxEnabled,
  setSfxEnabled,
  isVoiceEnabled,
  setVoiceEnabled,
} from "@/lib/sounds";

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel = ({ onClose }: SettingsPanelProps) => {
  const [sfx, setSfx] = useState(isSfxEnabled());
  const [voice, setVoice] = useState(isVoiceEnabled());

  const toggleSfx = () => {
    const next = !sfx;
    setSfx(next);
    setSfxEnabled(next);
  };

  const toggleVoice = () => {
    const next = !voice;
    setVoice(next);
    setVoiceEnabled(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 glass-surface rounded-xl p-5 space-y-5 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Ustawienia</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {sfx ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Efekty dźwiękowe</p>
              <p className="text-[10px] text-muted-foreground font-body">Dźwięki trafień, bustów i zwycięstwa</p>
            </div>
          </div>
          <button onClick={toggleSfx} className={`relative h-7 w-12 rounded-full transition-colors ${sfx ? "bg-primary" : "bg-secondary"}`}>
            <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow transition-transform ${sfx ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {voice ? <Mic className="w-5 h-5 text-primary" /> : <MicOff className="w-5 h-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Lektor</p>
              <p className="text-[10px] text-muted-foreground font-body">Głosowe odczytywanie punktów i zdarzeń</p>
            </div>
          </div>
          <button onClick={toggleVoice} className={`relative h-7 w-12 rounded-full transition-colors ${voice ? "bg-primary" : "bg-secondary"}`}>
            <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-foreground shadow transition-transform ${voice ? "translate-x-[22px]" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
