/**
 * StockSense Web Audio Feedback Synthesizer
 * 
 * Provides tactile auditory confirmation for warehouse optical scanning:
 * - 800Hz pure sine chime (120ms) for valid scan registration.
 * - 220Hz low square buzz (280ms) for unknown / rejected barcodes.
 * 
 * Operates without external audio files or MP3 network dependencies.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a high-frequency positive confirmation chime (800Hz, 120ms)
   */
  public playScanSuccess(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      // Frequency slide up slightly for a satisfying physical beep tone
      osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio autoplay policy fail-safe; ignore silently
    }
  }

  /**
   * Plays a low-frequency alert buzz (220Hz, 280ms) for unrecognized barcodes
   */
  public playScanError(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } catch {
      // Audio autoplay policy fail-safe; ignore silently
    }
  }
}

export const soundEffects = new SoundSynthesizer();
