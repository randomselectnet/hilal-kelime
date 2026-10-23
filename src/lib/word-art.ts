/**
 * Kelime → simge eşlemesi.
 *
 * Üretildi: `node scripts/fetch-word-art.mjs`
 * Simgeler: Game Icons (CC BY 3.0) — https://github.com/game-icons/icons
 * Dosyalar: public/art/<simge>.svg
 */
export const wordArt: Record<string, string> = {
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

/** Simge dosyasının kök yolu (statik dışa aktarımda alt dizin olabilir). */
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function artFor(word: string): string | undefined {
  const name = wordArt[word];
  return name ? `${BASE_PATH}/art/${name}.svg` : undefined;
}
