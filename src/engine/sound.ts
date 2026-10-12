// Small synthesized sound effects (no audio files) plus a light haptic tap where the device supports it.
// The on/off choice is a per-device convenience, so it lives in localStorage.

const KEY = 'fund-balance-sound';
let ctx: AudioContext | null = null;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    // storage unavailable; the setting just won't persist
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', gain = 0.16) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function buzz(ms: number | number[]) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // not supported
  }
}

export const sfx = {
  correct(combo = 0) {
    buzz(12);
    if (!soundOn()) return;
    const lift = Math.min(combo, 6) * 0.04; // each answer in a streak climbs a little
    tone(660 * (1 + lift), 0, 0.14, 'triangle');
    tone(990 * (1 + lift), 0.09, 0.22, 'triangle');
  },
  wrong() {
    buzz([30, 40, 30]);
    if (!soundOn()) return;
    tone(220, 0, 0.18, 'square', 0.06);
    tone(185, 0.12, 0.24, 'square', 0.06);
  },
  complete() {
    buzz([20, 60, 20, 60, 40]);
    if (!soundOn()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.1, 0.3, 'triangle', 0.14));
    tone(1319, 0.42, 0.5, 'sine', 0.1);
  },
  tap() {
    if (!soundOn()) return;
    tone(880, 0, 0.05, 'sine', 0.05);
  },
};
