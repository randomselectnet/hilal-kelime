/**
 * Kelime resmi — simge dosyasını maske olarak kullanır, rengi `currentColor`dan alır.
 * Dekoratiftir; ekran okuyuculardan gizlenir.
 */
import type { CSSProperties } from "react";
import { artFor } from "@/lib/word-art";

export function WordArt({
  word,
  className,
  style,
}: {
  word: string;
  className?: string;
  style?: CSSProperties;
}) {
  const url = artFor(word);
  if (!url) return null;

  const mask = `url("${url}")`;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        ...style,
      }}
    />
  );
}
