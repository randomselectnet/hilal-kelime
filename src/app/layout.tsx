import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Hilal — Kelime Okuma",
    template: "%s · Hilal",
  },
  description:
    "Tek barkod, kırk kelime. Barkodu yazdır, telefon kamerasıyla okut; kelimeler sırayla ve sesli olarak okunsun.",
  applicationName: "Hilal",
  openGraph: {
    title: "Hilal — Kelime Okuma",
    description:
      "Barkodu okut, kelimeler sırayla okunsun. Yazdırılabilir QR kod ve Türkçe sesli okuma.",
    locale: "tr_TR",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f2e9d9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
