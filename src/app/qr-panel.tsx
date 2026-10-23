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

  const url = draft ?? defaultUrl;
  const qrView = url.trim() ? qr : INITIAL;

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
          QRCode.toDataURL(value, { ...options, width: 2048 }),
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
  }, [url]);

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
    link.download = "hilal-barkod.png";
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

          <div className="mt-5 grid grid-cols-2 gap-2">
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
        <div className="print-card border border-black/15 bg-white p-8 text-center">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <span className="font-display text-lg">Hilal</span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
              {wordCount} kelime
            </span>
          </div>
          {qrView.png ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrView.png}
              alt="Hilal kelime okuma barkodu"
              className="mx-auto mt-6 w-[82mm]"
            />
          ) : null}
          <p className="mt-6 font-display text-2xl">Kelimeleri dinle</p>
          <p className="mt-2 text-[11px] leading-5 text-black/55">
            Telefonun kamerasını barkoda tut, bağlantı açılsın.
          </p>
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
