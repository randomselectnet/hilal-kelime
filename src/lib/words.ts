/**
 * Okunacak kelimeler. Sıra korunur.
 * Yeni kelime eklemek için listeye eklemek yeterlidir; sayaç ve süre otomatik uyum sağlar.
 *
 * Kaynak kartı ("Kaynakça") sona eklenmiştir; istenirse listeden çıkarılabilir.
 */
export const words = [
  "Akçe",
  "Azık",
  "Basma",
  "Bey",
  "Buyruk",
  "Cüsse",
  "Çadır",
  "Çerağ",
  "Çerçi",
  "Değirmen",
  "Destur",
  "Diyar",
  "Efsun",
  "Gaip",
  "İbrik",
  "Kavuk",
  "Kilim",
  "Meşale",
  "Müjde",
  "Nasihat",
  "Öreke",
  "Padişah",
  "Pusat",
  "Sadak",
  "Sancak",
  "Sultan",
  "Şifalı",
  "Yalak",
  "Zanaat",
  "Zindan",
  "Kaynakça",
] as const;

export const wordCount = words.length;

export function pad(index: number): string {
  return String(index + 1).padStart(2, "0");
}
