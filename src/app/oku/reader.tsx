"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crescent } from "@/components/crescent";
import { WordImage } from "@/components/word-image";
import { KologlanMusic } from "@/lib/kologlan-music";
import { artFor } from "@/lib/word-art";
import { imageFor } from "@/lib/word-images";
import { pad, wordCount, words } from "@/lib/words";

type Phase = "intro" | "playing" | "paused";

const SPEEDS = [0.85, 1, 1.15];

/** Kız çocuk tonuna yaklaşmak için perde yükseltilir. */
const CHILD_PITCH = 1.55;

const FEMALE_HINTS = [
  "filiz",
  "yelda",
  "seda",
  "emel",
  "aylin",
  "zeynep",
  "elif",
  "melis",
  "dilara",
  "ece",
  "female",
  "kadın",
  "kadin",
  "kız",
  "kiz",
  "girl",
  "child",
  "çocuk",
  "cocuk",
  "genç",
  "genc",
  "young",
];

const MALE_HINTS = [
  "tolga",
  "ahmet",
  "mehmet",
  "emre",
  "mert",
  "burak",
  "fatih",
  "male",
  "erkek",
  "man",
];

function voiceScore(voice: SpeechSynthesisVoice): number {
  const name = voice.name.toLowerCase();
  let score = 0;
  if (FEMALE_HINTS.some((hint) => name.includes(hint))) score += 100;
  if (MALE_HINTS.some((hint) => name.includes(hint))) score -= 100;
  if (voice.localService) score += 5;
  return score;
}

