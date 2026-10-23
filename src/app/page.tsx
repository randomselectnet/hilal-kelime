import Link from "next/link";
import { Crescent } from "@/components/crescent";
import { wordCount } from "@/lib/words";
import QrPanel from "./qr-panel";

const steps = [
  {
    number: "01",
    title: "Yazdır",
    body: "Barkodu PNG olarak indir ya da doğrudan yazdır. Kartı kesip istediğin yere yapıştır.",
  },
  {
    number: "02",
    title: "Okut",
    body: "Telefonun kamerasını barkoda tut. Bağlantı kendiliğinden açılır, uygulama gerekmez.",
  },
  {
    number: "03",
    title: "Dinle",
    body: "“Okumaya başla”ya dokun; kelimeler sırayla, Türkçe sesle okunur.",
  },
];

export default function Home() {
  return (
    <main className="paper-stage grain relative min-h-dvh overflow-hidden">
      <Crescent className="pointer-events-none absolute -right-24 top-24 hidden h-[32rem] w-[32rem] text-ink/[0.045] lg:block print:hidden" />

      <header className="screen-only relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-7 sm:px-8 sm:pt-9">
        <Link href="/" className="group flex items-center gap-3">
          <Crescent className="h-6 w-6 text-oxblood transition-transform duration-500 group-hover:-rotate-12" />
          <span className="flex flex-col">
            <span className="font-display text-lg leading-none tracking-[0.02em]">
              Hilal
            </span>
            <span className="smallcaps mt-1 text-[9px] text-ink-soft">
              Kelime kiti
            </span>
          </span>
        </Link>

        <Link
          href="/oku"
          className="smallcaps border-b border-ink/25 pb-1 text-ink-soft transition-colors hover:border-oxblood hover:text-oxblood"
        >
          Okumayı dene
        </Link>
      </header>

      <section className="relative mx-auto grid max-w-6xl items-start gap-14 px-6 pb-20 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:pb-28">
        <div className="screen-only">
          <p className="smallcaps flex items-center gap-3 text-ink-soft">
            <span className="h-1 w-1 rounded-full bg-oxblood" />
            Yazdırılabilir barkod
          </p>

          <h1 className="mt-7 font-display text-[clamp(2.7rem,6.4vw,4.9rem)] font-light leading-[0.94] tracking-[-0.035em] text-ink">
            Tek barkod,
            <br />
            <span className="italic text-oxblood">{wordCount} kelime.</span>
          </h1>

          <p className="mt-7 max-w-md text-[15px] leading-7 text-ink-soft sm:text-base sm:leading-8">
            Barkodu yazdır, bir yere yapıştır. Telefon kamerası okuttuğunda bu
            sayfa açılır ve {wordCount} kelime sırayla, sesli olarak okunur.
          </p>

          <p className="mt-9 text-[12px] leading-6 text-ink-soft">
            {wordCount} kelime · Türkçe sesli okuma · Uygulama gerekmez
          </p>

          <div className="hairline mt-10" />

          <ol className="mt-8 space-y-0">
            {steps.map((step, index) => (
              <li
                key={step.number}
                className={`grid grid-cols-[3rem_1fr] gap-4 py-5 ${
                  index === 0 ? "" : "border-t border-ink/10"
                }`}
              >
                <span className="font-mono text-[11px] tracking-[0.12em] text-gold">
                  {step.number}
                </span>
                <div>
                  <h2 className="font-display text-xl tracking-[-0.01em]">
                    {step.title}
                  </h2>
                  <p className="mt-1.5 max-w-sm text-[13.5px] leading-6 text-ink-soft">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <QrPanel />
      </section>

      <footer className="screen-only relative mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-6 py-7 text-[11px] text-ink-soft sm:px-8">
        <span className="smallcaps text-[9px]">Hilal — Kelime okuma</span>
        <span>
          Sesli okuma tarayıcının Türkçe sesini kullanır. En iyi deneyim için
          sesi açık tutun.
        </span>
      </footer>
    </main>
  );
}
