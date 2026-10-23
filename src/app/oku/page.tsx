import type { Metadata } from "next";
import Reader from "./reader";

export const metadata: Metadata = {
  title: "Kelimeler",
  description:
    "Kırk kelime, sırayla ve Türkçe sesle. Okumaya başlamak için dokun.",
};

export default function ReadPage() {
  return <Reader />;
}
