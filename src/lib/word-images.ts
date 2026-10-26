import { wordImageFiles } from "./word-images.generated";

/** Statik dışa aktarımda site alt dizinde yayınlanabilir. */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function imageFor(word: string): string | undefined {
  const file = wordImageFiles[word];
  return file ? `${BASE_PATH}/images/${encodeURIComponent(file)}` : undefined;
}

export function hasImage(word: string): boolean {
  return Boolean(wordImageFiles[word]);
}