function pickTurkishVoice(
  list: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  return list
    .filter((voice) => voice.lang?.toLowerCase().startsWith("tr"))
    .sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

export default function Reader() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceLabel, setVoiceLabel] = useState<string | null>(null);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const music = useRef<KologlanMusic | null>(null);
  const finished = index >= words.length;

  /* ——— sesi hazırla ——— */
  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    if (!ok) return;

    const loadVoices = () => {
      const list = window.speechSynthesis.getVoices();
      voices.current = list;
      const turkish = pickTurkishVoice(list);
      if (turkish) setVoiceLabel(turkish.name);
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    const synth = window.speechSynthesis;

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      synth.cancel();
    };
  }, []);

  /* ——— Keloğlan havası ——— */
  const ensureMusic = useCallback(() => {
    if (!music.current) music.current = new KologlanMusic();
    return music.current;
  }, []);

  const autoplayTried = useRef(false);

  /* Sayfa açılır açılmaz dene; tarayıcı engellerse ilk dokunuşta başlar. */
  useEffect(() => {
    if (autoplayTried.current || !musicOn) return;
    autoplayTried.current = true;
    void ensureMusic().start();
  }, [ensureMusic, musicOn]);

  const toggleMusic = useCallback(() => {
    const player = ensureMusic();

    // Müzik "açık" görünüp otomatik oynatma engellendiyse ilk dokunuş başlatır.
    if (musicOn && !player.playing) {
      player.unduck();
      void player.start();
      return;
    }

    const next = !musicOn;
    setMusicOn(next);
    if (next) {
      void player.start();
      if (phase === "playing" && !finished) player.duck();
      else player.unduck();
    } else {
      player.stop();
    }
  }, [ensureMusic, musicOn, phase, finished]);

  useEffect(() => {
    if (!finished) return;
    music.current?.stop();
  }, [finished]);

  /* Konuşurken müziği kıs, duraklatınca/sessizken aç. */
  useEffect(() => {
    const player = music.current;
    if (!player || finished) return;
    if (phase === "playing" && !muted) player.duck();
    else player.unduck();
  }, [phase, finished, muted]);

  /* Tarayıcı otomatik oynatmayı engellediği için ilk dokunuşta başlat. */
  useEffect(() => {
    if (phase !== "intro" || !musicOn) return;

    function cleanup() {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    }

    function unlock(event: Event) {
      const target = event.target as Element | null;
      if (target?.closest("[data-music-toggle]")) return;
      cleanup();
      const player = ensureMusic();
      player.unduck();
      void player.start();
    }

    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return cleanup;
  }, [ensureMusic, musicOn, phase]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) music.current?.suspend();
      else music.current?.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      music.current?.dispose();
      music.current = null;
    };
  }, []);

  /* ——— sıradaki kelimelerin resimlerini önden yükle ——— */
  useEffect(() => {
    if (phase !== "playing") return;
    for (let ahead = 0; ahead <= 2; ahead += 1) {
      const upcoming = words[index + ahead];
      if (!upcoming) continue;
      for (const url of [imageFor(upcoming), artFor(upcoming)]) {
        if (!url) continue;
        const image = new window.Image();
        image.src = url;
      }
    }
  }, [index, phase]);

  /* ——— sıradaki kelimeyi oku ——— */
  useEffect(() => {
    if (phase !== "playing") return;
    if (index >= words.length) return;

    const word = words[index];
    const canSpeak =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    const useVoice = canSpeak && !muted;
    let finished = false;
    let holdTimer: number | undefined;
    let guardTimer: number | undefined;

    const advance = () => {
      if (finished) return;
      finished = true;
      holdTimer = window.setTimeout(() => setIndex((i) => i + 1), 760);
    };

    if (useVoice) {
      const synth = window.speechSynthesis;
      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "tr-TR";
      utterance.rate = speed;
      utterance.pitch = CHILD_PITCH;
      utterance.volume = 1;

      const voice = pickTurkishVoice(voices.current);
      if (voice) {
        try {
          utterance.voice = voice;
        } catch {
          // Bazı tarayıcılar ses nesnesini reddedebilir; varsayılan sesle devam et.
        }
      }

      utterance.onend = advance;
      utterance.onerror = advance;

      guardTimer = window.setTimeout(advance, 5000);
      synth.speak(utterance);
    } else {
      holdTimer = window.setTimeout(() => setIndex((i) => i + 1), 2400);
    }

    return () => {
      finished = true;
      if (holdTimer) window.clearTimeout(holdTimer);
      if (guardTimer) window.clearTimeout(guardTimer);
      if (useVoice) window.speechSynthesis.cancel();
    };
  }, [index, phase, muted, speed]);

  /* ——— okurken ekran kapanmasın ——— */
  useEffect(() => {
    if (phase !== "playing" || finished) return;
    type Sentinel = { release: () => Promise<void> };
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<Sentinel> };
    };
    let sentinel: Sentinel | undefined;
    let released = false;

    nav.wakeLock
      ?.request("screen")
      .then((lock) => {
        if (released) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      })
      .catch(() => {});

    return () => {
      released = true;
      sentinel?.release().catch(() => {});
    };
  }, [phase, finished]);

  const start = useCallback(() => {
    // iOS bazı sürümlerde sesi yalnızca doğrudan dokunuş içinde açıyor.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const warmUp = new SpeechSynthesisUtterance(" ");
      warmUp.volume = 0;
      window.speechSynthesis.speak(warmUp);
    }
    if (musicOn) {
      const player = ensureMusic();
      void player.start();
      player.duck();
    }
    setIndex(0);
    setPhase("playing");
  }, [ensureMusic, musicOn]);

  const toggle = useCallback(() => {
    setPhase((current) => {
      if (current === "playing") return "paused";
      if (current === "paused") {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const warmUp = new SpeechSynthesisUtterance(" ");
          warmUp.volume = 0;
          window.speechSynthesis.speak(warmUp);
        }
        return "playing";
      }
      return current;
    });
  }, []);

  const goTo = useCallback((next: number) => {
    setIndex(Math.max(0, Math.min(next, words.length)));
  }, []);

  const restart = useCallback(() => {
    if (musicOn) {
      const player = ensureMusic();
      void player.start();
      player.duck();
    }
    setIndex(0);
    setPhase("playing");
  }, [ensureMusic, musicOn]);

  /* ——— klavye ——— */
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") return;
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        toggleMusic();
        return;
      }
      if (phase === "intro") {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          start();
        }
        return;
      }
      if (finished) {
        if (
          event.key === " " ||
          event.key === "Enter" ||
          event.key.toLowerCase() === "r"
        ) {
          event.preventDefault();
          restart();
        }
        return;
      }
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        toggle();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goTo(index + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        restart();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, index, finished, start, toggle, goTo, restart, toggleMusic]);

  if (phase === "intro") {
    return (
      <main className="night-stage grain grain-light flex min-h-dvh flex-col items-center justify-center px-6 py-12 text-center text-ivory">
        <div className="animate-fade-up flex flex-col items-center">
          <Crescent className="animate-breathe h-11 w-11 text-gold-soft" />
          <p className="smallcaps mt-9 text-[9px] text-ivory/45">
            Hilal · Kelime okuma
          </p>
          <h1 className="mt-4 font-display text-[clamp(2.7rem,11vw,4.6rem)] font-light leading-[0.95] tracking-[-0.03em]">
            Kelimeler
          </h1>
          <p className="mt-6 max-w-[19rem] text-[14px] leading-7 text-ivory/55">
            {wordCount} kelime sırayla ve sesli okunacak. Başlamak için dokun.
          </p>

          <button
            type="button"
            onClick={start}
            className="group mt-11 inline-flex items-center gap-4 border border-gold/45 px-8 py-4 text-ivory transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <span className="smallcaps text-[10px] tracking-[0.28em]">
              Okumaya başla
            </span>
            <svg
              viewBox="0 0 20 20"
              aria-hidden="true"
              className="h-3.5 w-3.5 text-gold transition-transform duration-500 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path d="M3 10h13M11 5l5 5-5 5" />
            </svg>
          </button>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ivory/45">
            <span>{wordCount} kelime</span>
            <span className="h-2.5 w-px bg-ivory/15" />
            <span>yaklaşık 2 dakika</span>
            <span className="h-2.5 w-px bg-ivory/15" />
            <span>Türkçe ses</span>
          </div>

          <button
            type="button"
            data-music-toggle
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label={
              musicOn
                ? "Keloğlan havasını kapat"
                : "Keloğlan havasını aç"
            }
            className={`mt-7 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 transition-colors ${
              musicOn
                ? "border-gold/35 text-gold-soft hover:bg-gold/10"
                : "border-ivory/12 text-ivory/35 hover:border-ivory/25 hover:text-ivory/60"
            }`}
          >
            <NoteIcon muted={!musicOn} />
            <span className="smallcaps text-[9px] tracking-[0.2em]">
              Keloğlan havası
            </span>
            <span
              className={`h-1 w-1 rounded-full ${
                musicOn ? "bg-gold" : "bg-ivory/25"
              }`}
            />
          </button>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 text-[10px] text-ivory/30">
          <p>
            {voiceLabel
              ? "Türkçe · çocuk sesi"
              : "Türkçe ses hazırlanıyor…"}
          </p>
          <Link
            href="/"
            className="underline decoration-ivory/20 underline-offset-4 transition-colors hover:text-ivory/70"
          >
            Barkodu indir
          </Link>
        </div>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="night-stage grain grain-light min-h-dvh overflow-y-auto text-ivory">
        <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 pb-16 pt-7 sm:px-10 sm:pt-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crescent className="h-5 w-5 text-gold" />
              <span className="smallcaps text-[9px] text-ivory/40">
                Hilal · Kelime okuma
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-[0.15em] text-ivory/30">
              {wordCount} / {wordCount}
            </span>
          </header>

          <div className="animate-fade-up mt-16 sm:mt-24">
            <Crescent className="h-8 w-8 text-gold/80" />
            <h1 className="mt-7 font-display text-[clamp(2.4rem,7vw,4rem)] font-light leading-[0.98] tracking-[-0.03em]">
              {wordCount} kelime
              <br />
              <span className="italic text-gold-soft">tamam.</span>
            </h1>
            <p className="mt-5 max-w-sm text-[13.5px] leading-7 text-ivory/45">
              Baştan dinlemek için aşağıdaki düğmeyi kullanabilirsin.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-3 border border-gold/45 px-6 py-3.5 text-ivory transition-colors hover:border-gold hover:bg-gold/10"
              >
                <svg
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-gold"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M4 10a6 6 0 1 0 1.8-4.3M4 3v4h4" />
                </svg>
                <span className="smallcaps text-[10px] tracking-[0.24em]">
                  Baştan oku
                </span>
              </button>
              <Link
                href="/"
                className="inline-flex items-center border border-ivory/15 px-6 py-3.5 text-ivory/55 transition-colors hover:border-ivory/35 hover:text-ivory"
              >
                <span className="smallcaps text-[10px] tracking-[0.24em]">
                  Barkod
                </span>
              </Link>
            </div>
          </div>

          <div className="hairline-light mt-14" />

          <ol className="mt-8 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
            {words.map((word, wordIndex) => (
              <li
                key={word}
                className="flex items-baseline gap-3 border-b border-ivory/[0.06] py-2.5"
              >
                <span className="font-mono text-[9px] text-gold/50">
                  {pad(wordIndex)}
                </span>
                <span className="font-display text-[15px] text-ivory/70">
                  {word}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </main>
    );
  }

  const current = words[Math.min(index, words.length - 1)];
  const progress = Math.min(100, ((index + 1) / wordCount) * 100);
  const wordSize = Math.min(14, 110 / current.length);

  return (
    <main className="night-stage grain grain-light relative flex h-dvh flex-col overflow-hidden text-ivory">
      <Crescent className="animate-breathe pointer-events-none absolute right-[3vmin] top-[17vh] h-[40vmin] w-[40vmin] text-gold/[0.045]" />

      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(1.4rem,env(safe-area-inset-top))] sm:px-9 sm:pt-8">
        <div className="flex items-center gap-3">
          <Crescent className="h-5 w-5 text-gold" />
          <span className="smallcaps text-[9px] text-ivory/45">
            Hilal · Kelime okuma
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[10px] tracking-[0.16em] text-ivory/40">
            {pad(Math.min(index, wordCount - 1))} / {wordCount}
          </span>
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            aria-pressed={muted}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
              muted
                ? "border-ivory/15 text-ivory/30"
                : "border-gold/40 text-gold hover:bg-gold/10"
            }`}
          >
            <SpeakerIcon muted={muted} />
          </button>
        </div>
      </header>

      <div className="relative z-10 mt-5 h-px w-full bg-ivory/[0.08] sm:mt-6">
        <div
          className="h-full bg-gold/70 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div
          key={index}
          className="animate-word-in flex max-w-[92vw] flex-col items-center text-center"
        >
          <WordImage
            word={current}
            className="reader-art w-[min(32vh,62vw,18rem)]"
          />
          <h1
            aria-live={muted ? "polite" : "off"}
            aria-atomic="true"
            style={{ fontSize: `clamp(2.4rem, ${wordSize}vw, 8.5rem)` }}
            className="reader-word mt-[clamp(1rem,2.6vh,1.75rem)] whitespace-nowrap font-display font-light leading-[0.95] tracking-[-0.025em]"
          >
            {current}
          </h1>
          <div className="mt-[clamp(0.85rem,2vh,1.5rem)] flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-gold/25" />
            <span className="h-1 w-1 rotate-45 bg-gold/60" />
            <span className="h-px w-12 bg-gold/25" />
          </div>
        </div>
      </div>

      <footer className="relative z-10 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-9 sm:pb-8">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <ControlButton
            label="Önceki kelime"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </ControlButton>

          <button
            type="button"
            onClick={toggle}
            aria-label={phase === "playing" ? "Duraklat" : "Devam et"}
            className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full border border-gold/45 bg-gold/[0.08] text-gold transition-colors hover:bg-gold/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            {phase === "playing" ? (
              <svg
                viewBox="0 0 20 20"
                className="h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="5.5" y="4.5" width="2.6" height="11" rx="0.4" />
                <rect x="11.9" y="4.5" width="2.6" height="11" rx="0.4" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 20 20"
                className="ml-1 h-5 w-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 4.6v10.8L15 10 6 4.6Z" />
              </svg>
            )}
          </button>

          <ControlButton
            label="Sonraki kelime"
            onClick={() => goTo(index + 1)}
            disabled={index >= wordCount - 1}
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M8 4l6 6-6 6" />
            </svg>
          </ControlButton>
        </div>

        <div className="reader-meta mx-auto mt-7 flex max-w-sm items-center justify-center gap-4 text-[10px] text-ivory/45">
          <button
            type="button"
            onClick={() =>
              setSpeed((value) => {
                const at = SPEEDS.indexOf(value);
                return SPEEDS[(at + 1) % SPEEDS.length];
              })
            }
            className="rounded-full border border-ivory/10 px-2.5 py-1 font-mono tracking-[0.08em] transition-colors hover:border-ivory/25 hover:text-ivory/60"
            aria-label="Okuma hızını değiştir"
          >
            {speed.toString().replace(".", ",")}×
          </button>
          <span className="h-3 w-px bg-ivory/12" />
          <button
            type="button"
            onClick={restart}
            className="tracking-[0.14em] transition-colors hover:text-ivory/65"
          >
            BAŞTAN
          </button>
          <span className="h-3 w-px bg-ivory/12" />
          <Link
            href="/"
            className="tracking-[0.14em] transition-colors hover:text-ivory/65"
          >
            BARKOD
          </Link>
        </div>

        <p className="reader-hint mt-6 hidden text-center text-[9px] tracking-[0.18em] text-ivory/25 sm:block">
          BOŞLUK DURAKLAT · ← → GEZİN · R BAŞTAN
        </p>
      </footer>
    </main>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/15 text-ivory/55 transition-colors hover:border-ivory/30 hover:text-ivory focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-25"
    >
      {children}
    </button>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M4 8v4h2.6L10 15V5L6.6 8H4Z" />
      {muted ? (
        <path d="M13 8l4 4m0-4l-4 4" />
      ) : (
        <>
          <path d="M12.6 7.6a3.4 3.4 0 0 1 0 4.8" />
          <path d="M14.8 5.6a6.2 6.2 0 0 1 0 8.8" />
        </>
      )}
    </svg>
  );
}

function NoteIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <path d="M7.8 5.1v7.1" />
      <path d="M7.8 5.1l6.1-1.3v7.1" />
      <ellipse cx="6" cy="12.6" rx="1.8" ry="1.4" />
      <ellipse cx="12.1" cy="11.3" rx="1.8" ry="1.4" />
      {muted ? <path d="M4 16 16 4" /> : null}
    </svg>
  );
}
