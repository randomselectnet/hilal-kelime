# Hilal — Kelime Okuma

**Yayında:** <https://randomselectnet.github.io/hilal-kelime/>

Tek bir QR barkod ve otuz bir kelime. Barkodu yazdırıp bir yere yapıştırıyorsun;
telefonun kamerası okuttuğunda site açılıyor ve kelimeler sırayla, Türkçe sesle
okunuyor.

## Nasıl çalışır

- `/` — Barkod sayfası. QR kodu ekrandaki adrese göre üretilir. Üç hazır boyut
  (3, 5 ve 8 cm) vardır; ayrıca 1–16 cm arasında ondalıklı bir ölçü elle
  girilebilir (`4,5` gibi). PNG çözünürlüğü 600 DPI'dan hesaplanır. PNG veya SVG
  olarak indirilebilir, doğrudan yazdırılabilir (A4, yalnızca kart çıkar).
- `/oku` — Okuma ekranı. Tek tek kelime gösterir, Türkçe sesle okur ve otomatik
  ilerler. `Duraklat`, `Önceki/Sonraki`, hız (`1×`), sesi kapatma ve `Baştan`
  kontrolleri vardır. Klavye: `Boşluk` duraklat, `←` `→` gezin, `R` baştan.

Sesli okuma tarayıcının `speechSynthesis` özelliğini kullanır. Cihazda Türkçe
kadın/çocuk sesi varsa o tercih edilir; ayrıca perde yükseltilerek kız çocuk
tonuna yaklaştırılır. Tarayıcılar sesi yalnızca bir dokunuştan sonra
başlatabildiği için okuma ekranında **“Okumaya başla”** düğmesine bir kez dokunmak
gerekir. Cihazda Türkçe bir ses yüklü değilse kelimeler yine sırayla gösterilir.

## Arka plan müziği

Okuma ekranında [`public/audio/keloglan-muzik.mp3`](public/audio/keloglan-muzik.mp3)
döngüde çalar. Kelimeler okunurken müziğin sesi otomatik olarak kısılır, böylece
sesli okumanın önüne geçmez. Müzik, ekrandaki **“Keloğlan havası”** düğmesiyle
kapatılıp açılabilir.

Tarayıcılar kullanıcı etkileşimi olmadan sesli otomatik oynatmayı engellediği
için müzik sayfa açıldığı anda değil, ilk dokunuşta başlar. QR ile açılan okuma
ekranında **“Okumaya başla”** dokunuşu bu ilk etkileşimdir.

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
2. **Barkod boyu**ndan hazır bir boyut seç ya da **Kendi ölçün** alanına
   1–16 cm arasında ondalıklı bir değer yaz (ör. `4,5`). **PNG indir** ile
   barkodu indir ya da **Yazdır** ile kartı doğrudan yazdır.
3. Yazdırırken kâğıt boyutu A4 seçilebilir; yazdırma çıktısında yalnızca barkod
   kartı görünür. Kart genişliği seçilen ölçüye göre büyür; QR'ı en az
   2×2 cm (tercihen 3×3 cm) yazdırmak okutmayı kolaylaştırır. 2 cm altındaki
   ölçülerde okutma zorlaşabilir.
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

## Kelimelere resim ekleme

Okuma ekranı her kelimeyi kendi resmiyle birlikte gösterir. Resimler
[`public/images`](public/images) klasörüne, kelimenin adıyla konur:

```
public/images/Akçe.jpg
public/images/Çadır.webp
```

Türkçe karakterler ve büyük/küçük harf farkı sorun değildir; `akce.jpg` de
`Akçe.jpg` ile aynı kelimeye bağlanır. `.webp`, `.avif`, `.jpg`, `.jpeg`,
`.png` ve `.svg` desteklenir. Ayrıntılar ve tüm beklenen dosya adları:
[`public/images/README.md`](public/images/README.md).

Eşleme, `npm run images` ile `public/images` taranarak
[`src/lib/word-images.generated.ts`](src/lib/word-images.generated.ts) dosyasına
yazılır. Bu komut `npm run dev` ve `npm run build` öncesinde kendiliğinden
çalışır. Resmi henüz eklenmemiş kelimelerde mevcut altın simge yer tutucu olarak
görünür; resimler parça parça eklenebilir.

## Teknolojiler

- Next.js 16 (App Router, Cache Components)
- React 19
- Tailwind CSS 4
- `qrcode` — barkod üretimi (istemci tarafında)
- `next/font` — Fraunces & Manrope
