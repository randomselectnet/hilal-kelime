"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import { Crescent } from "@/components/crescent";
import { wordCount } from "@/lib/words";

type QrState = {
  png: string | null;
  svg: string;
  error: string | null;
};

const INITIAL: QrState = { png: null, svg: "", error: null };

/** Hazır boyutlar (cm). Elle değer girildiğinde bunların seçili durumu kalkar. */
const QR_PRESETS = [
  { id: "small", label: "Küçük", cm: 3 },
  { id: "medium", label: "Orta", cm: 5 },
  { id: "large", label: "Büyük", cm: 8 },
] as const;

const MIN_CM = 1;
const MAX_CM = 16;
const RECOMMENDED_MIN_CM = 2;
const PRINT_DPI = 600;

/** "4,5" veya "4.5" → 4.5; geçersizse null. */
function parseCm(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d*)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatCm(value: number): string {
  return String(Math.round(value * 100) / 100).replace(".", ",");
}

function pxForCm(cm: number): number {
  const pixels = Math.round((cm / 2.54) * PRINT_DPI);
  return Math.min(4096, Math.max(200, pixels));
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const subscribeNothing = () => () => {};
const getDefaultUrl = () =>
  SITE_URL
    ? `${SITE_URL.replace(/\/+$/, "")}/oku/`
    : `${window.location.origin}${BASE_PATH}/oku`;
const getServerUrl = () => "";

export default function QrPanel() {
  const defaultUrl = useSyncExternalStore(
    subscribeNothing,
    getDefaultUrl,
    getServerUrl,
  );
  const [draft, setDraft] = useState<string | null>(null);
  const [qr, setQr] = useState<QrState>(INITIAL);
  const [copied, setCopied] = useState(false);
  const [cmText, setCmText] = useState("5");
  const [cm, setCm] = useState(5);

  const qrMm = Math.round(cm * 100) / 10;
  const qrPx = pxForCm(cm);
  const cmTiny = cm < RECOMMENDED_MIN_CM;
  const compactPrint = qrMm < 30;
  const printCardMm = compactPrint
    ? Math.max(qrMm + 16, 44)
    : qrMm + 20;
  const printTitlePx = compactPrint
    ? 16
    : qrMm >= 80
      ? 24
      : qrMm >= 50
        ? 20
        : 17;
  const parsedCm = parseCm(cmText);
  const cmOutOfRange =
    parsedCm !== null && (parsedCm < MIN_CM || parsedCm > MAX_CM);

  const url = draft ?? defaultUrl;
  const qrView = url.trim() ? qr : INITIAL;

  function selectPreset(presetCm: number) {
    setCm(presetCm);
    setCmText(formatCm(presetCm));
  }

  function changeCm(value: string) {
    setCmText(value);
    const parsed = parseCm(value);
    if (parsed !== null && parsed >= MIN_CM && parsed <= MAX_CM) {
      setCm(Math.round(parsed * 100) / 100);
    }
  }

  function commitCm() {
    setCmText(formatCm(cm));
  }

  useEffect(() => {
    const value = url.trim();
    if (!value) return;

    let alive = true;
    const timer = window.setTimeout(async () => {
      try {
        const options = {
          errorCorrectionLevel: "H" as const,
          margin: 3,
          color: { dark: "#17130d", light: "#ffffff" },
        };
        const [png, svg] = await Promise.all([
          QRCode.toDataURL(value, { ...options, width: qrPx }),
          QRCode.toString(value, { ...options, type: "svg" }),
        ]);
        if (alive) setQr({ png, svg, error: null });
      } catch {
        if (alive) {
          setQr({
            png: null,
            svg: "",
            error: "Barkod üretilemedi. Adresi kontrol et.",
          });
        }
      }
    }, 200);

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [url, qrPx]);

  const parsed = useMemo(() => {
    try {
      return new URL(url);
    } catch {
      return null;
    }
  }, [url]);

  const isLocal = useMemo(() => {
    if (!parsed) return false;
    const host = parsed.hostname;
    return (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      host === "::1" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
  }, [parsed]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function downloadPng() {
    if (!qrView.png) return;
    const link = document.createElement("a");
    link.href = qrView.png;
    link.download = `hilal-barkod-${formatCm(cm).replace(",", ".")}cm.png`;
    link.click();
  }

  function downloadSvg() {
    if (!qrView.svg) return;
    const blob = new Blob([qrView.svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "hilal-barkod.svg";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div>
      <div className="screen-only lg:sticky lg:top-10">
        <div className="relative mx-auto w-full max-w-[380px]">
          <div className="relative border border-ink/15 bg-white p-5 shadow-[0_36px_70px_-40px_rgba(23,19,13,0.65)] sm:p-6">
            <Corner className="left-2 top-2 border-l border-t" />
            <Corner className="right-2 top-2 border-r border-t" />
            <Corner className="bottom-2 left-2 border-b border-l" />
            <Corner className="bottom-2 right-2 border-b border-r" />

            <div className="flex items-baseline justify-between px-1">
              <span className="font-display text-base tracking-[0.01em]">
                Hilal
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink/45">
                {wordCount} kelime
              </span>
            </div>

            <div className="mt-4 aspect-square w-full bg-white">
              {qrView.png ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrView.png}
                  alt="Hilal kelime okuma barkodu"
                  width={512}
                  height={512}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center border border-dashed border-ink/15">
                  <span className="smallcaps animate-pulse text-[9px] text-ink/35">
                    {!url.trim()
                      ? "Adres bekleniyor"
                      : qrView.error
                        ? "Barkod yok"
                        : "Hazırlanıyor"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/10 px-1 pt-3">
              <span className="font-display text-[15px] italic text-oxblood">
                Kelime okuma
              </span>
              <Crescent className="h-3.5 w-3.5 text-gold" />
            </div>

            <p className="mt-2 break-all px-1 font-mono text-[9px] leading-4 text-ink/40">
              {url || "https://…/oku"}
            </p>
          </div>

          <div className="mt-5 border border-ink/12 bg-white/45 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="smallcaps text-[9px] text-ink-soft">
                Barkod boyu
              </span>
              <span className="font-mono text-[9px] tracking-[0.1em] text-ink/35">
                {formatCm(cm)} cm · {qrPx} px
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {QR_PRESETS.map((preset) => {
                const active = Math.abs(preset.cm - cm) < 0.001;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset.cm)}
                    aria-pressed={active}
                    className={`flex h-12 flex-col items-center justify-center border transition-colors ${
                      active
                        ? "border-ink bg-ink text-ivory"
                        : "border-ink/15 bg-white/40 text-ink-soft hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    <span className="text-[11px] font-medium tracking-[0.02em]">
                      {preset.label}
                    </span>
                    <span
                      className={`font-mono text-[9px] ${
                        active ? "text-ivory/55" : "text-ink/35"
                      }`}
                    >
                      {formatCm(preset.cm)} cm
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
              <label
                htmlFor="qr-cm"
                className="text-[11px] text-ink-soft"
              >
                Kendi ölçün
              </label>
              <div className="flex items-baseline gap-1.5">
                <input
                  id="qr-cm"
                  value={cmText}
                  onChange={(event) => changeCm(event.target.value)}
                  onBlur={commitCm}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  aria-describedby={
                    cmOutOfRange
                      ? "qr-cm-hint"
                      : cmTiny
                        ? "qr-cm-tiny"
                        : undefined
                  }
                  className={`h-8 w-16 border bg-white/70 px-2 text-right font-mono text-[13px] text-ink outline-none transition-colors ${
                    cmOutOfRange
                      ? "border-oxblood"
                      : "border-ink/20 focus:border-oxblood"
                  }`}
                  placeholder="5"
                />
                <span className="text-[11px] text-ink-soft">cm</span>
              </div>
            </div>

            {cmOutOfRange ? (
              <p id="qr-cm-hint" className="mt-2 text-[10px] text-oxblood">
                {MIN_CM}–{MAX_CM} cm arasında bir değer gir.
              </p>
            ) : cmTiny ? (
              <p
                id="qr-cm-tiny"
                className="mt-2 text-[10px] leading-4 text-oxblood/80"
              >
                2 cm altı çok küçük; baskıda okutmak zorlaşabilir.
              </p>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={downloadPng}
              disabled={!qrView.png}
              className="col-span-1 inline-flex h-11 items-center justify-center gap-2 bg-ink px-4 text-[12px] font-medium tracking-[0.02em] text-ivory transition-colors hover:bg-oxblood disabled:cursor-not-allowed disabled:opacity-40"
            >
              PNG indir
            </button>
            <button
              type="button"
              onClick={downloadSvg}
              disabled={!qrView.svg}
              className="col-span-1 inline-flex h-11 items-center justify-center gap-2 border border-ink/25 px-4 text-[12px] font-medium tracking-[0.02em] text-ink transition-colors hover:border-ink hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            >
              SVG indir
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!qrView.png}
              className="col-span-2 inline-flex h-11 items-center justify-center gap-2 border border-ink/15 bg-white/50 px-4 text-[12px] font-medium tracking-[0.02em] text-ink-soft transition-colors hover:border-ink/35 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              Yazdır
              <span className="text-ink/35">· yalnızca kart çıkar</span>
            </button>
          </div>

          <div className="mt-6 border border-ink/12 bg-white/45 p-4">
            <label
              htmlFor="qr-url"
              className="smallcaps block text-[9px] text-ink-soft"
            >
              Barkodun açacağı adres
            </label>
            <input
              id="qr-url"
              value={url}
              onChange={(event) => setDraft(event.target.value)}
              spellCheck={false}
              autoComplete="off"
              className="mt-2 w-full border-b border-ink/20 bg-transparent pb-1.5 font-mono text-[11px] text-ink outline-none transition-colors focus:border-oxblood"
              placeholder="https://site-adresin.com/oku"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={copyLink}
                disabled={!url}
                className="text-[11px] text-ink-soft underline decoration-ink/25 underline-offset-4 transition-colors hover:text-oxblood disabled:opacity-40"
              >
                {copied ? "Kopyalandı" : "Bağlantıyı kopyala"}
              </button>
              <div className="flex items-center gap-3 text-[11px] text-ink-soft">
                {defaultUrl && url !== defaultUrl ? (
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="underline decoration-ink/25 underline-offset-4 transition-colors hover:text-oxblood"
                  >
                    Sıfırla
                  </button>
                ) : null}
                <a
                  href={url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-ink/25 underline-offset-4 transition-colors hover:text-oxblood"
                >
                  Önizle
                </a>
              </div>
            </div>

            {isLocal ? (
              <p className="mt-3 border-t border-ink/10 pt-3 text-[11px] leading-5 text-oxblood/85">
                Bu adres yalnızca bu bilgisayarda açılır. Telefonla test etmek
                için siteyi yayına al (ör. Vercel) ya da aynı ağdaki
                bilgisayarın yerel IP adresini yaz.
              </p>
            ) : null}

            {qrView.error ? (
              <p className="mt-3 border-t border-ink/10 pt-3 text-[11px] leading-5 text-oxblood">
                {qrView.error}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="print-only items-center justify-center">
        <div
          className={`print-card border border-black/15 bg-white text-center ${
            compactPrint ? "p-[4mm]" : "p-[5mm]"
          }`}
          style={{ width: `${printCardMm}mm` }}
        >
          {compactPrint ? (
            <p className="font-display text-base">Hilal</p>
          ) : (
            <div className="flex items-center justify-between border-b border-black/10 pb-[3mm]">
              <span className="font-display text-lg">Hilal</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
                {wordCount} kelime
              </span>
            </div>
          )}
          {qrView.png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrView.png}
              alt="Hilal kelime okuma barkodu"
              className={`mx-auto block ${
                compactPrint ? "mt-[3mm]" : "mt-[5mm]"
              }`}
              style={{ width: `${qrMm}mm` }}
            />
          ) : null}
          <p
            className={`font-display ${
              compactPrint ? "mt-[3mm]" : "mt-[4mm]"
            }`}
            style={{ fontSize: `${printTitlePx}px` }}
          >
            Kelimeleri dinle
          </p>
          {compactPrint ? null : (
            <p className="mt-2 text-[11px] leading-5 text-black/55">
              Telefonun kamerasını barkoda tut, bağlantı açılsın.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Corner({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute h-3 w-3 border-gold/70 ${className}`}
    />
  );
}
