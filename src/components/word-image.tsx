"use client";

import { useCallback, useState } from "react";
import { WordArt } from "@/components/word-art";
import { imageFor } from "@/lib/word-images";

/**
 * Kelime resmi. `public/images` içinde eşleşen bir fotoğraf varsa onu gösterir;
 * yoksa (ya da yüklenemezse) mevcut altın simgeyi yer tutucu olarak bırakır.
 */
export function WordImage({
  word,
  className,
}: {
  word: string;
  className?: string;
}) {
  const src = imageFor(word);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const ready = Boolean(src) && loadedSrc === src;
  const failed = Boolean(src) && failedSrc === src;

  const registerImage = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !src || !node.complete) return;
      if (node.naturalWidth > 0) setLoadedSrc(src);
      else setFailedSrc(src);
    },
    [src],
  );

  return (
    <figure
      aria-hidden="true"
      className={`relative aspect-[3/4] select-none ${className ?? ""}`}
    >
      <div className="absolute inset-0 border border-gold/20 bg-gold/[0.03]" />
      <span className="pointer-events-none absolute -left-px -top-px h-5 w-5 border-l border-t border-gold/60" />
      <span className="pointer-events-none absolute -right-px -top-px h-5 w-5 border-r border-t border-gold/60" />
      <span className="pointer-events-none absolute -bottom-px -left-px h-5 w-5 border-b border-l border-gold/60" />
      <span className="pointer-events-none absolute -bottom-px -right-px h-5 w-5 border-b border-r border-gold/60" />

      <div className="absolute inset-[7px] overflow-hidden bg-night-raised">
        <WordArt
          word={word}
          className={`absolute inset-[22%] text-gold/30 transition-opacity duration-700 ${
            ready ? "opacity-0" : "opacity-100"
          }`}
        />

        {src && !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={registerImage}
            src={src}
            alt=""
            draggable={false}
            decoding="async"
            onLoad={() => setLoadedSrc(src)}
            onError={() => setFailedSrc(src)}
            className={`absolute inset-0 h-full w-full object-contain saturate-[0.97] transition-[opacity,transform] duration-1000 ease-out ${
              ready ? "scale-100 opacity-100" : "scale-[1.04] opacity-0"
            }`}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/55 via-night/0 to-night/15" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-ivory/[0.07]" />
      </div>
    </figure>
  );
}
