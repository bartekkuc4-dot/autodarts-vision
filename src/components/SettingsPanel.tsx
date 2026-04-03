/** SettingsPanel
 * --------------
 * Bottom-sheet panel with:
 *   - Auto-detection toggle (on/off)
 *   - Slider: motion sensitivity (motionThreshold)
 *   - Slider: hand-filter ratio (largeMotionRatio)
 */

import { Sliders, X } from "lucide-react";

export interface MotionSettings {
  enabled:          boolean;
  motionThreshold:  number;
  largeMotionRatio: number;
}

export const DEFAULT_SETTINGS: MotionSettings = {
  enabled:          true,
  motionThreshold:  15,
  largeMotionRatio: 0.35,
};

interface SettingsPanelProps {
  settings: MotionSettings;
  onChange: (s: MotionSettings) => void;
  onClose:  () => void;
}

const SettingsPanel = ({ settings, onChange, onClose }: SettingsPanelProps) => {
  const set = <K extends keyof MotionSettings>(key: K, value: MotionSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-lg rounded-t-2xl border border-border bg-card/95 backdrop-blur-md p-5 pb-8 space-y-6 animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-bold uppercase tracking-wider">
              Ustawienia detekcji
            </span>
          </div>
          <button
            id="settings-close"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-display font-semibold">Auto-detekcja</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kamera wykrywa lotki automatycznie
            </p>
          </div>
          <button
            id="settings-toggle-autodetect"
            onClick={() => set("enabled", !settings.enabled)}
            aria-pressed={settings.enabled}
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus-visible:outline-none ${
              settings.enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                settings.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Motion threshold */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-semibold">Czułość ruchu</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Niżej = bardziej czuły (więcej false-positive)
              </p>
            </div>
            <span className="font-mono text-sm text-primary font-bold w-8 text-right">
              {settings.motionThreshold}
            </span>
          </div>
          <input
            id="settings-slider-motion"
            type="range"
            min={5}
            max={40}
            step={1}
            value={settings.motionThreshold}
            onChange={(e) => set("motionThreshold", Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>5 — bardzo czuły</span>
            <span>40 — mało czuły</span>
          </div>
        </div>

        {/* Large motion ratio */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-display font-semibold">Filtr dłoni</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Jeśli zmieniony obszar {">"} X% to dloni, nie lotka
              </p>
            </div>
            <span className="font-mono text-sm text-primary font-bold w-8 text-right">
              {Math.round(settings.largeMotionRatio * 100)}%
            </span>
          </div>
          <input
            id="settings-slider-hand"
            type="range"
            min={10}
            max={60}
            step={5}
            value={Math.round(settings.largeMotionRatio * 100)}
            onChange={(e) => set("largeMotionRatio", Number(e.target.value) / 100)}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>10%</span>
            <span>60%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
