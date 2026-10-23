# Hilal — Kelime Okuma

**Yayında:** <https://randomselectnet.github.io/hilal-kelime/>

Tek bir QR barkod ve kırk bir kelime. Barkodu yazdırıp bir yere yapıştırıyorsun;
telefonun kamerası okuttuğunda site açılıyor ve kelimeler sırayla, Türkçe sesle
okunuyor.

## Nasıl çalışır

- `/` — Barkod sayfası. QR kodu ekrandaki adrese göre üretilir; PNG (2048×2048)
  veya SVG olarak indirilebilir, doğrudan yazdırılabilir (A4, yalnızca kart çıkar).
- `/oku` — Okuma ekranı. Tek tek kelime gösterir, Türkçe sesle okur ve otomatik
  ilerler. `Duraklat`, `Önceki/Sonraki`, hız (`1×`), sesi kapatma ve `Baştan`
  kontrolleri vardır. Klavye: `Boşluk` duraklat, `←` `→` gezin, `R` baştan.

Sesli okuma tarayıcının `speechSynthesis` özelliğini kullanır. Cihazda Türkçe
kadın/çocuk sesi varsa o tercih edilir; ayrıca perde yükseltilerek kız çocuk
tonuna yaklaştırılır. Tarayıcılar sesi yalnızca bir dokunuştan sonra
başlatabildiği için okuma ekranında **“Okumaya başla”** düğmesine bir kez dokunmak
gerekir. Cihazda Türkçe bir ses yüklü değilse kelimeler yine sırayla gösterilir.

## Yerelde çalıştırma

```bash
npm install
npm run dev
```

Ardından <http://localhost:3000> adresini aç.

> Yerel adres (`localhost`) telefonun erişebileceği bir adres değildir. Telefonla
> denemek için siteyi yayına al ya da aynı ağdaki bilgisayarın IP'sini kullan.

## Yayına alma ve barkodu yazdırma

Site GitHub Pages'te yayınlanıyor. `main` dalına yapılan her push, GitHub Actions
ile statik çıktıyı (`out/`) derleyip yayına alır
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

1. Yayındaki adresi telefonda aç, barkodun doğru adresi gösterdiğini gör.
2. **PNG indir** ile barkodu indir ya da **Yazdır** ile kartı doğrudan yazdır.
3. Yazdırırken kâğıt boyutu A4 seçilebilir; yazdırma çıktısında yalnızca barkod
   kartı görünür. Kart yaklaşık 96 mm genişliğindedir; QR'ı en az 3×3 cm olacak
   şekilde yazdırmak okutmayı kolaylaştırır.
4. Kartı kes, istediğin yere yapıştır. Telefon kamerasıyla okut.

Barkodun hedef adresi sayfadaki **“Barkodun açacağı adres”** alanından
değiştirilebilir. Varsayılan olarak `NEXT_PUBLIC_SITE_URL` + `/oku/` kullanılır;
bu değer tanımlı değilse sitenin kendi adresi + `/oku` kullanılır.

Başka bir yere (ör. Vercel) taşımak istersen `output: "export"` gerekmez:
`STATIC_EXPORT` ortam değişkenini kaldırıp normal Next.js build'i kullanabilirsin.

## Kelimeleri değiştirme

Kelimeler [`src/lib/words.ts`](src/lib/words.ts) dosyasındadır. Listeye kelime
ekleyip çıkarabilirsin; sayaçlar, ilerleme çubuğu ve bitiş ekranı otomatik uyum
sağlar.

## Teknolojiler

- Next.js 16 (App Router, Cache Components)
- React 19
- Tailwind CSS 4
- `qrcode` — barkod üretimi (istemci tarafında)
- `next/font` — Fraunces & Manrope
