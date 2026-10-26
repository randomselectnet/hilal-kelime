/**
 * `public/images` klasöründeki resimleri kelimelerle eşleştirir ve
 * `src/lib/word-images.generated.ts` dosyasını üretir.
 *
 *   node scripts/build-word-images.mjs
 *
 * Dosya adı kuralı: kelimenin kendisi ya da Türkçe karakterleri sadeleştirilmiş
 * hâli. Örnek: "Akçe" için `Akçe.jpg`, `akce.webp`, `01-akce.png` olabilir.
 * Desteklenen türler: webp, avif, jpg, jpeg, png, svg
 *
 * Resim ekledikten sonra `npm run dev` ya da `npm run build` bu betiği kendisi
 * çalıştırır. Geliştirme sunucusu açıkken resim eklersen `npm run images` yeterli.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const EXTENSIONS = ["webp", "avif", "jpg", "jpeg", "png", "svg"];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const imagesDir = path.join(root, "public", "images");
const wordsFile = path.join(root, "src", "lib", "words.ts");
const outFile = path.join(root, "src", "lib", "word-images.generated.ts");

/** "Ilıca" → "ilica", "  Akçe " → "akce", "01-İbrik" → "ibrik" */
function slugify(value) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Dosya adının başındaki sıra numarasını at: "01-akce" → "akce" */
function stripOrderPrefix(value) {
  return value.replace(/^\d+\s*[-_. ]+\s*/, "");
}

function rankOf(file) {
  const extension = path.extname(file).slice(1).toLowerCase();
  return EXTENSIONS.indexOf(extension);
}

async function readWords() {
  const source = await readFile(wordsFile, "utf8");
  const block = source.match(/export const words\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!block) {
    throw new Error("src/lib/words.ts içinde `export const words = [...] as const` bulunamadı.");
  }

  return [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((match) =>
    JSON.parse(`"${match[1]}"`),
  );
}

const words = await readWords();

await mkdir(imagesDir, { recursive: true });

let entries = [];
try {
  entries = await readdir(imagesDir, { withFileTypes: true });
} catch {
  entries = [];
}

/** slug → { file, rank } */
const found = new Map();
const skipped = [];

for (const entry of entries) {
  if (!entry.isFile()) continue;

  const extension = path.extname(entry.name).slice(1).toLowerCase();
  if (!EXTENSIONS.includes(extension)) {
    if (entry.name !== "README.md" && !entry.name.startsWith(".")) {
      skipped.push(entry.name);
    }
    continue;
  }

  const stem = entry.name.slice(0, -(extension.length + 1));
  const slug = slugify(stripOrderPrefix(stem));
  if (!slug) continue;

  const previous = found.get(slug);
  if (!previous || rankOf(entry.name) < previous.rank) {
    found.set(slug, { file: entry.name, rank: rankOf(entry.name) });
  } else {
    process.stdout.write(
      `! ${entry.name}: "${slug}" için zaten ${previous.file} var, atlandı.\n`,
    );
  }
}

const mapped = [];
const missing = [];

for (const word of words) {
  const match = found.get(slugify(word));
  if (match) {
    mapped.push([word, match.file]);
  } else {
    missing.push({ word, slug: slugify(word) });
  }
}

const usedSlugs = new Set(mapped.map(([word]) => slugify(word)));
for (const [slug, { file }] of found) {
  if (!usedSlugs.has(slug)) {
    process.stdout.write(
      `! ${file}: "${slug}" kelime listesinde yok, kullanılmadı.\n`,
    );
  }
}

const mapEntries = mapped
  .map(([word, file]) => `  ${JSON.stringify(word)}: ${JSON.stringify(file)},`)
  .join("\n");

const generated = `/**
 * OTOMATİK ÜRETİLDİ — bu dosyayı elle düzenleme.
 * Kaynak: public/images
 * Üretim: node scripts/build-word-images.mjs
 */
export const wordImageFiles: Record<string, string> = {
${mapEntries}
};

export const wordImageCount = ${mapped.length};
`;

await writeFile(outFile, generated, "utf8");

process.stdout.write(
  `\n${words.length} kelime · ${mapped.length} resim · ${missing.length} eksik\n`,
);
process.stdout.write(`→ ${path.relative(root, outFile)}\n`);

if (missing.length > 0) {
  process.stdout.write(
    `\nResim bekleyenler:\n${missing
      .map(({ word, slug }) => `  ${slug.padEnd(10)} ${word}`)
      .join("\n")}\n`,
  );
}

if (skipped.length > 0) {
  process.stdout.write(
    `\nDesteklenmeyen dosyalar: ${skipped.join(", ")}\n`,
  );
}
