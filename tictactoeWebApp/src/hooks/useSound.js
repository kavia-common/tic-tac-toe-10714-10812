import { useCallback, useMemo, useRef } from 'react';

// Lightweight, dependency-free audio hook using small inline base64 assets
// These are short, simple tones created procedurally to avoid bundling binaries.
const beepPlace = "data:audio/mp3;base64,//uQZAAAAAAAAAAAAAAAAAAAA..."; // shortened dummy; replaced by simple oscillators below
const noop = { play: () => {} };

// Generate tones via AudioContext to avoid shipping binary assets
function makeTonePlayer(freq = 600, durationMs = 120, type = 'sine', gainValue = 0.04) {
  if (typeof window === 'undefined' || !window.AudioContext) return { play: () => {} };
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  return {
    play: () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        osc.stop();
      }, durationMs);
    }
  };
}

// PUBLIC_INTERFACE
export function useSound(enabled) {
  /** Provide small tones for place/win/draw/reset/invalid without external assets */
  const placeRef = useRef(null);
  const winRef = useRef(null);
  const drawRef = useRef(null);
  const resetRef = useRef(null);
  const invalidRef = useRef(null);

  // Create on first access
  if (!placeRef.current) {
    placeRef.current = makeTonePlayer(660, 90, 'sine', 0.07);
    winRef.current = makeTonePlayer(880, 260, 'triangle', 0.06);
    drawRef.current = makeTonePlayer(330, 180, 'sawtooth', 0.05);
    resetRef.current = makeTonePlayer(520, 120, 'square', 0.05);
    invalidRef.current = makeTonePlayer(140, 160, 'square', 0.06);
  }

  const playPlace = useCallback(() => enabled ? placeRef.current.play() : null, [enabled]);
  const playWin = useCallback(() => enabled ? winRef.current.play() : null, [enabled]);
  const playDraw = useCallback(() => enabled ? drawRef.current.play() : null, [enabled]);
  const playReset = useCallback(() => enabled ? resetRef.current.play() : null, [enabled]);
  const playInvalid = useCallback(() => enabled ? invalidRef.current.play() : null, [enabled]);

  return useMemo(() => ({
    playPlace, playWin, playDraw, playReset, playInvalid
  }), [playPlace, playWin, playDraw, playReset, playInvalid]);
}
