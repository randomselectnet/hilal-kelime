/**
 * Kelime resimlerini (Game Icons / Iconify) indirir ve eşleme dosyasını üretir.
 *
 *   node scripts/fetch-word-art.mjs
 *
 * Yeni bir kelime eklerken buradaki ART sözlüğüne de bir simge ekle.
 * Simge adları: https://icon-sets.iconify.design/game-icons/
 *
 * Lisans: Game Icons — CC BY 3.0 (https://github.com/game-icons/icons)
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ART = {
  "Akçe": "coins",
  "Azık": "knapsack",
  "Bey": "visored-helm",
  "Buyruk": "scroll-unfurled",
  "Cenk": "crossed-swords",
  "Cüsse": "muscular-torso",
  "Çadır": "camping-tent",
  "Çerçi": "swap-bag",
  "Değirmen": "windmill",
  "Destur": "hand",
  "Efsun": "magic-swirl",
  "Ferman": "scroll-quill",
  "Gaip": "semi-closed-eye",
  "Heybe": "saddle",
  "Heybet": "lion",
  "Ilıca": "water-splash",
  "İbrik": "amphora",
  "Kadı": "scales",
  "Kağnı": "chariot",
  "Kavuk": "turban",
  "Kervan": "camel",
  "Maya": "bread",
  "Meşale": "torch",
  "Müjde": "envelope",
  "Nasihat": "talk",
  "Nükte": "jester-hat",
  "Obur": "chicken-leg",
  "Ozan": "lyre",
  "Öreke": "spinning-wheel",
  "Padişah": "crown",
  "Pusat": "breastplate",
  "Rıza": "peace-dove",
  "Sadak": "quiver",
  "Sancak": "flag-objective",
  "Şifalı": "healing",
  "Tılsım": "pentacle",
  "Ulak": "sprint",
  "Vezir": "chess-queen",
  "Yağız": "horse-head",
  "Yaren": "three-friends",
  "Zanaat": "anvil",
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artDir = path.join(root, "public", "art");
const outFile = path.join(root, "src", "lib", "word-art.ts");

await mkdir(artDir, { recursive: true });

const names = [...new Set(Object.values(ART))];
const svgs = new Map();

for (const name of names) {
  const url = `https://api.iconify.design/game-icons/${name}.svg?color=%23ffffff&height=512`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${name}: ${response.status} ${response.statusText}`);
  }
  const svg = await response.text();
  svgs.set(name, svg.trim());
  await writeFile(path.join(artDir, `${name}.svg`), `${svg.trim()}\n`, "utf8");
  process.stdout.write(`✓ ${name}.svg\n`);
}

const entries = Object.entries(ART)
  .map(([word, name]) => `  ${JSON.stringify(word)}: ${JSON.stringify(name)},`)
  .join("\n");

const ts = `/**
 * Kelime → simge eşlemesi.
 *
 * Üretildi: \`node scripts/fetch-word-art.mjs\`
 * Simgeler: Game Icons (CC BY 3.0) — https://github.com/game-icons/icons
 * Dosyalar: public/art/<simge>.svg
 */
export const wordArt: Record<string, string> = {
${entries}
};

/** Simge dosyasının kök yolu (statik dışa aktarımda alt dizin olabilir). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function artFor(word: string): string | undefined {
  const name = wordArt[word];
  return name ? \`\${BASE_PATH}/art/\${name}.svg\` : undefined;
}
`;

await writeFile(outFile, ts, "utf8");
process.stdout.write(`\n${names.length} simge · ${outFile}\n`);
