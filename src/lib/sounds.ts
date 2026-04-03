// Sound effects & voice narrator for AutoDarts Vision
// Uses Web Audio API for SFX and SpeechSynthesis for voice

const audioCtx = () => {
  if (!(window as any).__dartAudioCtx) {
    (window as any).__dartAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return (window as any).__dartAudioCtx as AudioContext;
};

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playHitSound(points: number) {
  if (points === 0) {
    // Miss – low dull thud
    playTone(120, 0.15, "triangle", 0.2);
  } else if (points >= 50) {
    // High score – bright double beep
    playTone(880, 0.1, "sine", 0.3);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.3), 100);
  } else if (points >= 20) {
    // Medium – pleasant beep
    playTone(660, 0.12, "sine", 0.25);
  } else {
    // Low score – simple click
    playTone(440, 0.08, "sine", 0.2);
  }
}

export function playBustSound() {
  // Descending error tones
  playTone(400, 0.15, "square", 0.2);
  setTimeout(() => playTone(300, 0.15, "square", 0.2), 150);
  setTimeout(() => playTone(200, 0.25, "square", 0.2), 300);
}

export function playWinSound() {
  // Victory fanfare – ascending tones
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, "sine", 0.3), i * 150);
  });
}

// ── Voice narrator using SpeechSynthesis ─────────────────

let voiceEnabled = true;

export function setVoiceEnabled(enabled: boolean) {
  voiceEnabled = enabled;
}

export function isVoiceEnabled() {
  return voiceEnabled;
}

function speak(text: string, rate = 1.1) {
  if (!voiceEnabled || !window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pl-PL";
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.volume = 1;

  // Try to pick a Polish voice, fallback to default
  const voices = window.speechSynthesis.getVoices();
  const plVoice = voices.find((v) => v.lang.startsWith("pl"));
  if (plVoice) utterance.voice = plVoice;

  window.speechSynthesis.speak(utterance);
}

export function announceThrow(segment: string, points: number, remainingScore: number) {
  if (points === 0) {
    speak("Pudło", 1.2);
  } else {
    speak(`${segment}, ${points} punktów. Pozostało ${remainingScore}.`, 1.1);
  }
}

export function announceBust(playerName: string) {
  speak(`Bust! ${playerName}, spalony rzut.`, 1.0);
}

export function announceWinner(playerName: string) {
  setTimeout(() => {
    speak(`Gratulacje! ${playerName} wygrywa grę!`, 0.9);
  }, 600);
}

export function announceNextPlayer(playerName: string) {
  speak(`Kolej: ${playerName}`, 1.2);
}
