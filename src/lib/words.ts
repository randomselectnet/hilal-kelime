/**
 * Okunacak kelimeler. Sıra korunur.
 * Yeni kelime eklemek için listeye eklemek yeterlidir; sayaç ve süre otomatik uyum sağlar.
 */
export const words = [
  "Akçe",
  "Azık",
  "Bey",
  "Buyruk",
  "Cenk",
  "Cüsse",
  "Çadır",
  "Çerçi",
  "Değirmen",
  "Destur",
  "Efsun",
  "Ferman",
  "Gaip",
  "Heybe",
  "Heybet",
  "Ilıca",
  "İbrik",
  "Kadı",
  "Kağnı",
  "Kavuk",
  "Kervan",
  "Maya",
  "Meşale",
  "Müjde",
  "Nasihat",
  "Nükte",
  "Obur",
  "Ozan",
  "Öreke",
  "Padişah",
  "Pusat",
  "Rıza",
  "Sadak",
  "Sancak",
  "Şifalı",
  "Tılsım",
  "Ulak",
  "Vezir",
  "Yağız",
  "Yaren",
  "Zanaat",
] as const;

export const wordCount = words.length;

export function pad(index: number): string {
  return String(index + 1).padStart(2, "0");
}
