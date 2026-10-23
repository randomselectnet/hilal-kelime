"use client";

/**
 * Keloğlan havası — Web Audio ile üretilen, telif gerektirmeyen bir Anadolu
 * ezgisi. Bağlama benzeri mızraplı bir melodi, altında uzun bir dem, hafif bir
 * deff/davul vuruşu ve kısa bir oda yankısı vardır.
 *
 * Ses dosyası yoktur; her şey tarayıcıda sentezlenir. Böylece sayfa hızlı açılır,
 * harici istek ya da lisans sorunu olmaz.
 */

const TEMPO = 104;
/** Sekizlik nota süresi (saniye). */
const STEP = 60 / TEMPO / 2;
const LOOKAHEAD = 0.45;
const TICK_MS = 120;
const TARGET_VOLUME = 0.17;

const NOTE: Record<string, number> = {
  A2: 110.0,
  Bb2: 116.54,
  D3: 146.83,
  E3: 164.81,
  A3: 220.0,
  Bb3: 233.08,
  C4: 261.63,
  "C#4": 277.18,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  Bb4: 466.16,
  "C#5": 554.37,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

type Slot = { note: string | null; length: number };

/**
 * Hicaz renkli, 16 ölçülük (2/4) bir ezgi. `length` sekizlik cinsindendir.
 * Toplam 64 sekizlik = 16 ölçü.
 */
const MELODY: Slot[] = [
  { note: "A4", length: 1 },
  { note: null, length: 1 },
  { note: "C#5", length: 1 },
  { note: "D5", length: 1 },
  { note: "E5", length: 2 },
  { note: "D5", length: 2 },
  { note: "C#5", length: 1 },
  { note: null, length: 1 },
  { note: "Bb4", length: 1 },
  { note: "A4", length: 1 },
  { note: "Bb4", length: 4 },

  { note: "A4", length: 1 },
  { note: null, length: 1 },
  { note: "C#5", length: 1 },
  { note: "D5", length: 1 },
  { note: "E5", length: 1 },
  { note: "F5", length: 1 },
  { note: "E5", length: 1 },
  { note: "D5", length: 1 },
  { note: "C#5", length: 1 },
  { note: null, length: 1 },
  { note: "Bb4", length: 1 },
  { note: "A4", length: 1 },
  { note: "A4", length: 4 },

  { note: "D5", length: 1 },
  { note: null, length: 1 },
  { note: "E5", length: 1 },
  { note: "F5", length: 1 },
  { note: "G5", length: 2 },
  { note: "F5", length: 2 },
  { note: "D5", length: 1 },
  { note: "C#5", length: 1 },
  { note: "Bb4", length: 1 },
  { note: "A4", length: 1 },
  { note: "Bb4", length: 4 },

  { note: "A5", length: 1 },
  { note: null, length: 1 },
  { note: "G5", length: 1 },
  { note: "F5", length: 1 },
  { note: "E5", length: 2 },
  { note: "D5", length: 1 },
  { note: "C#5", length: 1 },
  { note: "Bb4", length: 1 },
  { note: "C#5", length: 1 },
  { note: "D5", length: 1 },
  { note: "E5", length: 1 },
  { note: "A4", length: 4 },
];

/** Her ölçünün (4 sekizlik) bas sesi. */
const BASS = [
  "A2", "E3", "A2", "A2", "E3", "A2", "Bb2", "A2",
  "D3", "D3", "A2", "E3", "A2", "E3", "Bb2", "A2",
];

const TOTAL_STEPS = BASS.length * 4;

/** Melodi notalarını sekizlik adım haritasına çevir. */
function buildSteps(): (Slot | null)[] {
  const steps: (Slot | null)[] = [];
  for (const slot of MELODY) {
    steps.push(slot);
    for (let i = 1; i < slot.length; i += 1) steps.push(null);
  }
  return steps;
}

const MELODY_STEPS = buildSteps();

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
  private bus: GainNode | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;

  get playing(): boolean {
    return this.timer !== null;
  }

  get supported(): boolean {
    return audioContextConstructor() !== undefined;
  }

  async start(): Promise<void> {
    const Context = audioContextConstructor();
    if (!Context) return;

    if (!this.ctx) this.build(Context);
    const ctx = this.ctx;
    if (!ctx) return;

    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        return;
      }
    }

    if (this.timer !== null) return;

    const master = this.master;
    if (master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(TARGET_VOLUME, now + 1.4);
    }

    this.nextTime = ctx.currentTime + 0.12;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = this.ctx;
    const master = this.master;
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    }
  }

  suspend(): void {
    if (this.ctx?.state === "running") void this.ctx.suspend();
  }

  resume(): void {
    if (this.playing && this.ctx?.state === "suspended") {
      void this.ctx.resume();
    }
  }

  dispose(): void {
    this.stop();
    const ctx = this.ctx;
    this.ctx = null;
    this.bus = null;
    this.master = null;
    if (ctx) void ctx.close().catch(() => {});
  }

  /* ————— iç işleyiş ————— */

  private build(Context: AudioContextConstructor): void {
    const ctx = new Context();
    const master = ctx.createGain();
    master.gain.value = 0.0001;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 24;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.008;
    compressor.release.value = 0.25;

    const bus = ctx.createGain();
    bus.gain.value = 1;

    const dry = ctx.createGain();
    dry.gain.value = 0.78;

    const reverb = ctx.createConvolver();
    reverb.buffer = this.impulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;

    bus.connect(dry).connect(master);
    bus.connect(reverb).connect(wet).connect(master);
    master.connect(compressor).connect(ctx.destination);

    this.ctx = ctx;
    this.bus = bus;
    this.master = master;
    this.noise = this.noiseBuffer(ctx);
  }

  private tick(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step = (this.step + 1) % TOTAL_STEPS;
    }
  }

  private playStep(step: number, time: number): void {
    const slot = MELODY_STEPS[step];
    if (slot?.note) {
      const freq = NOTE[slot.note];
      if (freq) this.pluck(time, freq, Math.max(STEP * slot.length, 0.24) + 0.14, 0.26, false);
    }

    if (step % 4 === 0) {
      const bar = step / 4;
      const root = NOTE[BASS[bar] ?? "A2"];
      if (root) this.pluck(time, root, STEP * 3.4, 0.3, true);
    }

    const inBar = step % 4;
    if (inBar === 0) {
      this.drum(time, true);
    } else if (inBar === 2) {
      this.drum(time, false);
    }
  }

  /** Bağlama benzeri mızraplı ses. */
  private pluck(
    time: number,
    freq: number,
    duration: number,
    level: number,
    bass: boolean,
  ): void {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, time);
    env.gain.exponentialRampToValueAtTime(level, time + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = bass ? 0.7 : 1.1;
    filter.frequency.setValueAtTime(bass ? 620 : 3400, time);
    filter.frequency.exponentialRampToValueAtTime(bass ? 180 : 820, time + duration);

    const fundamental = ctx.createOscillator();
    fundamental.type = "sawtooth";
    fundamental.frequency.setValueAtTime(freq * 0.982, time);
    fundamental.frequency.exponentialRampToValueAtTime(freq, time + 0.045);

    const sheen = ctx.createOscillator();
    sheen.type = "triangle";
    sheen.frequency.setValueAtTime(freq * 1.006, time);
    sheen.frequency.exponentialRampToValueAtTime(freq * 1.002, time + 0.05);

    fundamental.connect(filter);
    sheen.connect(filter);
    filter.connect(env).connect(bus);

    const end = time + duration + 0.05;
    fundamental.start(time);
    sheen.start(time);
    fundamental.stop(end);
    sheen.stop(end);
  }

  /** Deff/davul: kalın "düm" ve ince "tek". */
  private drum(time: number, low: boolean): void {
    const ctx = this.ctx;
    const bus = this.bus;
    if (!ctx || !bus) return;

    const body = ctx.createOscillator();
    body.type = "sine";
    body.frequency.setValueAtTime(low ? 96 : 196, time);
    body.frequency.exponentialRampToValueAtTime(low ? 44 : 118, time + 0.16);

    const bodyGain = ctx.createGain();
    bodyGain.gain.setValueAtTime(low ? 0.34 : 0.1, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + (low ? 0.3 : 0.1));

    body.connect(bodyGain).connect(bus);
    body.start(time);
    body.stop(time + 0.32);

    const noise = this.noise;
    if (!noise) return;
    const source = ctx.createBufferSource();
    source.buffer = noise;

    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = low ? 900 : 2400;
    band.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(low ? 0.05 : 0.022, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);

    source.connect(band).connect(noiseGain).connect(bus);
    source.start(time, Math.random() * 0.1);
    source.stop(time + 0.08);
  }

  private impulse(ctx: AudioContext): AudioBuffer {
    const seconds = 1.8;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const decay = Math.pow(1 - i / length, 2.7);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    return buffer;
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.4);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
