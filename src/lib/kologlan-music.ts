"use client";

/**
 * Keloğlan arka plan müziği.
 *
 * `public/audio/keloglan-muzik.mp3` dosyasını döngüde çalar. Konuşma sırasında
 * ses seviyesi otomatik olarak düşürülür; böylece kelime sesi bastırılmaz.
 *
 * Tarayıcılar kullanıcı etkileşimi olmadan sesli otomatik oynatmayı engellediği
 * için müzik ilk dokunuşta başlar.
 */

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const AUDIO_URL = `${BASE_PATH}/audio/keloglan-muzik.mp3`;

/** Konuşma yokken müziğin seviyesi. */
const BASE_VOLUME = 0.22;
/** Konuşma sırasında müziğin seviyesi. */
const DUCKED_VOLUME = 0.06;
const FADE_IN = 1.2;
const DUCK_FADE = 0.18;
const RESTORE_FADE = 0.45;
const STOP_FADE = 0.6;

type AudioContextConstructor = typeof AudioContext;

function audioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scoped = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? scoped.webkitAudioContext;
}

export class KologlanMusic {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;
  private audio: HTMLAudioElement | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private pauseTimer: number | null = null;
  private started = false;
  private ducked = false;
  private disposed = false;

  get playing(): boolean {
    return this.started;
  }

  get supported(): boolean {
    return audioContextConstructor() !== undefined && typeof Audio !== "undefined";
  }

  async start(): Promise<void> {
    if (this.disposed) return;

    const Context = audioContextConstructor();
    if (!Context) return;
    if (!this.ctx) {
      try {
        this.build(Context);
      } catch {
        return;
      }
    }

    const ctx = this.ctx;
    const audio = this.audio;
    if (!ctx || !audio) return;

    if (this.pauseTimer !== null) {
      window.clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    if (!this.started) {
      try {
        await audio.play();
      } catch {
        // Otomatik oynatma engellendi; sonraki dokunuşta yeniden denenecek.
        return;
      }
      this.started = true;
    }

    this.rampGain(this.ducked ? DUCKED_VOLUME : BASE_VOLUME, FADE_IN);
  }

  stop(): void {
    if (this.pauseTimer !== null) window.clearTimeout(this.pauseTimer);

    const ctx = this.ctx;
    const audio = this.audio;
    if (!ctx || !audio) return;

    this.rampGain(0.0001, STOP_FADE);
    this.pauseTimer = window.setTimeout(() => {
      this.pauseTimer = null;
      audio.pause();
      this.started = false;
      this.ducked = false;
    }, STOP_FADE * 1000 + 40);
  }

  /** Konuşma başlarken müziği kıs. */
  duck(): void {
    this.ducked = true;
    if (this.started) this.rampGain(DUCKED_VOLUME, DUCK_FADE);
  }

  /** Konuşma bitince müziği eski seviyesine getir. */
  unduck(): void {
    this.ducked = false;
    if (this.started) this.rampGain(BASE_VOLUME, RESTORE_FADE);
  }

  suspend(): void {
    if (this.ctx?.state === "running") void this.ctx.suspend();
  }

  resume(): void {
    if (this.started && this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
  }

  dispose(): void {
    this.disposed = true;
    if (this.pauseTimer !== null) {
      window.clearTimeout(this.pauseTimer);
      this.pauseTimer = null;
    }

    this.started = false;
    this.audio?.pause();
    this.audio?.remove();
    this.source?.disconnect();
    this.gain?.disconnect();

    const ctx = this.ctx;
    this.ctx = null;
    this.gain = null;
    this.audio = null;
    this.source = null;
    if (ctx) void ctx.close().catch(() => {});
  }

  private build(Context: AudioContextConstructor): void {
    const ctx = new Context();

    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(ctx.destination);

    const audio = new Audio(AUDIO_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.setAttribute("playsinline", "");
    audio.style.display = "none";
    document.body.appendChild(audio);

    const source = ctx.createMediaElementSource(audio);
    source.connect(gain);

    this.ctx = ctx;
    this.gain = gain;
    this.audio = audio;
    this.source = source;
  }

  private rampGain(value: number, seconds: number): void {
    const ctx = this.ctx;
    const gain = this.gain;
    if (!ctx || !gain) return;

    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), now);
    gain.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), now + seconds);
  }
}
